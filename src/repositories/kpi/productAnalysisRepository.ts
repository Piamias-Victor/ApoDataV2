import { db } from '@/lib/db';
import { AchatsKpiRequest, ProductAnalysisRow } from '@/types/kpi';
import { FilterQueryBuilder } from '../utils/FilterQueryBuilder';

export async function getProductAnalysis(request: AchatsKpiRequest, page = 1, pageSize = 20, search = ''): Promise<{ data: ProductAnalysisRow[], total: number }> {
    const {
        dateRange,
        pharmacyIds = [],
        laboratories = [],
        categories = [],
        productCodes = [], // Added productCodes
        reimbursementStatus,
        isGeneric,
        tvaRates = [],
        excludedLaboratories,
        excludedCategories,
        excludedProductCodes,
        excludedPharmacyIds
    } = request;

    const myPharmacyId = pharmacyIds[0] || null;
    const { start, end } = dateRange;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const duration = endDate.getTime() - startDate.getTime();

    // Pagination
    const offset = (page - 1) * pageSize;

    // Dates
    const prevStartDate = new Date(startDate.getTime() - duration);
    const prevEndDate = new Date(startDate.getTime() - 86400000);
    const baseParams: any[] = [start, end, prevStartDate, prevEndDate, myPharmacyId];

    // Adjust operators: if pharmacyIds is present (handled manually), skip first operator
    const applicableOperators = pharmacyIds.length > 0 ? (request.filterOperators || []).slice(1) : request.filterOperators;

    // Filter Builder
    const builder = new FilterQueryBuilder(
        baseParams,
        6,
        applicableOperators,
        {
            laboratory: 'mv.laboratory_name',
            productCode: 'mv.ean13'
        }
    );

    builder.addLaboratories(laboratories);
    builder.addCategories(categories);
    builder.addProducts(productCodes); // Add products filter
    builder.addReimbursementStatus(reimbursementStatus);

    let genericValue: 'ALL' | 'GENERIC' | 'PRINCEPS' | 'PRINCEPS_GENERIC' = 'ALL';
    if ((isGeneric as any) === 'YES') genericValue = 'GENERIC';
    else if ((isGeneric as any) === 'NO') genericValue = 'PRINCEPS';
    else if (isGeneric && isGeneric !== 'ALL') genericValue = isGeneric;
    builder.addGenericStatus(genericValue);

    builder.addTvaRates(tvaRates);

    // Exclusions
    if (excludedLaboratories) builder.addExcludedLaboratories(excludedLaboratories);
    if (excludedCategories) builder.addExcludedCategories(excludedCategories);
    if (excludedProductCodes) builder.addExcludedProducts(excludedProductCodes);
    if (excludedPharmacyIds) builder.addExcludedPharmacies(excludedPharmacyIds);

    const conditions = builder.getConditions();
    const params = builder.getParams();

    // Search Logic (Manual)
    let searchCondition = '';
    if (search) {
        const idx = params.length + 1;
        searchCondition = `AND(mv.product_label ILIKE $${idx} OR mv.ean13 ILIKE $${idx} OR mv.laboratory_name ILIKE $${idx})`;
        params.push(`% ${search}% `);
    }

    // Limits
    const isFiltered = search || conditions.length > 0;
    // We remove the LIMIT for filtering to ensure we find matches, 
    // BUT we still apply pagination at the end.
    // The previous logic 'LIMIT 1000' inside CTE was for performance on "Top Products" when no filter.
    const limitClause = isFiltered ? '' : 'LIMIT 1000';

    const limitParamIdx = params.length + 1;
    const offsetParamIdx = params.length + 2;

    let query = '';

    if (!myPharmacyId) {
        // --- 1. GLOBAL STRATEGY (MONTHLY + EAN GROUPING) ---
        query = `
WITH 
            global_stats AS(
    SELECT 
                    mv.ean13,
    MAX(mv.product_label) as product_name,
    MAX(mv.laboratory_name) as laboratory_name,
    MAX(mv.product_id:: text):: uuid as product_id,

    --Metrics(Current)
                    SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.ttc_sold ELSE 0 END) as sales_ttc,
    SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.qty_sold ELSE 0 END) as sales_qty,
    SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.margin_sold ELSE 0 END) as margin_ht,
    SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.ht_sold ELSE 0 END) as sales_ht,
    SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.ht_purchased ELSE 0 END) as purchases_ht,
    SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.qty_purchased ELSE 0 END) as purchases_qty,

    --Metrics(Previous)
                    SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.ttc_sold ELSE 0 END) as sales_ttc_prev,
    SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.qty_sold ELSE 0 END) as sales_qty_prev,
    SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.margin_sold ELSE 0 END) as margin_ht_prev,
    SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.ht_sold ELSE 0 END) as sales_ht_prev,
    SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.ht_purchased ELSE 0 END) as purchases_ht_prev,
    SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.qty_purchased ELSE 0 END) as purchases_qty_prev

                FROM mv_product_stats_monthly mv
                LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
                WHERE(
        (mv.month >= $1:: date AND mv.month <= $2:: date) 
                   OR(mv.month >= $3:: date AND mv.month <= $4:: date)
)
AND($5:: uuid IS NULL OR true)
                  AND mv.ean13 != 'NO-EAN'
                  ${conditions}
                  ${searchCondition}
                GROUP BY mv.ean13-- Consolidated by EAN
                ORDER BY sales_qty DESC
                ${limitClause}
            ),
            
            pharmacy_counts AS(
    SELECT 
                    CASE 
                        WHEN month >= $1:: date AND month <= $2:: date THEN 'CURRENT'
                        ELSE 'PREVIOUS'
                    END as period,
    COUNT(DISTINCT pharmacy_id) as count
                FROM mv_product_stats_monthly
                WHERE(month >= $1:: date AND month <= $2:: date) 
                   OR(month >= $3:: date AND month <= $4:: date)
                GROUP BY 1
)

SELECT
gs.product_name,
    gs.ean13,
    gs.laboratory_name,

    -- "Me" = "Group"(Global)
gs.sales_ttc as my_sales_ttc,
    gs.sales_qty as my_sales_qty,
    gs.purchases_ht as my_purchases_ht,
    gs.purchases_qty as my_purchases_qty,

    CASE WHEN gs.sales_ht = 0 THEN 0 ELSE(gs.margin_ht / gs.sales_ht) * 100 END as my_margin_rate,
        (gs.sales_ttc / NULLIF(SUM(gs.sales_ttc) OVER(), 0)) * 100 as my_pdm_pct,
        RANK() OVER(ORDER BY gs.sales_qty DESC) as my_rank,

            --Group Averages
gs.sales_ttc / NULLIF(pc_current.count, 0) as group_avg_sales_ttc,
    gs.sales_qty / NULLIF(pc_current.count, 0) as group_avg_sales_qty,
    gs.purchases_ht / NULLIF(pc_current.count, 0) as group_avg_purchases_ht,
    gs.purchases_qty / NULLIF(pc_current.count, 0) as group_avg_purchases_qty,

    CASE WHEN gs.sales_ht = 0 THEN 0 ELSE(gs.margin_ht / gs.sales_ht) * 100 END as group_avg_margin_rate,
        (gs.sales_ttc / NULLIF(SUM(gs.sales_ttc) OVER(), 0)) * 100 as group_pdm_pct,
        RANK() OVER(ORDER BY gs.sales_qty DESC) as group_rank,

            --Evolutions
                CASE WHEN gs.sales_ttc_prev = 0 THEN 0 ELSE((gs.sales_ttc - gs.sales_ttc_prev) / gs.sales_ttc_prev) * 100 END as my_sales_evolution,
    CASE WHEN gs.sales_ttc_prev = 0 THEN 0 ELSE((gs.sales_ttc - gs.sales_ttc_prev) / gs.sales_ttc_prev) * 100 END as group_sales_evolution,

        CASE WHEN gs.purchases_ht_prev = 0 THEN 0 ELSE((gs.purchases_ht - gs.purchases_ht_prev) / gs.purchases_ht_prev) * 100 END as my_purchases_evolution,
            CASE WHEN gs.purchases_ht_prev = 0 THEN 0 ELSE((gs.purchases_ht - gs.purchases_ht_prev) / gs.purchases_ht_prev) * 100 END as group_purchases_evolution,

                CASE WHEN gs.sales_qty_prev = 0 THEN 0 ELSE((gs.sales_qty - gs.sales_qty_prev) / gs.sales_qty_prev) * 100 END as my_sales_qty_evolution,
                    CASE WHEN gs.sales_qty_prev = 0 THEN 0 ELSE((gs.sales_qty - gs.sales_qty_prev) / gs.sales_qty_prev) * 100 END as group_sales_qty_evolution,

                        CASE WHEN gs.purchases_qty_prev = 0 THEN 0 ELSE((gs.purchases_qty - gs.purchases_qty_prev) / gs.purchases_qty_prev) * 100 END as group_purchases_qty_evolution,

                            CASE
WHEN(gs.sales_ht_prev = 0) THEN 0
ELSE((CASE WHEN gs.sales_ht = 0 THEN 0 ELSE(gs.margin_ht / gs.sales_ht) * 100 END) - ((gs.margin_ht_prev / gs.sales_ht_prev) * 100))
END as my_margin_rate_evolution,
    CASE
WHEN(gs.sales_ht_prev = 0) THEN 0
ELSE((CASE WHEN gs.sales_ht = 0 THEN 0 ELSE(gs.margin_ht / gs.sales_ht) * 100 END) - ((gs.margin_ht_prev / gs.sales_ht_prev) * 100))
END as group_margin_rate_evolution,

    0 as my_pdm_evolution,
    0 as group_pdm_evolution,

    COUNT(*) OVER() as total_rows
                
            FROM global_stats gs
            LEFT JOIN pharmacy_counts pc_current ON pc_current.period = 'CURRENT'
            ORDER BY gs.sales_qty DESC
            LIMIT $${limitParamIdx}::int OFFSET $${offsetParamIdx}:: int
    `;
    } else {
        // --- 2. COMPARATIVE STRATEGY (MONTHLY + EAN GROUPING) ---
        query = `
WITH 
            pharmacy_counts AS(
    SELECT 
                    CASE 
                        WHEN month >= $1:: date AND month <= $2:: date THEN 'CURRENT'
                        ELSE 'PREVIOUS'
                    END as period,
    COUNT(DISTINCT pharmacy_id) as count
                FROM mv_product_stats_monthly
                WHERE(month >= $1:: date AND month <= $2:: date) 
                   OR(month >= $3:: date AND month <= $4:: date)
                GROUP BY 1
),

    my_stats AS(
        SELECT 
                    mv.ean13,
        MAX(mv.product_label) as product_name,
        MAX(mv.laboratory_name) as laboratory_name,
        MAX(mv.product_id:: text):: uuid as product_id,
        SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.ttc_sold ELSE 0 END) as my_sales_ttc,
        SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.qty_sold ELSE 0 END) as my_sales_qty,
        SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.margin_sold ELSE 0 END) as my_margin_ht,
        SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.ht_sold ELSE 0 END) as my_sales_ht,
        SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.ht_purchased ELSE 0 END) as my_purchases_ht,
        SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.qty_purchased ELSE 0 END) as my_purchases_qty,
        SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.ttc_sold ELSE 0 END) as my_sales_ttc_prev,
        SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.qty_sold ELSE 0 END) as my_sales_qty_prev,
        SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.margin_sold ELSE 0 END) as my_margin_ht_prev,
        SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.ht_sold ELSE 0 END) as my_sales_ht_prev,
        SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.ht_purchased ELSE 0 END) as my_purchases_ht_prev,
        SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.qty_purchased ELSE 0 END) as my_purchases_qty_prev
                FROM mv_product_stats_monthly mv
                LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
                WHERE mv.pharmacy_id = $5:: uuid 
                  AND((mv.month >= $1:: date AND mv.month <= $2:: date) OR(mv.month >= $3:: date AND mv.month <= $4:: date))
                  AND mv.ean13 != 'NO-EAN'
                  ${conditions}
                  ${searchCondition}
                GROUP BY mv.ean13-- Consolidated
                ORDER BY my_sales_qty DESC 
                ${limitClause}
            ),

            group_stats AS(
            SELECT 
                    ean13,
            SUM(CASE WHEN month >= $1:: date AND month <= $2:: date THEN ttc_sold ELSE 0 END) as group_total_sales_ttc,
            SUM(CASE WHEN month >= $1:: date AND month <= $2:: date THEN qty_sold ELSE 0 END) as group_total_sales_qty,
            SUM(CASE WHEN month >= $1:: date AND month <= $2:: date THEN margin_sold ELSE 0 END) as group_total_margin_ht,
            SUM(CASE WHEN month >= $1:: date AND month <= $2:: date THEN ht_sold ELSE 0 END) as group_total_sales_ht,
            SUM(CASE WHEN month >= $1:: date AND month <= $2:: date THEN ht_purchased ELSE 0 END) as group_total_purchases_ht,
            SUM(CASE WHEN month >= $1:: date AND month <= $2:: date THEN qty_purchased ELSE 0 END) as group_total_purchases_qty,
            SUM(CASE WHEN month >= $3:: date AND month <= $4:: date THEN ttc_sold ELSE 0 END) as group_total_sales_ttc_prev,
            SUM(CASE WHEN month >= $3:: date AND month <= $4:: date THEN qty_sold ELSE 0 END) as group_total_sales_qty_prev,
            SUM(CASE WHEN month >= $3:: date AND month <= $4:: date THEN margin_sold ELSE 0 END) as group_total_margin_ht_prev,
            SUM(CASE WHEN month >= $3:: date AND month <= $4:: date THEN ht_sold ELSE 0 END) as group_total_sales_ht_prev,
            SUM(CASE WHEN month >= $3:: date AND month <= $4:: date THEN ht_purchased ELSE 0 END) as group_total_purchases_ht_prev,
            SUM(CASE WHEN month >= $3:: date AND month <= $4:: date THEN qty_purchased ELSE 0 END) as group_total_purchases_qty_prev
                FROM mv_product_stats_monthly
                WHERE ean13 IN(SELECT ean13 FROM my_stats)-- Filter by EAN list
                  AND((month >= $1:: date AND month <= $2:: date) OR(month >= $3:: date AND month <= $4:: date))
--No additional filters needed as implicitly filtered by EAN list
                GROUP BY ean13
            ),
            
            global_totals AS(
    SELECT
                    SUM(my_sales_ttc) as my_total_market,
    SUM(group_total_sales_ttc) as group_total_market,
    SUM(my_sales_ttc_prev) as my_total_market_prev,
    SUM(group_total_sales_ttc_prev) as group_total_market_prev,
    COUNT(*) as total_rows
                FROM my_stats 
                JOIN group_stats USING(ean13)
)

SELECT
ms.product_name,
    ms.ean13,
    ms.laboratory_name,
    ms.my_sales_ttc,
    ms.my_sales_qty,
    ms.my_purchases_ht,
    ms.my_purchases_qty,

    CASE WHEN ms.my_sales_ht = 0 THEN 0 ELSE(ms.my_margin_ht / ms.my_sales_ht) * 100 END as my_margin_rate,
        (ms.my_sales_ttc / NULLIF(gt.my_total_market, 0)) * 100 as my_pdm_pct,

        RANK() OVER(ORDER BY ms.my_sales_qty DESC) as my_rank,

            gs.group_total_sales_ttc / NULLIF(pc_current.count, 0) as group_avg_sales_ttc,
            gs.group_total_sales_qty / NULLIF(pc_current.count, 0) as group_avg_sales_qty,
            gs.group_total_purchases_ht / NULLIF(pc_current.count, 0) as group_avg_purchases_ht,
            gs.group_total_purchases_qty / NULLIF(pc_current.count, 0) as group_avg_purchases_qty,

            CASE WHEN gs.group_total_sales_ht = 0 THEN 0 ELSE(gs.group_total_margin_ht / gs.group_total_sales_ht) * 100 END as group_avg_margin_rate,
                (gs.group_total_sales_ttc / NULLIF(gt.group_total_market, 0)) * 100 as group_pdm_pct,

                RANK() OVER(ORDER BY gs.group_total_sales_qty DESC) as group_rank,

                    CASE WHEN ms.my_sales_ttc_prev = 0 THEN 0 ELSE((ms.my_sales_ttc - ms.my_sales_ttc_prev) / ms.my_sales_ttc_prev) * 100 END as my_sales_evolution,
                        CASE WHEN gs.group_total_sales_ttc_prev = 0 THEN 0 ELSE((gs.group_total_sales_ttc - gs.group_total_sales_ttc_prev) / gs.group_total_sales_ttc_prev) * 100 END as group_sales_evolution,

                            CASE WHEN ms.my_purchases_ht_prev = 0 THEN 0 ELSE((ms.my_purchases_ht - ms.my_purchases_ht_prev) / ms.my_purchases_ht_prev) * 100 END as my_purchases_evolution,
                                CASE WHEN gs.group_total_purchases_ht_prev = 0 THEN 0 ELSE((gs.group_total_purchases_ht - gs.group_total_purchases_ht_prev) / gs.group_total_purchases_ht_prev) * 100 END as group_purchases_evolution,

                                    CASE WHEN ms.my_sales_qty_prev = 0 THEN 0 ELSE((ms.my_sales_qty - ms.my_sales_qty_prev) / ms.my_sales_qty_prev) * 100 END as my_sales_qty_evolution,
                                        CASE WHEN gs.group_total_sales_qty_prev = 0 THEN 0 ELSE((gs.group_total_sales_qty - gs.group_total_sales_qty_prev) / gs.group_total_sales_qty_prev) * 100 END as group_sales_qty_evolution,

                                            CASE WHEN ms.my_purchases_qty_prev = 0 THEN 0 ELSE((ms.my_purchases_qty - ms.my_purchases_qty_prev) / ms.my_purchases_qty_prev) * 100 END as my_purchases_qty_evolution,
                                                CASE WHEN gs.group_total_purchases_qty_prev = 0 THEN 0 ELSE((gs.group_total_purchases_qty - gs.group_total_purchases_qty_prev) / gs.group_total_purchases_qty_prev) * 100 END as group_purchases_qty_evolution,

                                                    CASE
WHEN(ms.my_sales_ht_prev = 0) THEN 0
ELSE((CASE WHEN ms.my_sales_ht = 0 THEN 0 ELSE(ms.my_margin_ht / ms.my_sales_ht) * 100 END) - ((ms.my_margin_ht_prev / ms.my_sales_ht_prev) * 100))
END as my_margin_rate_evolution,
    CASE
WHEN(gs.group_total_sales_ht_prev = 0) THEN 0
ELSE((CASE WHEN gs.group_total_sales_ht = 0 THEN 0 ELSE(gs.group_total_margin_ht / gs.group_total_sales_ht) * 100 END) - ((gs.group_total_margin_ht_prev / gs.group_total_sales_ht_prev) * 100))
END as group_margin_rate_evolution,

    --Simplified PDM Evolution(Delta of points)
        ((ms.my_sales_ttc / NULLIF(gt.my_total_market, 0)) * 100) - ((ms.my_sales_ttc_prev / NULLIF(gt.my_total_market_prev, 0)) * 100) as my_pdm_evolution,
        ((gs.group_total_sales_ttc / NULLIF(gt.group_total_market, 0)) * 100) - ((gs.group_total_sales_ttc_prev / NULLIF(gt.group_total_market_prev, 0)) * 100) as group_pdm_evolution,

        gt.total_rows

            FROM my_stats ms
            JOIN group_stats gs ON ms.ean13 = gs.ean13
            CROSS JOIN global_totals gt
            LEFT JOIN pharmacy_counts pc_current ON pc_current.period = 'CURRENT'
            ORDER BY ms.my_sales_qty DESC
            LIMIT $${limitParamIdx}::int OFFSET $${offsetParamIdx}:: int
    `;
    }

    params.push(pageSize, offset);

    const result = await db.query(query, params);
    const total = result.rows.length > 0 ? Number(result.rows[0].total_rows) : 0;

    return { data: result.rows, total };
}
