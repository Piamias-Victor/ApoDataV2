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
    sqlGenerator: (paramIdx: number) => string,
    usesParams: boolean = true // NEW: Option to skip param registration
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

    // Register params if needed
    if (usesParams && Array.isArray(items) && items.length > 0) {
      // Check if it's a flat array of primitives
      if (typeof items[0] !== 'object' || items[0] === null) {
        params.push(items);
        paramIndex++;
      }
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
      codesByType[cat.type]!.push(cat.code);
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

  // 5. SETTINGS: TVA Rates
  if (request.tvaRates && request.tvaRates.length > 0) {
    addFilterGroup(request.tvaRates, (idx) => `gp.tva_percentage = ANY($${idx}::numeric[])`);
  }

  // 6. SETTINGS: Reimbursement Status
  if (request.reimbursementStatus && request.reimbursementStatus !== 'ALL') {
    const items = [request.reimbursementStatus]; // Treat as 1 item for counting
    addFilterGroup(items, (idx) => {
      if (request.reimbursementStatus === 'REIMBURSED') return `gp.is_reimbursable = true`;
      if (request.reimbursementStatus === 'NOT_REIMBURSED') return `gp.is_reimbursable = false`;
      return '1=1';
    }, false); // 👈 usesParams = false
  }

  // 7. SETTINGS: Generic Status
  if (request.isGeneric && request.isGeneric !== 'ALL') {
    let values: string[] = [];
    if (request.isGeneric === 'GENERIC') values = ['GÉNÉRIQUE'];
    if (request.isGeneric === 'PRINCEPS') values = ['RÉFÉRENT'];
    if (request.isGeneric === 'PRINCEPS_GENERIC') values = ['GÉNÉRIQUE', 'RÉFÉRENT'];

    // We pass 'values' as the items wrapper.
    // NOTE: In the store logic, the filter count was incremented by 1 for the whole "Generic" setting.
    // So we must pass an array of length 1 to addFilterGroup to keep cumulativeItemCount in sync with the frontend operators array.
    // BUT we want to push the specific values to SQL params.

    // Solution: Pass a dummy array of length 1 as 'items' to addFilterGroup to satisfy operator logic,
    // but manually push the REAL values to params?

    // ACTUALLY: The 'items' passed to addFilterGroup determines the parameter pushed if usesParams=true.
    // If we pass `values` (e.g. ['GÉNÉRIQUE', 'RÉFÉRENT']), length is 2.
    // But the frontend counted this as 1 filter "Generic".
    // So cumulativeItemCount should increase by 1.

    // Let's pass a wrapper array `[values]` so length is 1? No, then param is `[[...]]`.

    // Alternative: Use usesParams = false, manually handle params inside?
    // Or simply: pass `[request.isGeneric]` as items (length 1), but inside the generator use a new param for the values.

    // Let's use usesParams=false and handle the parameter push manually/inside generator? No generator can't push.

    // Cleanest:
    // Pass items = [request.isGeneric] (length 1).
    // usesParams = false.
    // Manually push 'values' to params array before calling addFilterGroup? Protocol breach.

    // Let's adjust addFilterGroup logic slightly?
    // No, let's just cheat. Use string literals for these specific known safe string values.

    addFilterGroup([request.isGeneric], (_idx) => {
      if (values.length === 0) return '1=1';
      // Safe because values are hardcoded above
      const valuesList = values.map(v => `'${v}'`).join(',');
      return `gp.bcb_generic_status IN (${valuesList})`;
    }, false);
  }

  // Need GlobalProduct JOIN if filtering by laboratory, category, or settings
  const needsGlobalProductJoin = laboratories.length > 0 || categories.length > 0 ||
    (request.tvaRates && request.tvaRates.length > 0) ||
    (request.reimbursementStatus && request.reimbursementStatus !== 'ALL') ||
    (request.isGeneric && request.isGeneric !== 'ALL');

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
