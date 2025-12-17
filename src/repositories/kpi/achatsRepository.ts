import { db } from '@/lib/db';
import { AchatsKpiRequest, Grain } from '@/types/kpi';
import { FilterQueryBuilder } from '@/repositories/utils/FilterQueryBuilder';

/**
 * Fetch purchased quantity and amount from database
 * ULTRA-FAST: Uses materialized view for prices
 */
export async function fetchAchatsData(request: AchatsKpiRequest): Promise<{ quantite_achetee: number; montant_ht: number; montant_ttc: number }> {
  const { dateRange, productCodes = [], laboratories = [], categories = [], pharmacyIds = [], filterOperators = [] } = request;

  // Initialize Builder
  const initialParams = [dateRange.start, dateRange.end];
  const qb = new FilterQueryBuilder(initialParams, 3, filterOperators);

  // Apply Filters
  qb.addPharmacies(pharmacyIds);
  qb.addLaboratories(laboratories);
  qb.addCategories(categories);
  qb.addProducts(productCodes);

  // Exclusions
  if (request.excludedPharmacyIds) qb.addExcludedPharmacies(request.excludedPharmacyIds);
  if (request.excludedLaboratories) qb.addExcludedLaboratories(request.excludedLaboratories);
  if (request.excludedCategories) qb.addExcludedCategories(request.excludedCategories);
  if (request.excludedProductCodes) qb.addExcludedProducts(request.excludedProductCodes);

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

  // Logic for JOINs
  const needsGlobalProductJoin = laboratories.length > 0 || categories.length > 0 ||
    (request.excludedLaboratories && request.excludedLaboratories.length > 0) ||
    (request.excludedCategories && request.excludedCategories.length > 0) ||
    (request.tvaRates && request.tvaRates.length > 0) ||
    (request.reimbursementStatus && request.reimbursementStatus !== 'ALL') ||
    (request.isGeneric && request.isGeneric !== 'ALL') ||
    (request.purchasePriceGrossRange !== undefined) ||
    (request.purchasePriceGrossRange !== undefined) ||
    (request.sellPriceRange !== undefined) ||
    true; // Always join for TVA calculations (montant_ttc)

  // Get finalized SQL parts
  const dynamicWhereClause = qb.getConditions();
  const params = qb.getParams();

  // ULTRA-FAST QUERY
  const query = `
    SELECT 
      COALESCE(SUM(po.qte_r), 0) as quantite_achetee,
      COALESCE(SUM(po.qte_r * COALESCE(lp.weighted_average_price, 0)), 0) as montant_ht,
      COALESCE(SUM(po.qte_r * COALESCE(lp.weighted_average_price, 0) * (1 + COALESCE(gp.tva_percentage, 0) / 100.0)), 0) as montant_ttc
    FROM data_productorder po
    INNER JOIN data_order o ON po.order_id = o.id
    INNER JOIN data_internalproduct ip ON po.product_id = ip.id
    ${needsGlobalProductJoin ? 'LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref' : ''}
    LEFT JOIN mv_latest_product_prices lp ON po.product_id = lp.product_id
    WHERE o.delivery_date >= $1::date 
      AND o.delivery_date <= $2::date
      AND o.delivery_date IS NOT NULL
      AND po.qte_r > 0
      ${dynamicWhereClause}
  `;

  const startTime = Date.now();
  console.log('🔍 [Repository] Executing ULTRA-FAST Achats query (with materialized view):', {
    dateRange,
    productCodesCount: productCodes.length,
    laboratoriesCount: laboratories.length,
    categoriesCount: categories.length,
    pharmacyIdsCount: pharmacyIds.length,
    operators: filterOperators,
    hasPurchasePrice: !!request.purchasePriceNetRange,
    hasGrossPrice: !!request.purchasePriceGrossRange,
    hasSellPrice: !!request.sellPriceRange,
    hasDiscount: !!request.discountRange,
    hasMargin: !!request.marginRange
  });

  try {
    const result = await db.query(query, params);
    const duration = Date.now() - startTime;

    if (result.rows.length === 0) {
      return { quantite_achetee: 0, montant_ht: 0, montant_ttc: 0 };
    }

    const quantite_achetee = Number(result.rows[0].quantite_achetee) || 0;
    const montant_ht = Number(result.rows[0].montant_ht) || 0;
    const montant_ttc = Number(result.rows[0].montant_ttc) || 0;

    console.log('✅ [Repository] Query completed:', {
      quantite_achetee,
      montant_ht,
      duration: `${duration}ms`
    });

    return { quantite_achetee, montant_ht, montant_ttc };
  } catch (error) {
    console.error('❌ [Repository] Database query failed:', error);
    throw error;
  }
}

/**
 * Get Purchases Evolution
 */
export async function getPurchasesEvolution(request: AchatsKpiRequest, grain: Grain): Promise<{ date: string; achat_ht: number }[]> {
  const { dateRange, pharmacyIds = [], laboratories = [], categories = [], productCodes = [], filterOperators = [] } = request;

  const initialParams = [dateRange.start, dateRange.end];
  const qb = new FilterQueryBuilder(initialParams, 3, filterOperators);

  qb.addPharmacies(pharmacyIds);
  qb.addLaboratories(laboratories);
  qb.addCategories(categories);
  qb.addProducts(productCodes);
  if (request.excludedPharmacyIds) qb.addExcludedPharmacies(request.excludedPharmacyIds);
  if (request.excludedLaboratories) qb.addExcludedLaboratories(request.excludedLaboratories);
  if (request.excludedCategories) qb.addExcludedCategories(request.excludedCategories);
  if (request.excludedProductCodes) qb.addExcludedProducts(request.excludedProductCodes);

  const conditions = qb.getConditions();
  const params = qb.getParams();
  let trunc = grain === 'week' ? 'week' : (grain === 'month' ? 'month' : 'day');

  const query = `
        SELECT 
            DATE_TRUNC('${trunc}', o.delivery_date) as date,
            COALESCE(SUM(po.qte_r * COALESCE(lp.weighted_average_price, 0)), 0) as achat_ht
        FROM data_productorder po
        INNER JOIN data_order o ON po.order_id = o.id
        INNER JOIN data_internalproduct ip ON po.product_id = ip.id
        LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
        LEFT JOIN mv_latest_product_prices lp ON po.product_id = lp.product_id
        WHERE o.delivery_date >= $1::date 
          AND o.delivery_date <= $2::date
          AND o.delivery_date IS NOT NULL
          AND po.qte_r > 0
          ${conditions}
        GROUP BY 1
        ORDER BY 1 ASC
    `;

  const result = await db.query(query, params);
  return result.rows.map(row => ({
    date: row.date.toISOString(),
    achat_ht: Number(row.achat_ht)
  }));
}

/**
 * Get Pre-order Evolution (Based on sent_date)
 */
export async function fetchPreorderEvolution(request: AchatsKpiRequest, grain: Grain): Promise<{ date: string; achat_ht: number; achat_qty: number }[]> {
  const { dateRange, pharmacyIds = [], laboratories = [], categories = [], productCodes = [], filterOperators = [] } = request;

  const initialParams = [dateRange.start, dateRange.end];
  const qb = new FilterQueryBuilder(initialParams, 3, filterOperators);

  qb.addPharmacies(pharmacyIds);
  qb.addLaboratories(laboratories);
  qb.addCategories(categories);
  qb.addProducts(productCodes);
  if (request.excludedPharmacyIds) qb.addExcludedPharmacies(request.excludedPharmacyIds);
  if (request.excludedLaboratories) qb.addExcludedLaboratories(request.excludedLaboratories);
  if (request.excludedCategories) qb.addExcludedCategories(request.excludedCategories);
  if (request.excludedProductCodes) qb.addExcludedProducts(request.excludedProductCodes);

  const conditions = qb.getConditions();
  const params = qb.getParams();
  let trunc = grain === 'week' ? 'week' : (grain === 'month' ? 'month' : 'day');

  // Logic for JOINs (same as other functions)
  const needsGlobalProductJoin = laboratories.length > 0 || categories.length > 0 ||
    (request.excludedLaboratories && request.excludedLaboratories.length > 0) ||
    (request.excludedCategories && request.excludedCategories.length > 0);

  const query = `
        SELECT 
            DATE_TRUNC('${trunc}', o.sent_date) as date,
            COALESCE(SUM(po.qte), 0) as achat_qty,
            COALESCE(SUM(po.qte * COALESCE(lp.weighted_average_price, 0)), 0) as achat_ht
        FROM data_productorder po
        INNER JOIN data_order o ON po.order_id = o.id
        INNER JOIN data_internalproduct ip ON po.product_id = ip.id
        ${needsGlobalProductJoin ? 'LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref' : ''}
        LEFT JOIN mv_latest_product_prices lp ON po.product_id = lp.product_id
        WHERE o.sent_date >= $1::date 
          AND o.sent_date <= $2::date
          AND o.sent_date IS NOT NULL
          ${conditions}
        GROUP BY 1
        ORDER BY 1 ASC
    `;

  const result = await db.query(query, params);
  return result.rows.map(row => ({
    date: row.date.toISOString(),
    achat_ht: Number(row.achat_ht),
    achat_qty: Number(row.achat_qty)
  }));
}
