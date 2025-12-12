import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi';
import { FilterQueryBuilder } from '../utils/FilterQueryBuilder';

interface PriceData {
    avg_purchase_price: number;
    avg_sell_price_ttc: number;
}

export async function fetchPriceEvolutionData(request: AchatsKpiRequest): Promise<PriceData> {
    const { dateRange, laboratories = [], categories = [], pharmacyIds = [], filterOperators = [] } = request;

    const qb = new FilterQueryBuilder([dateRange.start, dateRange.end], 3, filterOperators, {
        pharmacyId: 'mv.pharmacy_id',
        laboratory: 'mv.laboratory_name',
        productCode: 'mv.code_13_ref',
        tva: 'mv.tva_rate',
        reimbursable: 'mv.is_reimbursable',
        genericStatus: 'mv.bcb_generic_status',
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
    if (request.tvaRates) qb.addTvaRates(request.tvaRates);
    qb.addReimbursementStatus(request.reimbursementStatus);
    qb.addGenericStatus(request.isGeneric);

    const dynamicWhereClause = qb.getConditions();
    const params = qb.getParams();

    // Logic:
    // Avg Purchase Price = Sum(Total HT - Margin) / Sum(Quantity)
    // Avg Sell Price TTC = Sum(Total HT * (1 + TVA/100)) / Sum(Quantity)

    const query = `
        SELECT 
            COALESCE(SUM(mv.quantity), 0) as total_qty,
            COALESCE(SUM(mv.montant_ht - mv.montant_marge), 0) as total_cost,
            COALESCE(SUM(mv.montant_ht * (1 + COALESCE(mv.tva_rate, 0) / 100.0)), 0) as total_sell_ttc
        FROM mv_sales_enriched mv
        WHERE mv.sale_date >= $1::date AND mv.sale_date <= $2::date
        ${dynamicWhereClause}
    `;

    const startTime = Date.now();

    try {
        const result = await db.query(query, params);
        const row = result.rows[0];

        const qty = Number(row?.total_qty) || 0;
        const totalCost = Number(row?.total_cost) || 0;
        const totalSellTTC = Number(row?.total_sell_ttc) || 0;

        if (qty === 0) {
            return { avg_purchase_price: 0, avg_sell_price_ttc: 0 };
        }

        const avgPurchase = totalCost / qty;
        const avgSellTTC = totalSellTTC / qty;

        console.log(`📉 [Repository] Price Evolution: Qty=${qty}, AvgBuy=${avgPurchase.toFixed(2)}, AvgSellTTC=${avgSellTTC.toFixed(2)} (${Date.now() - startTime}ms)`);

        return {
            avg_purchase_price: avgPurchase,
            avg_sell_price_ttc: avgSellTTC
        };

    } catch (error) {
        console.error('❌ [Repository] Price Evolution query failed:', error);
        throw error;
    }
}
