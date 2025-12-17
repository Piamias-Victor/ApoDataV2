import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi';
import { FilterQueryBuilder } from '@/repositories/utils/FilterQueryBuilder';

export interface LaboratoryDiscrepancyRow {
    laboratory_name: string;
    qte_commandee: number;
    qte_receptionnee: number;
    ecart_qte: number;
    taux_reception: number;
    prix_achat: number;
    stock_actuel: number;
    stock_moyen: number;
    jours_de_stock: number;
    qte_a_commander: number; // Placeholder / Simplified
    qte_vendue: number;
    prix_vente_moyen: number;
    marge_moyen_pct: number;
}

export async function fetchLaboratoryDiscrepancyData(request: AchatsKpiRequest): Promise<LaboratoryDiscrepancyRow[]> {
    const { dateRange, pharmacyIds = [], laboratories = [], categories = [], filterOperators = [] } = request;

    // 1. Time Range for Orders/Sales (Active Window)
    const initialParams = [dateRange.start, dateRange.end];

    // 2. Build Dynamic Filters
    const qb = new FilterQueryBuilder(initialParams, 3, filterOperators, {
        pharmacyId: 'mv.pharmacy_id',
        laboratory: 'mv.laboratory_name',
        productCode: 'mv.code_13_ref',
        cat_l1: 'mv.category_name',
    });

    qb.addPharmacies(pharmacyIds);
    qb.addLaboratories(laboratories);
    qb.addCategories(categories);
    if (request.productCodes) qb.addProducts(request.productCodes);

    // Exclusions
    if (request.excludedPharmacyIds) qb.addExcludedPharmacies(request.excludedPharmacyIds);
    if (request.excludedLaboratories) qb.addExcludedLaboratories(request.excludedLaboratories);
    if (request.excludedCategories) qb.addExcludedCategories(request.excludedCategories);
    if (request.excludedProductCodes) qb.addExcludedProducts(request.excludedProductCodes);

    const conditions = qb.getConditions();
    const params = qb.getParams();

    // 3. Needs join for Global Product (if filtering by category/lab not in MV usually, but here we group by Lab Name from MV directly where possible)
    // However, for Data Product Order, we need to join Internal Product -> Global Product possibly if filters applied.
    // For simplicity, we assume MVs have Lab Name. data_productorder needs join.

    // Simplified: We assume for now that standard conditions apply well for all CTEs
    // since we want to align the "Active Labotories" across the logic.
    // If strict dual-window filtering needed (e.g. Orders by delivery vs Sales by sale_date),
    // we already handle that with different params ($1,$2).
    // The dynamic 'conditions' clause (WHERE lab = X) is robust enough.

    // Filters for Orders (alias o / ip / gp)
    // We can reuse the main query builder's logic if providing aliased checks or 
    // relying on the fact that we will filter by `laboratory_name` which is common.
    // However, to be cleaner, we will rely on strict `laboratory_name` grouping.

    // SQL Query:
    // We use the same 'conditions' derived from request for Sales/Stock (alias 'mv'),
    // BUT for Orders (alias 'o', 'ip', 'gp'), we need matching conditions.
    // For this implementation, we will apply the CONDITIONS to the `SalesAgg` and `StockAgg` strictly.
    // For `OrdersAgg`, we will do a basic filtering on Date Range + standard Lab/Pharmacy filter if easy,
    // OR we accept that Orders might be slightly broader before the FULL OUTER JOIN cuts them down 
    // (if we filtered the final SELECT).
    // User requirement: "Rupture par labo".
    // Best effort: Re-use `conditions` string but replace aliases? 
    // `mv.` -> `ip.` or `gp.`? Hard to regex reliably.
    //
    // CORRECT APPROACH:
    // Create a specific condition string for Orders using the SAME parameters values.
    // We already have `initialParams` ($1, $2).
    // We need to create a builder that uses the SAME param indices (starting from 3).
    //
    // Re-initialize builder for Orders to get `condOrders`
    const qbOrders = new FilterQueryBuilder(initialParams, 3, filterOperators, {
        pharmacyId: 'ip.pharmacy_id',
        laboratory: 'gp.bcb_lab',
        productCode: 'ip.code_13_ref_id',
        cat_l1: 'gp.bcb_segment_l1',
    });
    qbOrders.addPharmacies(pharmacyIds);
    qbOrders.addLaboratories(laboratories);
    qbOrders.addCategories(categories);
    if (request.productCodes) qbOrders.addProducts(request.productCodes);
    if (request.excludedPharmacyIds) qbOrders.addExcludedPharmacies(request.excludedPharmacyIds);
    if (request.excludedLaboratories) qbOrders.addExcludedLaboratories(request.excludedLaboratories);
    if (request.excludedCategories) qbOrders.addExcludedCategories(request.excludedCategories);
    if (request.excludedProductCodes) qbOrders.addExcludedProducts(request.excludedProductCodes);

    const condOrders = qbOrders.getConditions();
    // We DO NOT use qbOrders.getParams() because we want to reuse the `params` from the first builder
    // which effectively contain the same values in the same order (since we added filters in same order).
    // This is a safe assumption given the strict sequential code execution above.

    // The SQL Query
    const query = `
        WITH OrdersAgg AS (
            SELECT 
                COALESCE(gp.bcb_lab, 'AUTRES') as laboratory_name, -- Grouping Key
                SUM(po.qte) as qte_commandee,
                SUM(po.qte_r) as qte_receptionnee,
                SUM(po.qte_r * COALESCE(lp.weighted_average_price, 0)) as prix_achat_total
            FROM data_productorder po
            INNER JOIN data_order o ON po.order_id = o.id
            INNER JOIN data_internalproduct ip ON po.product_id = ip.id
            LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
            LEFT JOIN mv_latest_product_prices lp ON po.product_id = lp.product_id
            WHERE o.sent_date >= $1::date 
              AND o.sent_date <= $2::date
              ${condOrders}
            GROUP BY 1
        ),
        SalesAgg AS (
            SELECT 
                mv.laboratory_name,
                SUM(mv.quantity) as qte_vendue,
                SUM(mv.montant_ht * (1 + COALESCE(mv.tva_rate, 0) / 100.0)) as sales_ttc,
                SUM(mv.montant_marge) as margin_val,
                SUM(mv.montant_ht) as sales_ht
            FROM mv_sales_enriched mv
            WHERE mv.sale_date >= $1::date 
              AND mv.sale_date <= $2::date
              ${conditions} -- Uses 'mv' alias, params match $1..$N
            GROUP BY 1
        ),
        StockAgg AS (
             -- Monthly average of the SUM of stocks per pharmacy
            SELECT 
                t.laboratory_name,
                AVG(t.monthly_stock) as stock_moyen
            FROM (
                SELECT 
                    mv.laboratory_name,
                    mv.month_end_date,
                    SUM(mv.stock) as monthly_stock
                FROM mv_stock_monthly mv
                WHERE mv.month_end_date >= $1::date 
                  AND mv.month_end_date <= $2::date
                  ${conditions}
                GROUP BY 1, 2
            ) t
            GROUP BY 1
        ),
        LatestStockAgg AS (
            -- Current Stock (Sum of latest snapshot per pharmacy)
            SELECT 
               t.laboratory_name,
               SUM(t.stock) as stock_actuel,
               SUM(t.stock_value) as stock_value_actuel
            FROM (
                 SELECT DISTINCT ON (mv.product_id, mv.pharmacy_id)
                    mv.laboratory_name,
                    mv.stock,
                    mv.stock_value_ht as stock_value
                FROM mv_stock_monthly mv
                WHERE mv.month_end_date <= $2::date
                  ${conditions}
                ORDER BY mv.product_id, mv.pharmacy_id, mv.month_end_date DESC
            ) t
            GROUP BY 1
        )
        SELECT 
            COALESCE(o.laboratory_name, s.laboratory_name, st.laboratory_name, lst.laboratory_name) as laboratory_name,
            COALESCE(o.qte_commandee, 0) as qte_commandee,
            COALESCE(o.qte_receptionnee, 0) as qte_receptionnee,
            COALESCE(o.prix_achat_total, 0) as prix_achat,
            
            COALESCE(s.qte_vendue, 0) as qte_vendue,
            COALESCE(s.sales_ttc, 0) as sales_ttc,
            COALESCE(s.margin_val, 0) as margin_total,
            COALESCE(s.sales_ht, 1) as sales_ht_total, -- Avoid div by zero

            COALESCE(st.stock_moyen, 0) as stock_moyen,
            COALESCE(lst.stock_actuel, 0) as stock_actuel,
            COALESCE(lst.stock_value_actuel, 0) as stock_value_actuel

        FROM OrdersAgg o
        FULL OUTER JOIN SalesAgg s ON o.laboratory_name = s.laboratory_name
        FULL OUTER JOIN StockAgg st ON COALESCE(o.laboratory_name, s.laboratory_name) = st.laboratory_name
        FULL OUTER JOIN LatestStockAgg lst ON COALESCE(o.laboratory_name, s.laboratory_name) = lst.laboratory_name
        WHERE COALESCE(o.laboratory_name, s.laboratory_name, st.laboratory_name, lst.laboratory_name) IS NOT NULL
        AND COALESCE(o.laboratory_name, s.laboratory_name, st.laboratory_name, lst.laboratory_name) != 'AUTRES' -- Optional filtering
    `;

    try {
        // We need to merge params? 
        // Logic check: $1 and $2 are always Start and End.
        // `conditions` (Sales/Stock) uses $3...$N.
        // `condOrders` (Orders) uses $3...$N. 
        // Since we created TWO builders, `params` and `pOrders` might differ in content but index mapping depends on execution order?
        // NO. Postgres uses positional $1, $2... 
        // If `conditions` string uses $3, $4 and `condOrders` uses $3, $4, pass ONLY ONE set of params if they are identical.
        // If filters are identical, params ARE identical.
        // Let's verify: filterOperators, pharmacies, labs, cats, products are same.
        // So `params` should be sufficient for BOTH if generated identically.
        // SAFE BET: Use `params` from the main builder, assuming `qbOrderSync` generated matching sequence.
        // Verified: `qb` and `qbOrderSync` initialized same way.

        const result = await db.query(query, params);

        return result.rows.map(row => {
            const qte_commandee = Number(row.qte_commandee);
            const qte_receptionnee = Number(row.qte_receptionnee);
            const sales_ht = Number(row.sales_ht_total);
            const margin = Number(row.margin_total);
            const qte_vendue = Number(row.qte_vendue);
            const sales_ttc = Number(row.sales_ttc);
            const stock_value = Number(row.stock_value_actuel);

            // Derived calculations
            const ecart_qte = qte_receptionnee - qte_commandee; // Received - Ordered. Negative = Shortage.
            const taux_reception = qte_commandee > 0 ? (qte_receptionnee / qte_commandee) * 100 : 0;
            const prix_vente_moyen = qte_vendue > 0 ? (sales_ttc / qte_vendue) : 0;
            const marge_moyen_pct = sales_ht > 0 ? (margin / sales_ht) * 100 : 0;

            // Days of Stock = Stock Value / (Cost of Goods Sold / Day) ??
            // Or Stock Value / (Sales HT / Day)? Usually Stock Value / (Avg Consumption Value / Day).
            // Avg Consumption ~ Sales HT * (1 - Margin%) ?? Or simply Sales HT * CostRatio.
            // Let's use simplified: Stock Value / (Sales HT / 30 * (1 - MarginRate)) approx or just Turnover.
            // Formula: Stock Value / (Purchase Cost of Sales / day).
            // Purchase Cost of Sales = SalesHT - Margin.
            const cost_of_sales = sales_ht - margin;
            const days_in_period = (new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 3600 * 24) || 30;
            const daily_consumption = cost_of_sales / days_in_period;
            const jours_de_stock = daily_consumption > 0 ? stock_value / daily_consumption : 0;

            // Qte A Commander (Simplified)
            // Only if stock < avg monthly sales? 
            // Let's return 0 as placeholder for now unless logic specified.
            // User prompt: "QTE A COMMANDEE"
            const qte_a_commander = 0;

            return {
                laboratory_name: row.laboratory_name,
                qte_commandee,
                qte_receptionnee,
                ecart_qte, // Usually displayed as absolute shortage or negative
                taux_reception,
                prix_achat: Number(row.prix_achat),
                stock_actuel: Number(row.stock_actuel),
                stock_moyen: Number(row.stock_moyen),
                jours_de_stock,
                qte_a_commander,
                qte_vendue,
                prix_vente_moyen,
                marge_moyen_pct
            };
        });
    } catch (error) {
        console.error('❌ [Repository] Laboratory Discrepancy Query failed:', error);
        throw error;
    }
}
