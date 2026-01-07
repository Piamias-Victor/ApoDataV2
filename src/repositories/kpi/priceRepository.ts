import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi';
import { FilterQueryBuilder } from '@/repositories/utils/FilterQueryBuilder';

export interface PriceGlobalKpiResult {
    my_avg_purchase_price: number;
    my_avg_purchase_price_evolution: number;
    group_avg_purchase_price: number;
    group_avg_purchase_price_evolution: number;

    my_avg_sell_price: number;
    my_avg_sell_price_evolution: number;
    group_avg_sell_price: number;
    group_avg_sell_price_evolution: number;

    my_avg_margin_rate: number;
    my_avg_margin_rate_evolution: number;
    group_avg_margin_rate: number;
    group_avg_margin_rate_evolution: number;
}

export async function fetchPriceGlobalKpis(request: AchatsKpiRequest): Promise<PriceGlobalKpiResult> {
    const { dateRange, pharmacyIds = [], laboratories = [], categories = [], productCodes = [], filterOperators = [] } = request;

    // Use current year vs previous year (or selected range vs N-1)
    // Assuming dateRange is the selected range. Compare with N-1 (same duration).
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    // Previous period: Same dates one year ago (standard N-1)
    const prevStart = new Date(start);
    prevStart.setFullYear(start.getFullYear() - 1);
    const prevEnd = new Date(end);
    prevEnd.setFullYear(end.getFullYear() - 1);

    const initialParams = [start, end, prevStart, prevEnd];
    const qb = new FilterQueryBuilder(initialParams, 5, filterOperators);

    // Apply product scope filters only (Not Pharmacy)
    qb.addLaboratories(laboratories);
    qb.addCategories(categories);
    qb.addProducts(productCodes);
    if (request.excludedLaboratories) qb.addExcludedLaboratories(request.excludedLaboratories);
    if (request.excludedCategories) qb.addExcludedCategories(request.excludedCategories);
    if (request.excludedProductCodes) qb.addExcludedProducts(request.excludedProductCodes);

    const conditions = qb.getConditions();
    const params = qb.getParams();

    // Pharmacy Filter Logic for "Me"
    // $5 is reserved for pharmacyIds manual handling if needed, but QB manages params.
    // We'll insert pharmacyIds as a parameter manually if not using QB for it.
    let pharmacyIdsParamIdx = params.length + 1;
    params.push(pharmacyIds.length > 0 ? pharmacyIds : null); // pass null if empty to trigger IS NULL in SQL

    const query = `
        WITH stats AS (
            SELECT
                -- MY SCOPE (Filtered by Pharmacy IDs)
                SUM(CASE WHEN ($${pharmacyIdsParamIdx}::uuid[] IS NULL OR mv.pharmacy_id = ANY($${pharmacyIdsParamIdx})) AND month >= $1 AND month <= $2 THEN mv.ht_purchased ELSE 0 END) as my_purchases_ht,
                SUM(CASE WHEN ($${pharmacyIdsParamIdx}::uuid[] IS NULL OR mv.pharmacy_id = ANY($${pharmacyIdsParamIdx})) AND month >= $1 AND month <= $2 THEN mv.qty_purchased ELSE 0 END) as my_purchases_qty,
                SUM(CASE WHEN ($${pharmacyIdsParamIdx}::uuid[] IS NULL OR mv.pharmacy_id = ANY($${pharmacyIdsParamIdx})) AND month >= $3 AND month <= $4 THEN mv.ht_purchased ELSE 0 END) as my_purchases_ht_prev,
                SUM(CASE WHEN ($${pharmacyIdsParamIdx}::uuid[] IS NULL OR mv.pharmacy_id = ANY($${pharmacyIdsParamIdx})) AND month >= $3 AND month <= $4 THEN mv.qty_purchased ELSE 0 END) as my_purchases_qty_prev,

                SUM(CASE WHEN ($${pharmacyIdsParamIdx}::uuid[] IS NULL OR mv.pharmacy_id = ANY($${pharmacyIdsParamIdx})) AND month >= $1 AND month <= $2 THEN mv.ttc_sold ELSE 0 END) as my_sales_ttc,
                SUM(CASE WHEN ($${pharmacyIdsParamIdx}::uuid[] IS NULL OR mv.pharmacy_id = ANY($${pharmacyIdsParamIdx})) AND month >= $1 AND month <= $2 THEN mv.qty_sold ELSE 0 END) as my_sales_qty,
                SUM(CASE WHEN ($${pharmacyIdsParamIdx}::uuid[] IS NULL OR mv.pharmacy_id = ANY($${pharmacyIdsParamIdx})) AND month >= $3 AND month <= $4 THEN mv.ttc_sold ELSE 0 END) as my_sales_ttc_prev,
                SUM(CASE WHEN ($${pharmacyIdsParamIdx}::uuid[] IS NULL OR mv.pharmacy_id = ANY($${pharmacyIdsParamIdx})) AND month >= $3 AND month <= $4 THEN mv.qty_sold ELSE 0 END) as my_sales_qty_prev,
                
                SUM(CASE WHEN ($${pharmacyIdsParamIdx}::uuid[] IS NULL OR mv.pharmacy_id = ANY($${pharmacyIdsParamIdx})) AND month >= $1 AND month <= $2 THEN mv.margin_sold ELSE 0 END) as my_margin_ht,
                SUM(CASE WHEN ($${pharmacyIdsParamIdx}::uuid[] IS NULL OR mv.pharmacy_id = ANY($${pharmacyIdsParamIdx})) AND month >= $1 AND month <= $2 THEN mv.ht_sold ELSE 0 END) as my_sales_ht,
                SUM(CASE WHEN ($${pharmacyIdsParamIdx}::uuid[] IS NULL OR mv.pharmacy_id = ANY($${pharmacyIdsParamIdx})) AND month >= $3 AND month <= $4 THEN mv.margin_sold ELSE 0 END) as my_margin_ht_prev,
                SUM(CASE WHEN ($${pharmacyIdsParamIdx}::uuid[] IS NULL OR mv.pharmacy_id = ANY($${pharmacyIdsParamIdx})) AND month >= $3 AND month <= $4 THEN mv.ht_sold ELSE 0 END) as my_sales_ht_prev,

                -- GROUP SCOPE (All Pharmacies)
                SUM(CASE WHEN month >= $1 AND month <= $2 THEN mv.ht_purchased ELSE 0 END) as group_purchases_ht,
                SUM(CASE WHEN month >= $1 AND month <= $2 THEN mv.qty_purchased ELSE 0 END) as group_purchases_qty,
                SUM(CASE WHEN month >= $3 AND month <= $4 THEN mv.ht_purchased ELSE 0 END) as group_purchases_ht_prev,
                SUM(CASE WHEN month >= $3 AND month <= $4 THEN mv.qty_purchased ELSE 0 END) as group_purchases_qty_prev,

                SUM(CASE WHEN month >= $1 AND month <= $2 THEN mv.ttc_sold ELSE 0 END) as group_sales_ttc,
                SUM(CASE WHEN month >= $1 AND month <= $2 THEN mv.qty_sold ELSE 0 END) as group_sales_qty,
                SUM(CASE WHEN month >= $3 AND month <= $4 THEN mv.ttc_sold ELSE 0 END) as group_sales_ttc_prev,
                SUM(CASE WHEN month >= $3 AND month <= $4 THEN mv.qty_sold ELSE 0 END) as group_sales_qty_prev,

                SUM(CASE WHEN month >= $1 AND month <= $2 THEN mv.margin_sold ELSE 0 END) as group_margin_ht,
                SUM(CASE WHEN month >= $1 AND month <= $2 THEN mv.ht_sold ELSE 0 END) as group_sales_ht,
                SUM(CASE WHEN month >= $3 AND month <= $4 THEN mv.margin_sold ELSE 0 END) as group_margin_ht_prev,
                SUM(CASE WHEN month >= $3 AND month <= $4 THEN mv.ht_sold ELSE 0 END) as group_sales_ht_prev

            FROM mv_product_stats_monthly mv
            -- Inner Join for Global Products if needed (usually view has it, but view is mv_product_stats_monthly).
            -- mv_product_stats_monthly has 'ean13', 'laboratory_name', etc.
            -- FilterQueryBuilder needs specific handling for 'mv' prefix?
            -- Let's check FilterQueryBuilder implementation or just use manual joins if complex.
            -- Usually FilterQueryBuilder works if aliases match.
            INNER JOIN data_internalproduct ip ON mv.product_id = ip.id
            LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
            WHERE (
                (month >= $1 AND month <= $2) OR (month >= $3 AND month <= $4)
            )
            ${conditions}
        )
        SELECT * FROM stats
    `;

    const result = await db.query(query, params);
    const row = result.rows[0];

    // Helper functions
    const safeDiv = (a: string, b: string) => Number(b) === 0 ? 0 : Number(a) / Number(b);
    const evol = (curr: number, prev: number) => prev === 0 ? 0 : ((curr - prev) / prev) * 100;
    const diff = (curr: number, prev: number) => curr - prev;

    const my_avg_purch = safeDiv(row.my_purchases_ht, row.my_purchases_qty);
    const my_avg_purch_prev = safeDiv(row.my_purchases_ht_prev, row.my_purchases_qty_prev);

    const group_avg_purch = safeDiv(row.group_purchases_ht, row.group_purchases_qty);
    const group_avg_purch_prev = safeDiv(row.group_purchases_ht_prev, row.group_purchases_qty_prev);

    const my_avg_sell = safeDiv(row.my_sales_ttc, row.my_sales_qty);
    const my_avg_sell_prev = safeDiv(row.my_sales_ttc_prev, row.my_sales_qty_prev);

    const group_avg_sell = safeDiv(row.group_sales_ttc, row.group_sales_qty);
    const group_avg_sell_prev = safeDiv(row.group_sales_ttc_prev, row.group_sales_qty_prev);

    const my_margin = safeDiv(row.my_margin_ht, row.my_sales_ht) * 100;
    const my_margin_prev = safeDiv(row.my_margin_ht_prev, row.my_sales_ht_prev) * 100;

    const group_margin = safeDiv(row.group_margin_ht, row.group_sales_ht) * 100;
    const group_margin_prev = safeDiv(row.group_margin_ht_prev, row.group_sales_ht_prev) * 100;

    return {
        my_avg_purchase_price: my_avg_purch,
        my_avg_purchase_price_evolution: evol(my_avg_purch, my_avg_purch_prev),
        group_avg_purchase_price: group_avg_purch,
        group_avg_purchase_price_evolution: evol(group_avg_purch, group_avg_purch_prev),

        my_avg_sell_price: my_avg_sell,
        my_avg_sell_price_evolution: evol(my_avg_sell, my_avg_sell_prev),
        group_avg_sell_price: group_avg_sell,
        group_avg_sell_price_evolution: evol(group_avg_sell, group_avg_sell_prev),

        my_avg_margin_rate: my_margin,
        my_avg_margin_rate_evolution: diff(my_margin, my_margin_prev), // Margin Evolution is in POINTS (diff)
        group_avg_margin_rate: group_margin,
        group_avg_margin_rate_evolution: diff(group_margin, group_margin_prev)
    };
}

export interface PriceEvolutionDataPoint {
    date: string;
    avg_purchase_price: number;
    purchases_qty: number;
    avg_sell_price: number;
    sales_qty: number;
    margin_eur: number;
    margin_rate: number;
}

export async function fetchPriceEvolution(request: AchatsKpiRequest): Promise<PriceEvolutionDataPoint[]> {
    const { dateRange, pharmacyIds = [], laboratories = [], categories = [], productCodes = [], filterOperators = [] } = request;

    // We only need the primary date range for the evolution graph
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    const initialParams = [start, end];
    const qb = new FilterQueryBuilder(initialParams, 3, filterOperators);

    qb.addLaboratories(laboratories);
    qb.addCategories(categories);
    qb.addProducts(productCodes);

    if (request.excludedLaboratories) qb.addExcludedLaboratories(request.excludedLaboratories);
    if (request.excludedCategories) qb.addExcludedCategories(request.excludedCategories);
    if (request.excludedProductCodes) qb.addExcludedProducts(request.excludedProductCodes);

    const conditions = qb.getConditions();
    const params = qb.getParams();

    // Pharmacy handling
    let pharmacyIdsParamIdx = params.length + 1;
    params.push(pharmacyIds.length > 0 ? pharmacyIds : null);

    const query = `
        SELECT
            TO_CHAR(month, 'YYYY-MM-DD') as date,
            SUM(ht_purchased) as purchases_ht,
            SUM(qty_purchased) as purchases_qty,
            SUM(ttc_sold) as sales_ttc,
            SUM(qty_sold) as sales_qty,
            SUM(margin_sold) as margin_ht,
            SUM(ht_sold) as sales_ht
        FROM mv_product_stats_monthly mv
        -- Inner Join for Global Products if needed for filters
        INNER JOIN data_internalproduct ip ON mv.product_id = ip.id
        LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
        WHERE 
            month >= $1 AND month <= $2
            AND ($${pharmacyIdsParamIdx}::uuid[] IS NULL OR mv.pharmacy_id = ANY($${pharmacyIdsParamIdx}))
            ${conditions}
        GROUP BY month
        ORDER BY month ASC
    `;

    const result = await db.query(query, params);

    return result.rows.map(row => {
        const purchQty = Number(row.purchases_qty) || 0;
        const salesQty = Number(row.sales_qty) || 0;
        const salesHt = Number(row.sales_ht) || 0;
        const marginHt = Number(row.margin_ht) || 0;

        return {
            date: row.date,
            avg_purchase_price: purchQty === 0 ? 0 : Number(row.purchases_ht) / purchQty,
            purchases_qty: purchQty,
            avg_sell_price: salesQty === 0 ? 0 : Number(row.sales_ttc) / salesQty, // Average Price TTC
            sales_qty: salesQty,
            margin_eur: marginHt,
            margin_rate: salesHt === 0 ? 0 : (marginHt / salesHt) * 100
        };
    });
}

export interface PriceProductAnalysis {
    product_name: string;
    ean13: string;
    laboratory_name: string;

    group_min_purchase_price: number;
    group_max_purchase_price: number;
    my_avg_purchase_price: number;
    my_avg_purchase_price_evolution: number | null; // Evolution
    group_avg_purchase_price: number;

    group_min_sell_price: number;
    group_max_sell_price: number;
    my_avg_sell_price: number; // Used as "Current Price" proxy
    my_avg_sell_price_evolution: number | null; // Evolution
    my_current_sell_price: number; // Latest known price in period
    group_avg_sell_price: number;

    my_margin_rate: number;
    my_margin_rate_evolution: number | null; // Evolution

    vat_rate: number;
    manufacturer_price: number | null;

    total_rows: number;
}

import { PriceProductQueries } from '@/queries/kpi/PriceProductQueries';

// Helper for evolution calculation
const calcEvolution = (curr: number, prev: number): number | null => {
    if (!prev || prev === 0) return null;
    return ((curr - prev) / prev) * 100;
};

export async function fetchPriceProducts(
    request: AchatsKpiRequest,
    page: number = 1,
    limit: number = 50,
    orderBy: string = 'my_avg_sell_price',
    orderDirection: 'asc' | 'desc' = 'desc',
    search?: string
): Promise<PriceProductAnalysis[]> {
    const { dateRange, pharmacyIds = [], laboratories = [], categories = [], productCodes = [], filterOperators = [] } = request;

    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    // Calculate Previous Period (Same duration before start)
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 86400000); // Day before start
    const prevStart = new Date(prevEnd.getTime() - duration);

    // Parameters: $1=Start, $2=End, $3=PrevStart, $4=PrevEnd
    const initialParams = [start, end, prevStart, prevEnd];
    const qb = new FilterQueryBuilder(initialParams, 5, filterOperators); // Start next params at $5

    qb.addLaboratories(laboratories);
    qb.addCategories(categories);
    qb.addProducts(productCodes);

    if (request.excludedLaboratories) qb.addExcludedLaboratories(request.excludedLaboratories);
    if (request.excludedCategories) qb.addExcludedCategories(request.excludedCategories);
    if (request.excludedProductCodes) qb.addExcludedProducts(request.excludedProductCodes);

    const conditions = qb.getConditions();
    const params = qb.getParams();

    // Handle Search
    let searchCondition = '';
    if (search) {
        const i = params.length + 1;
        params.push(`%${search}%`);
        searchCondition = `AND (mv.product_label ILIKE $${i} OR mv.ean13 ILIKE $${i})`;
    }

    // Handle Pharmacy IDs
    const pharmacyParamIdx = params.length + 1;
    params.push(pharmacyIds.length > 0 ? pharmacyIds : null);

    // Limit/Offset
    const offset = (page - 1) * limit;

    // Order By
    // Map frontend columns to SQL columns
    const sortMapping: Record<string, string> = {
        'product_name': 'ms.product_name',
        'ean13': 'ms.ean13',
        'laboratory_name': 'ms.laboratory_name',
        'my_avg_sell_price': 'my_avg_sell_price',
        'group_avg_sell_price': 'group_avg_sell_price',
        'my_avg_purchase_price': 'my_avg_purchase_price',
        'group_avg_purchase_price': 'group_avg_purchase_price',
        'my_margin_rate': 'my_margin_rate',
        'group_min_purchase_price': 'ga.group_min_purchase_price',
        'group_max_purchase_price': 'ga.group_max_purchase_price',
        'group_min_sell_price': 'ga.group_min_sell_price',
        'group_max_sell_price': 'ga.group_max_sell_price',
        'my_current_sell_price': 'my_last_sales_ttc' // Sort by last known price
    };
    const sqlSort = sortMapping[orderBy] || 'my_avg_sell_price';
    const finalOrderByClause = `ORDER BY ${sqlSort} ${orderDirection.toUpperCase()} NULLS LAST`;

    // Params for Limit/Offset
    const limitParamIdx = params.length + 1;
    params.push(limit);
    const offsetParamIdx = params.length + 1;
    params.push(offset);

    // Generate Query
    // OPTIMIZATION: If no specific filters (Lab, Cat, Product, Search),
    // restrict base_data to Top 1000 Best Sellers (by Quantity) globally.
    const hasPositiveFilters = laboratories.length > 0 || categories.length > 0 || productCodes.length > 0 || !!search;

    let finalConditions = conditions;
    if (!hasPositiveFilters) {
        // We use $1 (Start) and $2 (End) which are already in params [0] and [1]
        finalConditions += ` AND mv.ean13 IN (
            SELECT sub_mv.ean13 
            FROM mv_product_stats_monthly sub_mv 
            WHERE sub_mv.month >= $1 AND sub_mv.month <= $2
            GROUP BY sub_mv.ean13
            ORDER BY SUM(sub_mv.qty_sold) DESC
            LIMIT 1000
        )`;
    }

    let query = PriceProductQueries.getProductAnalysis(
        finalConditions,
        searchCondition,
        limitParamIdx,
        offsetParamIdx,
        finalOrderByClause,
        pharmacyParamIdx
    );

    const result = await db.query(query, params);

    return result.rows.map(row => {
        // Calculate Current Price (Latest TTC / Latest Qty)
        const lastSalesTtc = Number(row.my_last_sales_ttc) || 0;
        const lastSalesQty = Number(row.my_last_sales_qty) || 0;
        const currentPrice = lastSalesQty > 0 ? lastSalesTtc / lastSalesQty : 0;

        const myPurchPrice = Number(row.my_avg_purchase_price) || 0;
        const prevPurchPrice = Number(row.prev_avg_purchase_price) || 0;

        const mySellPrice = Number(row.my_avg_sell_price) || 0;
        const prevSellPrice = Number(row.prev_avg_sell_price) || 0;

        const myMargin = Number(row.my_margin_rate) || 0;
        const prevMargin = Number(row.prev_margin_rate) || 0;

        return {
            product_name: row.product_name,
            ean13: row.ean13,
            laboratory_name: row.laboratory_name,

            group_min_purchase_price: Number(row.group_min_purchase_price) || 0,
            group_max_purchase_price: Number(row.group_max_purchase_price) || 0,

            my_avg_purchase_price: myPurchPrice,
            my_avg_purchase_price_evolution: calcEvolution(myPurchPrice, prevPurchPrice),

            group_avg_purchase_price: Number(row.group_avg_purchase_price) || 0,

            group_min_sell_price: Number(row.group_min_sell_price) || 0,
            group_max_sell_price: Number(row.group_max_sell_price) || 0,

            my_avg_sell_price: mySellPrice,
            my_avg_sell_price_evolution: calcEvolution(mySellPrice, prevSellPrice),

            group_avg_sell_price: Number(row.group_avg_sell_price) || 0,
            my_current_sell_price: currentPrice,

            my_margin_rate: myMargin,
            my_margin_rate_evolution: calcEvolution(myMargin, prevMargin),

            vat_rate: Number(row.vat_rate) || 5.5, // Default to 5.5 if missing (standard med rate)
            manufacturer_price: row.manufacturer_price ? Number(row.manufacturer_price) : null,

            total_rows: Number(row.total_rows) || 0
        };
    });
}
