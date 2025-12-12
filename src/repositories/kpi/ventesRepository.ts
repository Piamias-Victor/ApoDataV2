import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi'; // Reusing the same request interface as filters are identical
import { FilterQueryBuilder } from '@/repositories/utils/FilterQueryBuilder';

/**
 * Fetch sales quantity and amount (HT) from database
 * Joins: mv_sales_enriched (with optional joins to mv_latest_product_prices and data_globalproduct for specific filters)
 */
export async function fetchVentesData(request: AchatsKpiRequest): Promise<{ quantite_vendue: number; montant_ht: number }> {
    const { dateRange, productCodes = [], laboratories = [], categories = [], pharmacyIds = [], filterOperators = [] } = request;

    // Initialize Builder with MV Custom Mapping
    const initialParams = [dateRange.start, dateRange.end];
    const qb = new FilterQueryBuilder(initialParams, 3, filterOperators, {
        pharmacyId: 'mv.pharmacy_id',
        laboratory: 'mv.laboratory_name',
        productCode: 'mv.code_13_ref',
        tva: 'mv.tva_rate',
        reimbursable: 'mv.is_reimbursable',
        genericStatus: 'mv.bcb_generic_status',

        // MV has category_name (segment_l1), but might not have all granular levels if not added to MV.
        // In the MV definition I see: gp.bcb_segment_l1 AS category_name.
        // If users filter by other levels (l0, l2...), it might fail if we don't have them in MV.
        // However, standard category filter usually targets l1. 
        // If advanced filters are used, we might need to join back to globalproduct.
        // For now, let's map cat_l1 to category_name.
        // If other levels are critical, we should have added them to MV. 
        // For now, let's ASSUME standard l1 filtering or Join GP if complex.
        // Let's keep it simple: Map what we have. If we need more, we JOIN.

        cat_l1: 'mv.category_name',
    });

    // Apply Filters
    qb.addPharmacies(pharmacyIds);
    qb.addLaboratories(laboratories);
    qb.addCategories(categories);
    qb.addProducts(productCodes);

    // Settings
    if (request.tvaRates) qb.addTvaRates(request.tvaRates);
    qb.addReimbursementStatus(request.reimbursementStatus);
    qb.addGenericStatus(request.isGeneric);

    // Ranges (Latest Prices) - mapped to Joined tables 'lp' or 'gp' if joined
    qb.addRangeFilter(request.purchasePriceNetRange, 'lp.weighted_average_price');
    qb.addRangeFilter(request.purchasePriceGrossRange, 'gp.prix_achat_ht_fabricant');
    qb.addRangeFilter(request.sellPriceRange, 'lp.price_with_tax');
    qb.addRangeFilter(request.discountRange, 'lp.discount_percentage');
    qb.addRangeFilter(request.marginRange, 'lp.margin_percentage');

    const needsLatestPriceJoin = (request.purchasePriceNetRange !== undefined) ||
        (request.sellPriceRange !== undefined) ||
        (request.discountRange !== undefined) ||
        (request.marginRange !== undefined);

    const needsGlobalProductJoin = (request.purchasePriceGrossRange !== undefined) ||
        categories.some(c => c.type !== 'bcb_segment_l1'); // If filtering by other cat levels, we need GP

    // Get finalized SQL parts
    const dynamicWhereClause = qb.getConditions();
    const params = qb.getParams();

    const query = `
    SELECT 
      COALESCE(SUM(mv.quantity), 0) as quantite_vendue,
      COALESCE(SUM(mv.montant_ht), 0) as montant_ht
    FROM mv_sales_enriched mv
    ${needsLatestPriceJoin ? 'LEFT JOIN mv_latest_product_prices lp ON mv.internal_product_id = lp.product_id' : ''}
    ${needsGlobalProductJoin ? 'LEFT JOIN data_globalproduct gp ON mv.code_13_ref = gp.code_13_ref' : ''}
    WHERE mv.sale_date >= $1::date 
      AND mv.sale_date <= $2::date
      ${dynamicWhereClause}
  `;

    const startTime = Date.now();
    console.log('🔍 [Repository] Executing ULTRA-FAST Ventes query (MV):', {
        dateRange,
        laboratoriesCount: laboratories.length,
        hasPriceFilters: needsLatestPriceJoin
    });

    try {
        const result = await db.query(query, params);
        const duration = Date.now() - startTime;

        if (result.rows.length === 0) {
            return { quantite_vendue: 0, montant_ht: 0 };
        }

        const quantite_vendue = Number(result.rows[0].quantite_vendue) || 0;
        const montant_ht = Number(result.rows[0].montant_ht) || 0;

        console.log('✅ [Repository] Ventes Query completed:', {
            quantite_vendue,
            montant_ht,
            duration: `${duration}ms`
        });

        return { quantite_vendue, montant_ht };
    } catch (error) {
        console.error('❌ [Repository] Ventes query failed:', error);
        throw error;
    }
}
