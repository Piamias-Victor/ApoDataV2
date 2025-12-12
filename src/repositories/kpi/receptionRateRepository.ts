import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi';
import { FilterQueryBuilder } from '../utils/FilterQueryBuilder';

/**
 * Calculate Reception Rate.
 * Formula: SUM(qte_r) / SUM(qte) * 100
 * Only considers orders with qte > 0 to avoid division by zero.
 */
export async function fetchReceptionRate(request: AchatsKpiRequest): Promise<number> {
    const { dateRange, laboratories = [], categories = [], pharmacyIds = [], filterOperators = [] } = request;



    // NOTE: Reception Rate needs joins: data_productorder -> data_order -> data_internalproduct -> mv_latest_product_prices (for attributes)
    // FilterQueryBuilder is designed for simple WHERE clauses.
    // For complex joins, we construct the WHERE part but field mappings must match aliases.

    // 1. Configure Builder with mappings for joined tables
    // ip = data_internalproduct
    // gp = data_globalproduct (for Lab/Categories)
    const build = new FilterQueryBuilder([dateRange.start, dateRange.end], 3, filterOperators, {
        pharmacyId: 'ip.pharmacy_id',
        laboratory: 'gp.bcb_lab',
        productCode: 'ip.code_13_ref_id',
        // Categories rely on default mappings (gp.bcb_segment_l1, etc.) which is correct if we join gp.
    });

    build.addPharmacies(pharmacyIds);
    build.addLaboratories(laboratories);
    build.addCategories(categories);
    if (request.productCodes) build.addProducts(request.productCodes);

    // Exclusions
    if (request.excludedPharmacyIds) build.addExcludedPharmacies(request.excludedPharmacyIds);
    if (request.excludedLaboratories) build.addExcludedLaboratories(request.excludedLaboratories);
    if (request.excludedCategories) build.addExcludedCategories(request.excludedCategories);
    if (request.excludedProductCodes) build.addExcludedProducts(request.excludedProductCodes);

    build.addReimbursementStatus(request.reimbursementStatus);
    build.addGenericStatus(request.isGeneric);

    const dynamicWhereClause = build.getConditions();
    const params = build.getParams();

    const query = `
        SELECT 
            COALESCE(SUM(po.qte_r), 0) as total_received,
            COALESCE(SUM(po.qte), 0) as total_ordered
        FROM data_productorder po
        JOIN data_order o ON po.order_id = o.id
        JOIN data_internalproduct ip ON po.product_id = ip.id
        LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
        WHERE o.delivery_date >= $1::date AND o.delivery_date <= $2::date
          AND po.qte > 0 -- Avoid division by zero risks at row level if any
          ${dynamicWhereClause}
    `;

    const startTime = Date.now();

    try {
        const result = await db.query(query, params);
        const received = Number(result.rows[0]?.total_received) || 0;
        const ordered = Number(result.rows[0]?.total_ordered) || 0;

        if (ordered === 0) return 0;

        const rate = (received / ordered) * 100;

        console.log(`🚚 [Repository] Reception Rate: Received=${received}, Ordered=${ordered}, Rate=${rate.toFixed(2)}% (${Date.now() - startTime}ms)`);

        return rate;

    } catch (error) {
        console.error('❌ [Repository] Reception Rate query failed:', error);
        throw error;
    }
}
