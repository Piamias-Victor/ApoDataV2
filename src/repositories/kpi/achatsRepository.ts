// src/repositories/kpi/achatsRepository.ts
import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi';

/**
 * Fetch purchased quantity and amount from database
 * ULTRA-FAST: Uses materialized view for prices
 */
export async function fetchAchatsData(request: AchatsKpiRequest): Promise<{ quantite_achetee: number; montant_ht: number }> {
  const { dateRange, productCodes = [], laboratories = [], categories = [], pharmacyIds = [], filterOperators = [] } = request;

  let paramIndex = 3; // $1 and $2 are dateRange
  const params: any[] = [dateRange.start, dateRange.end];
  const conditions: string[] = [];

  // Track cumulative items to find the correct operator between groups
  let cumulativeItemCount = 0;

  // Helper to add a filter group
  const addFilterGroup = (
    items: any[],
    sqlGenerator: (paramIdx: number) => string
  ) => {
    if (items.length === 0) return;

    // Verify if we need an operator (if not the first group)
    if (conditions.length > 0) {
      // The operator to use is the one "after" the previous block of items
      // Index = cumulativeItemCount - 1
      // Example: [Pharma1] (1 item). Next operator index = 1 - 1 = 0.
      const operatorIndex = cumulativeItemCount - 1;
      const op = filterOperators[operatorIndex] || 'AND'; // Default to AND
      conditions.push(op);
    }

    // Generate SQL for this group (implicitly wrapped in parens by the logic below if needed)
    const sql = sqlGenerator(paramIndex);
    conditions.push(`(${sql})`);

    // Register params for this group
    // If categories (complex), we push dynamic params inside generator? 
    // No, let's keep it simple: we push the WHOLE array as one param usually, 
    // EXCEPT for categories which might need multiple params.

    // For standard arrays (pharma, lab, product)
    if (Array.isArray(items) && items.length > 0 && typeof items[0] !== 'object') {
      params.push(items);
      paramIndex++;
    }

    cumulativeItemCount += items.length;
  };

  // 1. PHARMACIES (First in Store order)
  addFilterGroup(pharmacyIds, (idx) => `ip.pharmacy_id = ANY($${idx}::uuid[])`);

  // 2. LABORATORIES
  addFilterGroup(laboratories, (idx) => `gp.bcb_lab = ANY($${idx}::text[])`);

  // 3. CATEGORIES (Complex handling)
  if (categories.length > 0) {
    // Group codes by type
    const codesByType: Record<string, string[]> = {};
    categories.forEach(cat => {
      if (!codesByType[cat.type]) codesByType[cat.type] = [];
      codesByType[cat.type].push(cat.code);
    });

    // We treat the Categories block as ONE group for the "External Operator" logic
    // But internally it's an OR between types

    // Calculate params needed
    const categorySqlParts: string[] = [];
    const validColumns = ['bcb_segment_l0', 'bcb_segment_l1', 'bcb_segment_l2', 'bcb_segment_l3', 'bcb_segment_l4', 'bcb_segment_l5', 'bcb_family'];

    Object.entries(codesByType).forEach(([type, codes]) => {
      if (!validColumns.includes(type)) return;
      categorySqlParts.push(`gp.${type} = ANY($${paramIndex}::text[])`);
      params.push(codes);
      paramIndex++;
    });

    if (categorySqlParts.length > 0) {
      const categorySql = categorySqlParts.join(' OR ');

      // Manually invoke logic similar to addFilterGroup but without pushing params (already done)
      if (conditions.length > 0) {
        const operatorIndex = cumulativeItemCount - 1;
        const op = filterOperators[operatorIndex] || 'AND';
        conditions.push(op);
      }
      conditions.push(`(${categorySql})`);
      cumulativeItemCount += categories.length;
    }
  }

  // 4. PRODUCTS
  addFilterGroup(productCodes, (idx) => `ip.code_13_ref_id = ANY($${idx}::text[])`);

  // Need GlobalProduct JOIN if filtering by laboratory or category
  const needsGlobalProductJoin = laboratories.length > 0 || categories.length > 0;

  // Build WHERE clause
  const dynamicWhereClause = conditions.length > 0
    ? `AND (${conditions.join(' ')})`
    : '';

  // ULTRA-FAST QUERY
  const query = `
    SELECT 
      COALESCE(SUM(po.qte_r), 0) as quantite_achetee,
      COALESCE(SUM(po.qte_r * COALESCE(lp.weighted_average_price, 0)), 0) as montant_ht
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
    operators: filterOperators // logging operators
  });

  try {
    const result = await db.query(query, params);
    const duration = Date.now() - startTime;

    if (result.rows.length === 0) {
      return { quantite_achetee: 0, montant_ht: 0 };
    }

    const quantite_achetee = Number(result.rows[0].quantite_achetee) || 0;
    const montant_ht = Number(result.rows[0].montant_ht) || 0;

    console.log('✅ [Repository] Query completed:', {
      quantite_achetee,
      montant_ht,
      duration: `${duration}ms`
    });

    return { quantite_achetee, montant_ht };
  } catch (error) {
    console.error('❌ [Repository] Database query failed:', error);
    throw error;
  }
}
