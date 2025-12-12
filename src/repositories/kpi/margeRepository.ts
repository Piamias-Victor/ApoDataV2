import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi';
import { FilterQueryBuilder } from '../utils/FilterQueryBuilder';

/**
 * Fetch margin and sales amount from optimized Materialized View
 * Joins: mv_sales_enriched
 */
export async function fetchMargeData(request: AchatsKpiRequest): Promise<{ montant_marge: number; montant_ht: number }> {
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

    // Ranges
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
        categories.some(c => c.type !== 'bcb_segment_l1');

    // Get finalized SQL parts
    const dynamicWhereClause = qb.getConditions();
    const params = qb.getParams();

    const query = `
    SELECT 
      COALESCE(SUM(mv.montant_marge), 0) as montant_marge,
      COALESCE(SUM(mv.montant_ht), 0) as montant_ht
    FROM mv_sales_enriched mv
    ${needsLatestPriceJoin ? 'LEFT JOIN mv_latest_product_prices lp ON mv.internal_product_id = lp.product_id' : ''}
    ${needsGlobalProductJoin ? 'LEFT JOIN data_globalproduct gp ON mv.code_13_ref = gp.code_13_ref' : ''}
    WHERE mv.sale_date >= $1::date 
      AND mv.sale_date <= $2::date
      ${dynamicWhereClause}
  `;

    const startTime = Date.now();
    console.log('🔍 [Repository] Executing ULTRA-FAST Marge query (MV):', {
        dateRange,
        laboratoriesCount: laboratories.length
    });

    try {
        const result = await db.query(query, params);
        const duration = Date.now() - startTime;

        if (result.rows.length === 0) {
            return { montant_marge: 0, montant_ht: 0 };
        }

        const data = {
            montant_marge: Number(result.rows[0]?.montant_marge) || 0,
            montant_ht: Number(result.rows[0]?.montant_ht) || 0
        };

        console.log(`✅ [Repository] Marge Query completed: { montant_marge: ${data.montant_marge}, montant_ht: ${data.montant_ht}, duration: '${duration}ms' }`);

        return data;
    } catch (error) {
        console.error('❌ [Repository] Marge query failed:', error);
        throw error;
    }
}
