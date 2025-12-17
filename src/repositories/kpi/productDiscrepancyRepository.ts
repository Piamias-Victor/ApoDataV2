import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi';
import { FilterQueryBuilder } from '@/repositories/utils/FilterQueryBuilder';

export interface ProductDiscrepancyRow {
    product_id: number;
    product_name: string;
    product_code: string;
    laboratory_name: string;
    qte_commandee: number;
    qte_receptionnee: number;
    ecart_qte: number;
    taux_reception: number;
    prix_achat: number;
    stock_actuel: number;
    stock_moyen: number;
    jours_de_stock: number;
    qte_a_commander: number;
    qte_vendue: number;
    prix_vente_moyen: number;
    marge_moyen_pct: number;
}

export async function fetchProductDiscrepancyData(request: AchatsKpiRequest): Promise<ProductDiscrepancyRow[]> {
    const { dateRange, pharmacyIds = [], laboratories = [], categories = [], filterOperators = [] } = request;
    const initialParams = [dateRange.start, dateRange.end];

    // Filter Builder (Same logic as Stock/Laboratory)
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
    if (request.excludedPharmacyIds) qb.addExcludedPharmacies(request.excludedPharmacyIds);
    if (request.excludedLaboratories) qb.addExcludedLaboratories(request.excludedLaboratories);
    if (request.excludedCategories) qb.addExcludedCategories(request.excludedCategories);
    if (request.excludedProductCodes) qb.addExcludedProducts(request.excludedProductCodes);

    const conditions = qb.getConditions();
    const params = qb.getParams();

    // Orders Filter Builder
    const qbOrders = new FilterQueryBuilder(initialParams, 3, filterOperators, {
        pharmacyId: 'ip.pharmacy_id',
        laboratory: 'gp.bcb_lab',
        productCode: 'ip.code_13_ref_id',
        cat_l1: 'gp.bcb_segment_l1',
    });
    // Reuse filter application logic... (omitted for brevity in prompt but implicitly applied by using same params)
    // We construct condition string manually to match params structure if needed, 
    // BUT FilterQueryBuilder relies on internal state. We must re-add filters to qbOrders to generate correct SQL string.
    qbOrders.addPharmacies(pharmacyIds);
    qbOrders.addLaboratories(laboratories);
    qbOrders.addCategories(categories);
    if (request.productCodes) qbOrders.addProducts(request.productCodes);
    if (request.excludedPharmacyIds) qbOrders.addExcludedPharmacies(request.excludedPharmacyIds);
    if (request.excludedLaboratories) qbOrders.addExcludedLaboratories(request.excludedLaboratories);
    if (request.excludedCategories) qbOrders.addExcludedCategories(request.excludedCategories);
    if (request.excludedProductCodes) qbOrders.addExcludedProducts(request.excludedProductCodes);
    const condOrders = qbOrders.getConditions();

    const hasFilters = (laboratories.length > 0 || (request.productCodes && request.productCodes.length > 0) || categories.length > 0);
    const limitClause = hasFilters ? '' : 'LIMIT 1000';

    const query = `
        WITH OrdersAgg AS (
            SELECT 
                po.product_id,
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
                mv.internal_product_id as product_id,
                SUM(mv.quantity) as qte_vendue,
                SUM(mv.montant_ht * (1 + COALESCE(mv.tva_rate, 0) / 100.0)) as sales_ttc,
                SUM(mv.montant_marge) as margin_val,
                SUM(mv.montant_ht) as sales_ht
            FROM mv_sales_enriched mv
            WHERE mv.sale_date >= $1::date 
              AND mv.sale_date <= $2::date
              ${conditions}
            GROUP BY 1
        ),
        StockAgg AS (
            SELECT 
                mv.product_id,
                AVG(monthly_stock_sum) as stock_moyen
            FROM (
                SELECT product_id, month_end_date, SUM(stock) as monthly_stock_sum
                FROM mv_stock_monthly mv
                WHERE mv.month_end_date >= $1::date 
                  AND mv.month_end_date <= $2::date
                  ${conditions}
                GROUP BY 1, 2
            ) mv
            GROUP BY 1
        ),
        LatestStockAgg AS (
            SELECT 
                product_id,
                SUM(stock) as stock_actuel,
                SUM(stock_value_ht) as stock_value_actuel
            FROM (
                 SELECT DISTINCT ON (mv.product_id, mv.pharmacy_id)
                    mv.product_id, mv.pharmacy_id, mv.stock, mv.stock_value_ht
                FROM mv_stock_monthly mv
                WHERE mv.month_end_date <= $2::date
                  ${conditions}
                ORDER BY mv.product_id, mv.pharmacy_id, mv.month_end_date DESC
            ) t
            GROUP BY 1
        )
        SELECT 
            COALESCE(o.product_id, s.product_id, st.product_id, lst.product_id) as product_id,
            COALESCE(ip.name, 'Inconnu') as product_name,
            COALESCE(ip.code_13_ref_id, 'N/A') as product_code,
            COALESCE(gp.bcb_lab, 'AUTRES') as laboratory_name,

            COALESCE(o.qte_commandee, 0) as qte_commandee,
            COALESCE(o.qte_receptionnee, 0) as qte_receptionnee,
            COALESCE(o.prix_achat_total, 0) as prix_achat,
            
            COALESCE(s.qte_vendue, 0) as qte_vendue,
            COALESCE(s.sales_ttc, 0) as sales_ttc,
            COALESCE(s.margin_val, 0) as margin_total,
            COALESCE(s.sales_ht, 1) as sales_ht_total, 

            COALESCE(st.stock_moyen, 0) as stock_moyen,
            COALESCE(lst.stock_actuel, 0) as stock_actuel,
            COALESCE(lst.stock_value_actuel, 0) as stock_value_actuel

        FROM OrdersAgg o
        FULL OUTER JOIN SalesAgg s ON o.product_id = s.product_id
        FULL OUTER JOIN StockAgg st ON COALESCE(o.product_id, s.product_id) = st.product_id
        FULL OUTER JOIN LatestStockAgg lst ON COALESCE(o.product_id, s.product_id) = lst.product_id
        LEFT JOIN data_internalproduct ip ON COALESCE(o.product_id, s.product_id, st.product_id, lst.product_id) = ip.id
        LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
        ${limitClause}
    `;

    try {
        const result = await db.query(query, params);
        const days_in_period = (new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 3600 * 24) || 30;

        return result.rows.map(row => {
            const qte_vendue = Number(row.qte_vendue);
            const sales_ht = Number(row.sales_ht_total);
            const margin = Number(row.margin_total);
            const stock_value = Number(row.stock_value_actuel);

            // Calculations
            const cost_of_sales = sales_ht - margin;
            const daily_consumption = cost_of_sales / days_in_period;
            const jours_de_stock = daily_consumption > 0 ? stock_value / daily_consumption : 0;

            const qte_commandee = Number(row.qte_commandee);
            const qte_receptionnee = Number(row.qte_receptionnee);

            return {
                product_id: row.product_id,
                product_name: row.product_name,
                product_code: row.product_code,
                laboratory_name: row.laboratory_name,
                qte_commandee,
                qte_receptionnee,
                ecart_qte: qte_receptionnee - qte_commandee,
                taux_reception: qte_commandee > 0 ? (qte_receptionnee / qte_commandee) * 100 : 0,
                prix_achat: Number(row.prix_achat),
                stock_actuel: Number(row.stock_actuel),
                stock_moyen: Number(row.stock_moyen),
                jours_de_stock,
                qte_a_commander: 0,
                qte_vendue,
                prix_vente_moyen: qte_vendue > 0 ? (Number(row.sales_ttc) / qte_vendue) : 0,
                marge_moyen_pct: sales_ht > 0 ? (margin / sales_ht) * 100 : 0,
            };
        });
    } catch (error) {
        console.error('❌ [Repository] Product Discrepancy Query failed:', error);
        throw error;
    }
}
