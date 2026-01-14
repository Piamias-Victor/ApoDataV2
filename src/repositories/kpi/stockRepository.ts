import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi';
import { FilterQueryBuilder } from '../utils/FilterQueryBuilder';

/**
 * Fetch Stock Value and Quantity at a specific point in time.
 * Uses `mv_stock_monthly` and "Last Known Value" logic (DISTINCT ON).
 */
export async function fetchStockData(request: AchatsKpiRequest, targetDate: string): Promise<{ stock_value_ht: number; stock_quantity: number; nb_references: number }> {
    const { laboratories = [], categories = [], pharmacyIds = [], groups = [], filterOperators = [] } = request;

    // Initialize Builder
    // NOTE: For Stock, we filter by 'mv.month_end_date <= targetDate' manually in the query structure,
    // so we pass an empty range to builder initially or handle it custom.
    // Initialize Builder
    const initialParams = [targetDate];
    const qb = new FilterQueryBuilder(initialParams, 2, filterOperators, {
        pharmacyId: 'mv.pharmacy_id',
        laboratory: 'mv.laboratory_name',
        productCode: 'mv.code_13_ref',
        tva: 'mv.tva_rate',
        reimbursable: 'mv.is_reimbursable',
        genericStatus: 'mv.bcb_generic_status',
        cat_l1: 'mv.category_name',
        // Removed explicit mappings for other levels to allow FilterQueryBuilder 
        // to use default 'gp.bcb_segment_lX' which we will support via JOIN.
    });

    // ... Filters ...
    qb.addPharmacies(pharmacyIds);
    qb.addLaboratories(laboratories);
    qb.addCategories(categories);
    if (request.productCodes) qb.addProducts(request.productCodes);
    qb.addGroups(groups);

    // ... Exclusions ...
    if (request.excludedPharmacyIds) qb.addExcludedPharmacies(request.excludedPharmacyIds);
    if (request.excludedLaboratories) qb.addExcludedLaboratories(request.excludedLaboratories);
    if (request.excludedCategories) qb.addExcludedCategories(request.excludedCategories);
    if (request.excludedProductCodes) qb.addExcludedProducts(request.excludedProductCodes);

    // ... Settings ...
    qb.addReimbursementStatus(request.reimbursementStatus);
    qb.addGenericStatus(request.isGeneric);

    const dynamicWhereClause = qb.getConditions();
    const params = qb.getParams();

    // Logic for JOIN
    // If we have category filters OTHER than L1 (which is in MV), we must join GP.
    // Also if we have exclusions on categories.
    const needsGlobalProductJoin = categories.some(c => c.type !== 'bcb_segment_l1') ||
        (groups && groups.length > 0) ||
        (request.excludedCategories && request.excludedCategories.length > 0);

    const query = `
    WITH LatestSnapshots AS (
        SELECT DISTINCT ON (mv.product_id)
            mv.stock,
            mv.stock_value_ht
        FROM mv_stock_monthly mv
        ${needsGlobalProductJoin ? 'LEFT JOIN data_globalproduct gp ON mv.code_13_ref = gp.code_13_ref' : ''}
        WHERE mv.month_end_date <= $1::date
          ${dynamicWhereClause}
        ORDER BY mv.product_id, mv.month_end_date DESC
    )
    SELECT 
        COALESCE(SUM(ls.stock), 0) as stock_quantity,
        COALESCE(SUM(ls.stock_value_ht), 0) as stock_value_ht,
        COUNT(*) as nb_references
    FROM LatestSnapshots ls;
  `;

    const startTime = Date.now();
    console.log('📦 [Repository] Executing Stock Query (Last Known Value):', {
        targetDate,
        laboratoriesCount: laboratories.length
    });

    try {
        const result = await db.query(query, params);
        const duration = Date.now() - startTime;

        const data = {
            stock_quantity: Number(result.rows[0]?.stock_quantity) || 0,
            stock_value_ht: Number(result.rows[0]?.stock_value_ht) || 0,
            nb_references: Number(result.rows[0]?.nb_references) || 0
        };

        console.log(`✅ [Repository] Stock Query completed: { quantity: ${data.stock_quantity}, value: ${data.stock_value_ht}, refs: ${data.nb_references}, duration: '${duration}ms' }`);

        return data;
    } catch (error) {
        console.error('❌ [Repository] Stock query failed:', error);
        throw error;
    }
}

/**
 * Get Stock Snapshots (Monthly) for interpolation
 */
export async function getStockSnapshots(request: AchatsKpiRequest): Promise<{ date: string; stock_qte: number }[]> {
    const { dateRange, pharmacyIds = [], laboratories = [], categories = [], productCodes = [], groups = [], filterOperators = [] } = request;

    const initialParams = [dateRange.start, dateRange.end];
    const qb = new FilterQueryBuilder(initialParams, 3, filterOperators, {
        pharmacyId: 'mv.pharmacy_id',
        laboratory: 'mv.laboratory_name',
        productCode: 'mv.code_13_ref',
        cat_l1: 'mv.category_name',
    });

    qb.addPharmacies(pharmacyIds);
    qb.addLaboratories(laboratories);
    qb.addCategories(categories);
    qb.addProducts(productCodes);
    qb.addGroups(groups);
    if (request.excludedPharmacyIds) qb.addExcludedPharmacies(request.excludedPharmacyIds);
    if (request.excludedLaboratories) qb.addExcludedLaboratories(request.excludedLaboratories);
    if (request.excludedCategories) qb.addExcludedCategories(request.excludedCategories);
    if (request.excludedProductCodes) qb.addExcludedProducts(request.excludedProductCodes);

    const conditions = qb.getConditions();
    const params = qb.getParams();

    const needsGlobalProductJoin = categories.some(c => c.type !== 'bcb_segment_l1') ||
        (groups && groups.length > 0) ||
        (request.excludedCategories && request.excludedCategories.length > 0);

    const query = `
        WITH MonthSpine AS (
            SELECT generate_series(
                DATE_TRUNC('month', $1::date), 
                DATE_TRUNC('month', $2::date), 
                '1 month'::interval
            ) as month_date
        ),
        -- Identify all pharmacies involved in this analysis (based on filters)
        ActivePharmacies AS (
            SELECT DISTINCT mv.pharmacy_id
            FROM mv_stock_monthly mv
            ${needsGlobalProductJoin ? 'LEFT JOIN data_globalproduct gp ON mv.code_13_ref = gp.code_13_ref' : ''}
            WHERE mv.month_end_date >= ($1::date - INTERVAL '1 month') 
              AND mv.month_end_date <= $2::date
              ${conditions}
        ),
        -- Create a grid: Every Pharmacy x Every Month
        PharmacyGrid AS (
            SELECT 
                m.month_date, 
                p.pharmacy_id
            FROM MonthSpine m
            CROSS JOIN ActivePharmacies p
        ),
        -- Get raw stock per Pharmacy per Month
        RawData AS (
            SELECT 
                DATE_TRUNC('month', mv.month_end_date) as month_date,
                mv.pharmacy_id,
                SUM(mv.stock) as raw_stock
            FROM mv_stock_monthly mv
            ${needsGlobalProductJoin ? 'LEFT JOIN data_globalproduct gp ON mv.code_13_ref = gp.code_13_ref' : ''}
            WHERE mv.month_end_date >= ($1::date - INTERVAL '1 month') 
              AND mv.month_end_date <= $2::date
              ${conditions}
            GROUP BY 1, 2
        ),
        -- Fill Gaps PER PHARMACY
        PharmacyFilled AS (
            SELECT 
                pg.month_date,
                pg.pharmacy_id,
                -- Partition logic for this specific pharmacy
                COUNT(NULLIF(r.raw_stock, 0)) OVER (PARTITION BY pg.pharmacy_id ORDER BY pg.month_date) as grp,
                r.raw_stock
            FROM PharmacyGrid pg
            LEFT JOIN RawData r ON pg.month_date = r.month_date AND pg.pharmacy_id = r.pharmacy_id
        ),
        PharmacyCorrected AS (
            SELECT
                month_date,
                pharmacy_id,
                COALESCE(
                    FIRST_VALUE(NULLIF(raw_stock, 0)) OVER (PARTITION BY pharmacy_id, grp ORDER BY month_date),
                    0
                ) as filled_stock
            FROM PharmacyFilled
        )
        -- Aggregate the Corrected Data
        SELECT 
            -- Fix Time Shift: Shift back by 1 month so 'Start of Month' aligns with the previous 'End of Month' snapshot visually
            (month_date - INTERVAL '1 month') as date,
            SUM(filled_stock) as stock_qte
        FROM PharmacyCorrected
        GROUP BY 1
        ORDER BY 1 ASC
    `;

    const result = await db.query(query, params);
    
    return result.rows.map(row => ({
        date: row.date.toISOString(),
        stock_qte: Number(row.stock_qte || 0)
    }));
}
// ... existing imports

/**
 * Get Average Stock Value over the last 12 months (inclusive of target month).
 */
export async function fetchAvgStock12Months(request: AchatsKpiRequest, targetDate: string): Promise<number> {
    const { pharmacyIds = [], laboratories = [], categories = [], productCodes = [], groups = [], filterOperators = [] } = request;

    // Range: [targetDate - 11 months, targetDate] -> Total 12 points usually
    const dateEnd = targetDate;
    // We want 12 months back. subSeconds(end, 12 months) approx or just use SQL interval
    const initialParams = [dateEnd];

    // Configure Builder (same mappings as fetchStockSnapshots)
    // We use $1 for end date, start date will be calculated in SQL or passed as $2
    const qb = new FilterQueryBuilder(initialParams, 2, filterOperators, {
        pharmacyId: 'mv.pharmacy_id',
        laboratory: 'mv.laboratory_name',
        productCode: 'mv.code_13_ref',
        cat_l1: 'mv.category_name',
    });

    qb.addPharmacies(pharmacyIds);
    qb.addLaboratories(laboratories);
    qb.addCategories(categories);
    qb.addProducts(productCodes);
    qb.addGroups(groups);
    if (request.excludedPharmacyIds) qb.addExcludedPharmacies(request.excludedPharmacyIds);
    if (request.excludedLaboratories) qb.addExcludedLaboratories(request.excludedLaboratories);
    if (request.excludedCategories) qb.addExcludedCategories(request.excludedCategories);
    if (request.excludedProductCodes) qb.addExcludedProducts(request.excludedProductCodes);

    const conditions = qb.getConditions();
    const params = qb.getParams();

    const needsGlobalProductJoin = categories.some(c => c.type !== 'bcb_segment_l1') ||
        (groups && groups.length > 0) ||
        (request.excludedCategories && request.excludedCategories.length > 0);

    // SQL: Average of SUM(stock_value_ht) per month
    const query = `
        WITH MonthlySums AS (
            SELECT 
                mv.month_end_date,
                SUM(mv.stock_value_ht) as monthly_val
            FROM mv_stock_monthly mv
            ${needsGlobalProductJoin ? 'LEFT JOIN data_globalproduct gp ON mv.code_13_ref = gp.code_13_ref' : ''}
            WHERE mv.month_end_date <= $1::date 
              AND mv.month_end_date > ($1::date - INTERVAL '12 month')
              ${conditions}
            GROUP BY mv.month_end_date
        )
        SELECT AVG(monthly_val) as avg_val_12m FROM MonthlySums;
    `;

    try {
        const result = await db.query(query, params);
        const avg = Number(result.rows[0]?.avg_val_12m) || 0;
        return avg;
    } catch (error) {
        console.error('❌ [Repository] Avg Stock 12M query failed:', error);
        throw error;
    }
}

/**
 * Fetch Restocking Data for the Restocking Table.
 * - Top 1000 products by Sales Volume (Last 6 Months).
 * - Joins Stock (Latest) and Prices.
 */
export async function fetchRestockingData(request: AchatsKpiRequest): Promise<any[]> {
    const { pharmacyIds = [], laboratories = [], categories = [], productCodes = [], groups = [], filterOperators = [] } = request;

    // Range for Sales Velocity: Last 6 Months
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    // Range for Orders / Ruptures: User Selected Period
    const orderStart = request.dateRange.start;
    const orderEnd = request.dateRange.end;

    // Params: $1=SalesStart, $2=SalesEnd(Today), $3=OrderStart, $4=OrderEnd
    const initialParams = [sixMonthsAgo.toISOString(), today.toISOString(), orderStart, orderEnd];

    // Builder for Filters (Offset 5 because we use $1..$4)
    const qb = new FilterQueryBuilder(initialParams, 5, filterOperators, {
        pharmacyId: 'mv.pharmacy_id',
        laboratory: 'mv.laboratory_name',
        productCode: 'mv.code_13_ref',
        cat_l1: 'mv.category_name',
    });

    qb.addPharmacies(pharmacyIds);
    qb.addLaboratories(laboratories);
    qb.addCategories(categories);
    qb.addProducts(productCodes);
    qb.addGroups(groups);
    if (request.excludedPharmacyIds) qb.addExcludedPharmacies(request.excludedPharmacyIds);
    if (request.excludedLaboratories) qb.addExcludedLaboratories(request.excludedLaboratories);
    if (request.excludedCategories) qb.addExcludedCategories(request.excludedCategories);
    if (request.excludedProductCodes) qb.addExcludedProducts(request.excludedProductCodes);

    // Settings
    qb.addReimbursementStatus(request.reimbursementStatus);
    qb.addGenericStatus(request.isGeneric);

    const conditions = qb.getConditions();
    const params = qb.getParams();

    const needsGlobalProductJoin = categories.some(c => c.type !== 'bcb_segment_l1') ||
        (groups && groups.length > 0) ||
        (request.excludedCategories && request.excludedCategories.length > 0);

    // Filter Logic for Orders (needs slightly different alias if not MV)
    // Actually, FilterQueryBuilder uses specific aliases passed in constructor.
    // 'mv.pharmacy_id' works for Sales/Stock MVs.
    // For Orders ('data_productorder' joined with internalproduct), we need 'ip.pharmacy_id'.
    // This is tricky with a single builder.
    // However, since we are writing raw SQL CTEs, we can replace aliases in the condition string if needed, 
    // OR we can alias the join in OrdersAgg to match 'mv'.
    // Let's alias `data_internalproduct` as `mv` (conceptual) inside OrdersAgg? No that's confusing.
    // Better strategy: Create a SECOND conditions string with swapped aliases?
    // Or just ensure we join `data_internalproduct ip` and Map `mv.` to `ip.` in the string.
    const orderConditions = conditions
        .replace(/mv\.pharmacy_id/g, 'ip.pharmacy_id')
        .replace(/mv\.laboratory_name/g, "COALESCE(gp.bcb_lab, 'AUTRES')") // GP join needed for Lab
        .replace(/mv\.code_13_ref/g, 'ip.code_13_ref_id')
        .replace(/mv\.category_name/g, "COALESCE(gp.bcb_segment_l1, 'AUTRES')"); 
        // Note: GP join is needed in OrdersAgg if we filter by Lab/Cat.

    // Limit clause
    const hasProductFilter = productCodes.length > 0 || laboratories.length > 0 || categories.length > 0;
    const limitClause = hasProductFilter ? '' : 'LIMIT 1000';

    const query = `
        WITH SalesAgg AS (
            SELECT 
                mv.internal_product_id,
                mv.code_13_ref,
                mv.laboratory_name,
                SUM(mv.quantity) as total_sales_6m
            FROM mv_sales_enriched mv
            ${needsGlobalProductJoin ? 'LEFT JOIN data_globalproduct gp ON mv.code_13_ref = gp.code_13_ref' : ''}
            WHERE mv.sale_date >= $1::date 
              AND mv.sale_date <= $2::date
              ${conditions}
            GROUP BY 1, 2, 3
        ),
        OrdersAgg AS (
            SELECT
                po.product_id,
                SUM(po.qte) as qte_commandee,
                SUM(po.qte_r) as qte_receptionnee
            FROM data_productorder po
            INNER JOIN data_order o ON po.order_id = o.id
            INNER JOIN data_internalproduct ip ON po.product_id = ip.id
            LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
            WHERE o.sent_date >= $3::date 
              AND o.sent_date <= $4::date
              ${orderConditions}
            GROUP BY 1
        ),
        LatestStock AS (
            SELECT 
                product_id,
                SUM(stock) as stock
            FROM (
                SELECT DISTINCT ON (product_id, pharmacy_id)
                    product_id, pharmacy_id, stock
                FROM mv_stock_monthly mv
                WHERE month_end_date <= $2::date
                  ${conditions}
                ORDER BY product_id, pharmacy_id, month_end_date DESC
            ) t
            GROUP BY product_id
        ),
        AvgStock AS (
            SELECT 
                product_id,
                AVG(monthly_stock_sum) as avg_stock_6m
            FROM (
                SELECT 
                    product_id, 
                    month_end_date, 
                    SUM(stock) as monthly_stock_sum
                FROM mv_stock_monthly mv
                WHERE month_end_date >= $1::date 
                  AND month_end_date <= $2::date
                  ${conditions}
                GROUP BY product_id, month_end_date
            ) monthly_totals
            GROUP BY product_id
        )
        SELECT 
            COALESCE(s.internal_product_id, o.product_id) as id,
            COALESCE(gp.name, ip.name) as name,
            COALESCE(s.code_13_ref, ip.code_13_ref_id) as code,
            COALESCE(s.laboratory_name, gp.bcb_lab) as labo,
            COALESCE(s.total_sales_6m, 0) as total_sales_6m,
            COALESCE(o.qte_commandee, 0) as qte_commandee,
            COALESCE(o.qte_receptionnee, 0) as qte_receptionnee,
            COALESCE(st.stock, 0) as stock_actuel,
            COALESCE(av.avg_stock_6m, 0) as stock_moyen,
            COALESCE(lp.weighted_average_price, 0) as prix_achat,
            COALESCE(lp.margin_percentage, 0) as marge_pct
        FROM SalesAgg s
        FULL OUTER JOIN OrdersAgg o ON s.internal_product_id = o.product_id
        LEFT JOIN data_internalproduct ip ON COALESCE(s.internal_product_id, o.product_id) = ip.id
        LEFT JOIN data_globalproduct gp ON COALESCE(s.code_13_ref, ip.code_13_ref_id) = gp.code_13_ref
        LEFT JOIN LatestStock st ON COALESCE(s.internal_product_id, o.product_id) = st.product_id
        LEFT JOIN AvgStock av ON COALESCE(s.internal_product_id, o.product_id) = av.product_id
        LEFT JOIN mv_latest_product_prices lp ON COALESCE(s.internal_product_id, o.product_id) = lp.product_id
        ORDER BY COALESCE(s.total_sales_6m, 0) DESC
        ${limitClause}
    `;
    try {
        const result = await db.query(query, params);

        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            code: row.code,
            labo: row.labo,
            sales_velocity: Number(row.total_sales_6m) / 6,
            qte_commandee: Number(row.qte_commandee),
            qte_receptionnee: Number(row.qte_receptionnee),
            stock_actuel: Number(row.stock_actuel),
            stock_moyen: Number(row.stock_moyen),
            prix_achat: Number(row.prix_achat),
            marge_pct: Number(row.marge_pct)
        }));
    } catch (error) {
        console.error('❌ [Repository] Restocking Data query failed:', error);
        throw error;
    }
}
