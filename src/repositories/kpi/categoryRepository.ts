
import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi';
import { FilterQueryBuilder } from '@/repositories/utils/FilterQueryBuilder';

export interface CategoryMetric {
    name: string;

    // Sell-out (Sales)
    sales_ttc: number;
    sales_ht: number;
    sales_qty: number;

    // Sell-in (Purchases)
    purchases_ht: number; // Requested ACHAT €
    purchases_qty: number; // Requested ACHAT QTE

    // Margin
    margin_ht: number;
    margin_rate: number; // Calculated (margin / sales_ht) * 100

    // Market Share (PDM)
    market_share_pct: number; // (sales_ttc / total_market_sales_ttc) * 100

    // Evolution
    evolution_pdm: number; // (current_pdm - previous_pdm)
    evolution_sales: number;
    evolution_sales_qty: number;
    evolution_purchases: number;
    evolution_purchases_qty: number;
    evolution_margin_rate: number; // point difference for rates? or percentage change? Usually rates handled as point diff (pts) or % change. 
    // User requested "Marge %" evolution. For rate, point difference is standard (e.g. 20% -> 25% = +5pts).
    // But for others it is % change.
    // Let's use point difference for Margin Rate as it aligns with PDM.
}

export async function getCategoryMetrics(request: AchatsKpiRequest, path: string[]): Promise<CategoryMetric[]> {
    const { dateRange, pharmacyIds = [], laboratories = [], categories = [], productCodes = [], filterOperators = [] } = request;

    // 1. Determine Target Level (0 to 5)
    // path = [] -> Group by l0
    // path = ['Drugs'] -> Group by l1 WHERE l0='Drugs'
    const targetLevel = path.length;
    // NOTE: mv_product_stats_monthly usually has ean13. We need to JOIN data_globalproduct gp ON mv.ean13 = gp.code_13_ref to get categories.
    // Or if mv_product_stats_monthly is enriched with categories, we use that. 
    // Let's assume we need to join globalproduct.

    const categoryColumn = `gp.bcb_segment_l${targetLevel}`; // Corrected column name

    // Safety check
    if (targetLevel > 5) {
        return [];
    }

    const myPharmacyId = pharmacyIds[0] || null;

    // 2. Dates
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const duration = end.getTime() - start.getTime();
    // Previous period: simple shift
    const prevStart = new Date(start.getTime() - duration - 86400000);
    const prevEnd = new Date(start.getTime() - 86400000);

    // 3. Query Phase
    // We need TOTAL market for PDM calculation.
    // "Total Market" = Sum of sales of ALL categories at this level (or all products in scope?).
    // PDM is usually relative to the scope.

    // Let's use similar CTE structure as LaboratoryAnalysis to get Current/Previous totals.

    const baseParams = [dateRange.start, dateRange.end, prevStart.toISOString(), prevEnd.toISOString(), myPharmacyId];

    // Filter Builder
    const qb = new FilterQueryBuilder(
        baseParams,
        6,
        (myPharmacyId) ? (filterOperators || []).slice(1) : filterOperators,
        {
            pharmacyId: 'mv.pharmacy_id',
            laboratory: 'mv.laboratory_name',
            productCode: 'mv.ean13',
            // Categories joined from GP - CORRECTED COLUMNS
            cat_l0: 'gp.bcb_segment_l0',
            cat_l1: 'gp.bcb_segment_l1',
            cat_l2: 'gp.bcb_segment_l2',
            cat_l3: 'gp.bcb_segment_l3',
            cat_l4: 'gp.bcb_segment_l4',
            cat_l5: 'gp.bcb_segment_l5'
        }
    );

    // Filters
    qb.addLaboratories(laboratories);
    qb.addCategories(categories);
    qb.addProducts(productCodes);
    if (request.excludedLaboratories) qb.addExcludedLaboratories(request.excludedLaboratories);
    if (request.excludedCategories) qb.addExcludedCategories(request.excludedCategories); // Be careful with excluding the category we are drilling into

    // Path Filters (Drill Down)
    // Manually add conditions for the path
    let pathConditions = '';
    const params = qb.getParams();

    path.forEach((segmentName, index) => {
        const paramIndex = params.length + 1;
        params.push(segmentName);
        pathConditions += ` AND gp.bcb_segment_l${index} = $${paramIndex}`;
    });

    const conditions = qb.getConditions() + pathConditions;

    const query = `
    WITH 
        category_stats AS (
            SELECT 
                ${categoryColumn} as name,

                -- Current
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.ttc_sold ELSE 0 END) as sales_ttc,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.ht_sold ELSE 0 END) as sales_ht,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.qty_sold ELSE 0 END) as sales_qty,
                
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.ht_purchased ELSE 0 END) as purchases_ht,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.qty_purchased ELSE 0 END) as purchases_qty,

                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.margin_sold ELSE 0 END) as margin_ht,

                -- Previous
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.ttc_sold ELSE 0 END) as sales_ttc_prev,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.ht_sold ELSE 0 END) as sales_ht_prev,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.qty_sold ELSE 0 END) as sales_qty_prev,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.ht_purchased ELSE 0 END) as purchases_ht_prev,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.qty_purchased ELSE 0 END) as purchases_qty_prev,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.margin_sold ELSE 0 END) as margin_ht_prev
                
            FROM mv_product_stats_monthly mv
            LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
            WHERE (
                (mv.month >= $1::date AND mv.month <= $2::date) 
                OR (mv.month >= $3::date AND mv.month <= $4::date)
            )
            AND ${categoryColumn} IS NOT NULL 
            AND ${categoryColumn} != ''
            AND ${categoryColumn} != 'NaN'
            ${conditions}
            GROUP BY 1
        )
    
    SELECT 
        *,
        SUM(sales_ttc) OVER() as total_sales_ttc,
        SUM(sales_ttc_prev) OVER() as total_sales_ttc_prev
    FROM category_stats
    ORDER BY sales_ttc DESC
    `;

    try {
        const result = await db.query(query, params);

        return result.rows.map(row => {
            const salesTtc = Number(row.sales_ttc);
            const salesTtcPrev = Number(row.sales_ttc_prev);
            const salesHt = Number(row.sales_ht);
            const marginHt = Number(row.margin_ht);

            const salesQty = Number(row.sales_qty);
            const salesQtyPrev = Number(row.sales_qty_prev);
            const purchasesHt = Number(row.purchases_ht);
            const purchasesHtPrev = Number(row.purchases_ht_prev);
            const purchasesQty = Number(row.purchases_qty);
            const purchasesQtyPrev = Number(row.purchases_qty_prev);
            const marginHtPrev = Number(row.margin_ht_prev);
            const salesHtPrev = Number(row.sales_ht_prev);

            const totalSalesTtc = Number(row.total_sales_ttc);
            const totalSalesTtcPrev = Number(row.total_sales_ttc_prev);

            // Calculations
            const marginRate = salesHt ? (marginHt / salesHt) * 100 : 0;
            const marginRatePrev = salesHtPrev ? (marginHtPrev / salesHtPrev) * 100 : 0;
            const evolutionMarginRate = marginRate - marginRatePrev; // Points diff

            const pdmPct = totalSalesTtc ? (salesTtc / totalSalesTtc) * 100 : 0;
            const pdmPctPrev = totalSalesTtcPrev ? (salesTtcPrev / totalSalesTtcPrev) * 100 : 0;
            const evolutionPdm = pdmPct - pdmPctPrev;

            // Simple evolutions (Percentage Change)
            const calculateEvolution = (current: number, prev: number) =>
                prev !== 0 ? ((current - prev) / prev) * 100 : 0;

            const evolutionSales = calculateEvolution(salesTtc, salesTtcPrev);
            const evolutionSalesQty = calculateEvolution(salesQty, salesQtyPrev);
            const evolutionPurchases = calculateEvolution(purchasesHt, purchasesHtPrev);
            const evolutionPurchasesQty = calculateEvolution(purchasesQty, purchasesQtyPrev);

            return {
                name: row.name,
                sales_ttc: salesTtc,
                sales_ht: salesHt,
                sales_qty: salesQty,
                purchases_ht: purchasesHt,
                purchases_qty: purchasesQty,
                margin_ht: marginHt,
                margin_rate: marginRate,
                market_share_pct: pdmPct,
                evolution_pdm: evolutionPdm,
                evolution_sales: evolutionSales,
                evolution_sales_qty: evolutionSalesQty,
                evolution_purchases: evolutionPurchases,
                evolution_purchases_qty: evolutionPurchasesQty,
                evolution_margin_rate: evolutionMarginRate
            };
        });

    } catch (error) {
        console.error('Category Analysis Query Failed', error);
        throw error;
    }
}
