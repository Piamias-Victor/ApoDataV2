import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi';
import { FilterQueryBuilder } from '../utils/FilterQueryBuilder';

/**
 * Fetch Stock Value and Quantity at a specific point in time.
 * Uses `mv_stock_monthly` and "Last Known Value" logic (DISTINCT ON).
 */
export async function fetchStockData(request: AchatsKpiRequest, targetDate: string): Promise<{ stock_value_ht: number; stock_quantity: number }> {
    const { laboratories = [], categories = [], pharmacyIds = [], filterOperators = [] } = request;

    // Initialize Builder
    // NOTE: For Stock, we filter by 'mv.month_end_date <= targetDate' manually in the query structure,
    // so we pass an empty range to builder initially or handle it custom.
    const initialParams = [targetDate];
    const qb = new FilterQueryBuilder(initialParams, 2, filterOperators, {
        pharmacyId: 'mv.pharmacy_id',
        laboratory: 'mv.laboratory_name',
        productCode: 'mv.code_13_ref',
        tva: 'mv.tva_rate', // Not in MV but not critical for Stock Value
        reimbursable: 'mv.is_reimbursable',
        genericStatus: 'mv.bcb_generic_status',
        cat_l1: 'mv.category_name',
    });

    // Apply Filters
    qb.addPharmacies(pharmacyIds);
    qb.addLaboratories(laboratories);
    qb.addCategories(categories);
    if (request.productCodes) qb.addProducts(request.productCodes);

    // Settings
    qb.addReimbursementStatus(request.reimbursementStatus);
    qb.addGenericStatus(request.isGeneric);

    // Get finalized SQL parts
    const dynamicWhereClause = qb.getConditions();
    const params = qb.getParams();

    // "Last Known Value" Query:
    // For each product, get the row with the LATEST month_end_date that is <= targetDate.
    const query = `
    WITH LatestSnapshots AS (
        SELECT DISTINCT ON (mv.product_id)
            mv.stock,
            mv.stock_value_ht
        FROM mv_stock_monthly mv
        WHERE mv.month_end_date <= $1::date
          ${dynamicWhereClause}
        ORDER BY mv.product_id, mv.month_end_date DESC
    )
    SELECT 
        COALESCE(SUM(ls.stock), 0) as stock_quantity,
        COALESCE(SUM(ls.stock_value_ht), 0) as stock_value_ht
    FROM LatestSnapshots ls;
  `;

    const startTime = Date.now();
    console.log('📦 [Repository] Executing Stock Query (Last Known Value):', {
        targetDate,
        laboratoriesCount: laboratories.length
    });

    try {
        const result = await db.query(query, params);
        const duration = Date.now() - startTime;

        const data = {
            stock_quantity: Number(result.rows[0]?.stock_quantity) || 0,
            stock_value_ht: Number(result.rows[0]?.stock_value_ht) || 0
        };

        console.log(`✅ [Repository] Stock Query completed: { quantity: ${data.stock_quantity}, value: ${data.stock_value_ht}, duration: '${duration}ms' }`);

        return data;
    } catch (error) {
        console.error('❌ [Repository] Stock query failed:', error);
        throw error;
    }
}
