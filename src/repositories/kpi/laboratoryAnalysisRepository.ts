import { db } from '@/lib/db';
import { AchatsKpiRequest, LaboratoryAnalysisRow } from '@/types/kpi';
import { FilterQueryBuilder } from '../utils/FilterQueryBuilder';

export async function getLaboratoryAnalysis(request: AchatsKpiRequest & { search?: string }): Promise<LaboratoryAnalysisRow[]> {
    const {
        dateRange,
        pharmacyIds = [],
        laboratories = [],
        categories = [],
        productCodes = [], // Added productCodes
        reimbursementStatus,
        isGeneric,
        tvaRates = [],
        search,
        excludedLaboratories, // Added for builder
        excludedCategories,   // Added for builder
        excludedProductCodes, // Added for builder
        excludedPharmacyIds   // Added for builder
    } = request;

    const myPharmacyId = pharmacyIds[0] || null;

    const { start, end } = dateRange;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const duration = endDate.getTime() - startDate.getTime();
    const prevStart = new Date(startDate.getTime() - duration);
    const prevEnd = new Date(startDate.getTime() - 86400000);

    // Prepare params and Builder
    const baseParams = [start, end, prevStart.toISOString(), prevEnd.toISOString(), myPharmacyId];

    // Adjust operators: if pharmacyIds is present (handled manually), skip first operator
    const applicableOperators = pharmacyIds.length > 0 ? (request.filterOperators || []).slice(1) : request.filterOperators;

    // Instantiate Builder
    const builder = new FilterQueryBuilder(
        baseParams,
        6, // Next param index ($6)
        applicableOperators,
        {
            laboratory: 'mv.laboratory_name', // Mapping override
            productCode: 'mv.ean13'
        }
    );

    // Apply Filters
    builder.addLaboratories(laboratories);
    builder.addCategories(categories);
    builder.addProducts(productCodes); // Add products filter
    builder.addReimbursementStatus(reimbursementStatus);

    // Map isGeneric (YES/NO) to Builder Enum (GENERIC/PRINCEPS) if needed
    let genericValue: 'ALL' | 'GENERIC' | 'PRINCEPS' | 'PRINCEPS_GENERIC' = 'ALL';
    if ((isGeneric as any) === 'YES') genericValue = 'GENERIC';
    else if ((isGeneric as any) === 'NO') genericValue = 'PRINCEPS';
    else if (isGeneric && isGeneric !== 'ALL') genericValue = isGeneric;

    builder.addGenericStatus(genericValue);
    builder.addTvaRates(tvaRates);

    // Exclusions
    if (excludedLaboratories && excludedLaboratories.length > 0) builder.addExcludedLaboratories(excludedLaboratories);
    if (excludedCategories && excludedCategories.length > 0) builder.addExcludedCategories(excludedCategories);
    if (excludedProductCodes && excludedProductCodes.length > 0) builder.addExcludedProducts(excludedProductCodes);
    if (excludedPharmacyIds && excludedPharmacyIds.length > 0) builder.addExcludedPharmacies(excludedPharmacyIds);


    const conditions = builder.getConditions();
    const params = builder.getParams();

    // Search Logic (Manual)
    let searchCondition = '';
    if (search) {
        searchCondition = `AND(mv.laboratory_name ILIKE $${params.length + 1} OR mv.product_label ILIKE $${params.length + 1})`;
        params.push(`% ${search}% `);
    }

    const query = `
WITH 
        pharmacy_counts AS(
    --Count active pharmacies in range
            SELECT 
                CASE 
                    WHEN month >= $1:: date AND month <= $2:: date THEN 'CURRENT'
                    ELSE 'PREVIOUS'
                END as period,
    COUNT(DISTINCT pharmacy_id) as count
            FROM mv_product_stats_monthly mv
            WHERE(month >= $1:: date AND month <= $2:: date) 
               OR(month >= $3:: date AND month <= $4:: date)
            GROUP BY 1
),

    lab_stats AS(
        SELECT 
                mv.laboratory_name,

        --My Metrics(Current)
                SUM(CASE WHEN($5:: uuid IS NULL OR mv.pharmacy_id = $5:: uuid) AND mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.ttc_sold ELSE 0 END) as my_sales_ttc,
        SUM(CASE WHEN($5:: uuid IS NULL OR mv.pharmacy_id = $5:: uuid) AND mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.qty_sold ELSE 0 END) as my_sales_qty,
        SUM(CASE WHEN($5:: uuid IS NULL OR mv.pharmacy_id = $5:: uuid) AND mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.margin_sold ELSE 0 END) as my_margin_ht,
        SUM(CASE WHEN($5:: uuid IS NULL OR mv.pharmacy_id = $5:: uuid) AND mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.ht_sold ELSE 0 END) as my_sales_ht,
        SUM(CASE WHEN($5:: uuid IS NULL OR mv.pharmacy_id = $5:: uuid) AND mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.ht_purchased ELSE 0 END) as my_purchases_ht,
        SUM(CASE WHEN($5:: uuid IS NULL OR mv.pharmacy_id = $5:: uuid) AND mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.qty_purchased ELSE 0 END) as my_purchases_qty,

        --My Metrics(Previous)
                SUM(CASE WHEN($5:: uuid IS NULL OR mv.pharmacy_id = $5:: uuid) AND mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.ttc_sold ELSE 0 END) as my_sales_ttc_prev,
        SUM(CASE WHEN($5:: uuid IS NULL OR mv.pharmacy_id = $5:: uuid) AND mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.qty_sold ELSE 0 END) as my_sales_qty_prev,
        SUM(CASE WHEN($5:: uuid IS NULL OR mv.pharmacy_id = $5:: uuid) AND mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.margin_sold ELSE 0 END) as my_margin_ht_prev,
        SUM(CASE WHEN($5:: uuid IS NULL OR mv.pharmacy_id = $5:: uuid) AND mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.ht_sold ELSE 0 END) as my_sales_ht_prev,
        SUM(CASE WHEN($5:: uuid IS NULL OR mv.pharmacy_id = $5:: uuid) AND mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.ht_purchased ELSE 0 END) as my_purchases_ht_prev,
        SUM(CASE WHEN($5:: uuid IS NULL OR mv.pharmacy_id = $5:: uuid) AND mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.qty_purchased ELSE 0 END) as my_purchases_qty_prev,

        --Group Metrics(Current)
                SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.ttc_sold ELSE 0 END) as group_total_sales_ttc,
        SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.qty_sold ELSE 0 END) as group_total_sales_qty,
        SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.margin_sold ELSE 0 END) as group_total_margin_ht,
        SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.ht_sold ELSE 0 END) as group_total_sales_ht,
        SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.ht_purchased ELSE 0 END) as group_total_purchases_ht,
        SUM(CASE WHEN mv.month >= $1:: date AND mv.month <= $2:: date THEN mv.qty_purchased ELSE 0 END) as group_total_purchases_qty,

        --Group Metrics(Previous)
                SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.ttc_sold ELSE 0 END) as group_total_sales_ttc_prev,
        SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.qty_sold ELSE 0 END) as group_total_sales_qty_prev,
        SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.margin_sold ELSE 0 END) as group_total_margin_ht_prev,
        SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.ht_sold ELSE 0 END) as group_total_sales_ht_prev,
        SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.ht_purchased ELSE 0 END) as group_total_purchases_ht_prev,
        SUM(CASE WHEN mv.month >= $3:: date AND mv.month <= $4:: date THEN mv.qty_purchased ELSE 0 END) as group_total_purchases_qty_prev
                
            FROM mv_product_stats_monthly mv
            LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
            WHERE(
            (mv.month >= $1:: date AND mv.month <= $2:: date) 
               OR(mv.month >= $3:: date AND mv.month <= $4:: date)
    )
              AND mv.ean13 != 'NO-EAN'
              ${conditions}
              ${searchCondition}
            GROUP BY 1
        ),
        
        global_totals AS(
        SELECT
                SUM(my_sales_ttc) as my_total_market,
        SUM(group_total_sales_ttc) as group_total_market,
        SUM(my_sales_ttc_prev) as my_total_market_prev,
        SUM(group_total_sales_ttc_prev) as group_total_market_prev
            FROM lab_stats
    )

SELECT
ls.laboratory_name,

    --Metrics
ls.my_sales_ttc,
    ls.my_sales_qty,
    ls.my_purchases_ht,
    ls.my_purchases_qty,

    CASE WHEN ls.my_sales_ht = 0 THEN 0 ELSE(ls.my_margin_ht / ls.my_sales_ht) * 100 END as my_margin_rate,
        (ls.my_sales_ttc / NULLIF(gt.my_total_market, 0)) * 100 as my_pdm_pct,

        RANK() OVER(ORDER BY ls.my_sales_qty DESC) as my_rank,

            --Group Averages
ls.group_total_sales_ttc / NULLIF(pc_current.count, 0) as group_avg_sales_ttc,
    ls.group_total_sales_qty / NULLIF(pc_current.count, 0) as group_avg_sales_qty,
    ls.group_total_purchases_ht / NULLIF(pc_current.count, 0) as group_avg_purchases_ht,
    ls.group_total_purchases_qty / NULLIF(pc_current.count, 0) as group_avg_purchases_qty,

    CASE WHEN ls.group_total_sales_ht = 0 THEN 0 ELSE(ls.group_total_margin_ht / ls.group_total_sales_ht) * 100 END as group_avg_margin_rate,

        (ls.group_total_sales_ttc / NULLIF(gt.group_total_market, 0)) * 100 as group_pdm_pct,

        RANK() OVER(ORDER BY ls.group_total_sales_ttc DESC) as group_rank,

            --Evolutions
            CASE WHEN ls.my_sales_ttc_prev = 0 THEN 0 ELSE((ls.my_sales_ttc - ls.my_sales_ttc_prev) / ls.my_sales_ttc_prev) * 100 END as my_sales_evolution,
    CASE WHEN ls.group_total_sales_ttc_prev = 0 THEN 0 ELSE((ls.group_total_sales_ttc - ls.group_total_sales_ttc_prev) / ls.group_total_sales_ttc_prev) * 100 END as group_sales_evolution,

        CASE WHEN ls.my_purchases_ht_prev = 0 THEN 0 ELSE((ls.my_purchases_ht - ls.my_purchases_ht_prev) / ls.my_purchases_ht_prev) * 100 END as my_purchases_evolution,
            CASE WHEN ls.group_total_purchases_ht_prev = 0 THEN 0 ELSE((ls.group_total_purchases_ht - ls.group_total_purchases_ht_prev) / ls.group_total_purchases_ht_prev) * 100 END as group_purchases_evolution,

                CASE WHEN ls.my_sales_qty_prev = 0 THEN 0 ELSE((ls.my_sales_qty - ls.my_sales_qty_prev) / ls.my_sales_qty_prev) * 100 END as my_sales_qty_evolution,
                    CASE WHEN ls.group_total_sales_qty_prev = 0 THEN 0 ELSE((ls.group_total_sales_qty - ls.group_total_sales_qty_prev) / ls.group_total_sales_qty_prev) * 100 END as group_sales_qty_evolution,

                        CASE WHEN ls.my_purchases_qty_prev = 0 THEN 0 ELSE((ls.my_purchases_qty - ls.my_purchases_qty_prev) / ls.my_purchases_qty_prev) * 100 END as my_purchases_qty_evolution,
                            CASE WHEN ls.group_total_purchases_qty_prev = 0 THEN 0 ELSE((ls.group_total_purchases_qty - ls.group_total_purchases_qty_prev) / ls.group_total_purchases_qty_prev) * 100 END as group_purchases_qty_evolution,

                                --Evolutions Margin
CASE
WHEN(ls.my_sales_ht_prev = 0) THEN 0
ELSE((CASE WHEN ls.my_sales_ht = 0 THEN 0 ELSE(ls.my_margin_ht / ls.my_sales_ht) * 100 END) - ((ls.my_margin_ht_prev / ls.my_sales_ht_prev) * 100))
END as my_margin_rate_evolution,
    CASE
WHEN(ls.group_total_sales_ht_prev = 0) THEN 0
ELSE((CASE WHEN ls.group_total_sales_ht = 0 THEN 0 ELSE(ls.group_total_margin_ht / ls.group_total_sales_ht) * 100 END) - ((ls.group_total_margin_ht_prev / ls.group_total_sales_ht_prev) * 100))
END as group_margin_rate_evolution,

    --Evolutions PDM
        ((ls.my_sales_ttc / NULLIF(gt.my_total_market, 0)) * 100) - ((ls.my_sales_ttc_prev / NULLIF(gt.my_total_market_prev, 0)) * 100) as my_pdm_evolution,
        ((ls.group_total_sales_ttc / NULLIF(gt.group_total_market, 0)) * 100) - ((ls.group_total_sales_ttc_prev / NULLIF(gt.group_total_market_prev, 0)) * 100) as group_pdm_evolution

        FROM lab_stats ls
        CROSS JOIN global_totals gt
        LEFT JOIN pharmacy_counts pc_current ON pc_current.period = 'CURRENT'
        ORDER BY ls.my_sales_ttc DESC-- Default sort by Sales TTC
    `;

    try {
        const result = await db.query(query, params);
        return result.rows.map(row => ({
            laboratory_name: row.laboratory_name,
            my_rank: Number(row.my_rank),
            my_sales_ttc: Number(row.my_sales_ttc),
            my_sales_qty: Number(row.my_sales_qty),
            my_purchases_ht: Number(row.my_purchases_ht),
            my_purchases_qty: Number(row.my_purchases_qty),
            my_margin_rate: Number(row.my_margin_rate),
            my_pdm_pct: Number(row.my_pdm_pct),
            group_rank: Number(row.group_rank),
            group_avg_sales_ttc: Number(row.group_avg_sales_ttc),
            group_avg_sales_qty: Number(row.group_avg_sales_qty),
            group_avg_purchases_ht: Number(row.group_avg_purchases_ht),
            group_avg_purchases_qty: Number(row.group_avg_purchases_qty),
            group_avg_margin_rate: Number(row.group_avg_margin_rate),
            group_pdm_pct: Number(row.group_pdm_pct),
            my_sales_evolution: Number(row.my_sales_evolution),
            group_sales_evolution: Number(row.group_sales_evolution),
            my_purchases_evolution: Number(row.my_purchases_evolution),
            group_purchases_evolution: Number(row.group_purchases_evolution),
            my_sales_qty_evolution: Number(row.my_sales_qty_evolution),
            group_sales_qty_evolution: Number(row.group_sales_qty_evolution),
            my_purchases_qty_evolution: Number(row.my_purchases_qty_evolution),
            group_purchases_qty_evolution: Number(row.group_purchases_qty_evolution),
            my_margin_rate_evolution: Number(row.my_margin_rate_evolution),
            group_margin_rate_evolution: Number(row.group_margin_rate_evolution),
            my_pdm_evolution: Number(row.my_pdm_evolution),
            group_pdm_evolution: Number(row.group_pdm_evolution)
        }));
    } catch (error) {
        console.error("Failed to fetch laboratory analysis:", error);
        throw error;
    }
}
