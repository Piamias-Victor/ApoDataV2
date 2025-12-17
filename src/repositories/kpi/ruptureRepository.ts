import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi';
import { FilterQueryBuilder } from '@/repositories/utils/FilterQueryBuilder';

/**
 * Fetch Discrepancy (Rupture/Shortage) Statistics.
 * Discrepancy defined as: qte_r < qte (Received less than Ordered)
 * Based on Sent Date (Order Date)
 */
// ... types updated if necessary
export interface DiscrepancyProduct {
    code: string;
    label: string;
}

export async function fetchDiscrepancyData(request: AchatsKpiRequest): Promise<{
    nb_discrepancy: number;
    total_refs_ordered: number;
    discrepancy_codes: DiscrepancyProduct[]
}> {
    const { dateRange, pharmacyIds = [], laboratories = [], categories = [], filterOperators = [] } = request;

    const initialParams = [dateRange.start, dateRange.end];
    // Use 'o.sent_date' as primary time filter as requested
    const qb = new FilterQueryBuilder(initialParams, 3, filterOperators, {
        pharmacyId: 'ip.pharmacy_id',
        laboratory: 'gp.bcb_lab',
        productCode: 'ip.code_13_ref_id',
        cat_l1: 'gp.bcb_segment_l1',
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
    qb.addReimbursementStatus(request.reimbursementStatus);
    qb.addGenericStatus(request.isGeneric);

    const conditions = qb.getConditions();
    const params = qb.getParams();

    // Logic for JOIN
    const needsGlobalProductJoin = laboratories.length > 0 || categories.length > 0 ||
        (request.excludedLaboratories && request.excludedLaboratories.length > 0) ||
        (request.excludedCategories && request.excludedCategories.length > 0) ||
        true; // Always join for potential future filters on global props

    // Query: Group by product to see if TOTAL ordered vs TOTAL received has discrepancy?
    // OR Check line by line?
    // Usually shortage is per line. "I ordered 10, got 5".
    // A reference is "in discrepancy" if AT LEAST ONE line has discrepancy in the period?
    // OR if Total Received < Total Ordered in period?
    // Let's go with "Total Received < Total Ordered" for the period to smooth out split deliveries.

    // We want:
    // 1. Total Distinct Products Ordered
    // 2. Count of Distinct Products where Sum(Received) < Sum(Ordered)
    // 3. List of those product codes

    const query = `
        SELECT
            ip.code_13_ref_id,
            MAX(ip.name) as product_label, -- Or from GP
            SUM(po.qte) as total_ordered,
            SUM(po.qte_r) as total_received
        FROM data_productorder po
        INNER JOIN data_order o ON po.order_id = o.id
        INNER JOIN data_internalproduct ip ON po.product_id = ip.id
        ${needsGlobalProductJoin ? 'LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref' : ''}
        WHERE
            o.sent_date >= $1::date
            AND o.sent_date <= $2::date
            AND o.sent_date IS NOT NULL
            AND po.qte > 0
            ${conditions}
        GROUP BY ip.code_13_ref_id
    `;

    const result = await db.query(query, params);

    let totalRefs = 0;
    let discrepancyCount = 0;
    const codes: DiscrepancyProduct[] = [];

    result.rows.forEach(row => {
        totalRefs++;
        const ord = Number(row.total_ordered);
        const rec = Number(row.total_received);

        if (rec < ord) {
            discrepancyCount++;
            codes.push({
                code: row.code_13_ref_id,
                label: row.product_label || 'Unknown Product'
            });
        }
    });

    return {
        nb_discrepancy: discrepancyCount,
        total_refs_ordered: totalRefs,
        discrepancy_codes: codes
    };
}
