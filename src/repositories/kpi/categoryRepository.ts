import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi';
import { FilterQueryBuilder } from '@/repositories/utils/FilterQueryBuilder';

export interface CategoryMetric {
    name: string;
    value: number; // Montant Vente TTC (ou HT selon choix, user asked for TTC)
    count: number; // Quantity
}

export async function getCategoryMetrics(request: AchatsKpiRequest, path: string[]): Promise<CategoryMetric[]> {
    const { dateRange, pharmacyIds = [], laboratories = [], categories = [], productCodes = [], filterOperators = [] } = request;

    // 1. Determine Target Level (0 to 5)
    // path = [] -> Group by l0
    // path = ['Drugs'] -> Group by l1 WHERE l0='Drugs'
    const targetLevel = path.length;
    const targetColumn = `mv.cat_l${targetLevel}`;

    // Safety check
    if (targetLevel > 5) {
        return [];
    }

    // 2. Query Builder
    const initialParams = [dateRange.start, dateRange.end];
    // Start param index offset based on initialParams length + 1 (for $3, $4...)
    // Actually FilterQueryBuilder handles offsets. We just need to append path filters to it?
    // FilterQueryBuilder adds standard filters. We can manually add WHERE clauses for path.
    // But FilterQueryBuilder expects specific methods.
    // We can interact with it or add manual conditions.
    // Let's rely on standard builder for global filters, and add custom WHERE for path.

    const qb = new FilterQueryBuilder(initialParams, 3, filterOperators, {
        pharmacyId: 'mv.pharmacy_id',
        laboratory: 'mv.laboratory_name',
        productCode: 'mv.code_13_ref',
        // Category Levels (MV Columns)
        cat_l0: 'mv.cat_l0',
        cat_l1: 'mv.cat_l1',
        cat_l2: 'mv.cat_l2',
        cat_l3: 'mv.cat_l3',
        cat_l4: 'mv.cat_l4',
        cat_l5: 'mv.cat_l5',
        // Other Settings
        tva: 'mv.tva_rate',
        reimbursable: 'mv.is_reimbursable',
        genericStatus: 'mv.bcb_generic_status'
    });

    // Apply Standard Filters
    qb.addPharmacies(pharmacyIds);
    qb.addLaboratories(laboratories);
    qb.addCategories(categories); // Note: this might conflict if user filters by L1 'A' but drills into L0 'B'.
    // If Global Filter is active, the TreeMap should respect it.
    // Example: Filter "Doliprane" -> TreeMap should only show categories containing it.
    // Filter "Category X" -> TreeMap only shows X (and its children).
    // So YES, we apply standard filters.

    qb.addProducts(productCodes);
    if (request.excludedPharmacyIds) qb.addExcludedPharmacies(request.excludedPharmacyIds);
    if (request.excludedLaboratories) qb.addExcludedLaboratories(request.excludedLaboratories);
    if (request.excludedCategories) qb.addExcludedCategories(request.excludedCategories);
    if (request.excludedProductCodes) qb.addExcludedProducts(request.excludedProductCodes);

    // Settings
    if (request.tvaRates) qb.addTvaRates(request.tvaRates);
    qb.addReimbursementStatus(request.reimbursementStatus);
    qb.addGenericStatus(request.isGeneric);

    let conditions = qb.getConditions();
    const params = qb.getParams();

    // 3. Apply Path Filters (Drill Down)
    // For each item in path, we restrict the query.
    // path[0] -> cat_l0 = $x
    // path[1] -> cat_l1 = $y
    path.forEach((segmentName, index) => {
        const paramIndex = params.length + 1;
        params.push(segmentName);
        conditions += ` AND mv.cat_l${index} = $${paramIndex}`;
    });

    // 4. Query
    // We select the target column as name
    // We assume Vente TTC as metric (User requested TTC) -> Sum(amount_ht * (1+tva)) or similar?
    // MV has `montant_ht` and `tva_rate`.
    // Or we can rely on `amount_ht` if TTC is complex.
    // User explicitly asked: "Métrique : ... montant TTC stp".
    // Formula: montant_ht * (1 + tva_rate/100).

    const query = `
        SELECT 
            ${targetColumn} as name,
            SUM(mv.montant_ht * (1 + COALESCE(mv.tva_rate, 0) / 100.0)) as value,
            SUM(mv.quantity) as count
        FROM mv_sales_enriched mv
        WHERE mv.sale_date >= $1::date 
          AND mv.sale_date <= $2::date
          AND ${targetColumn} IS NOT NULL 
          AND ${targetColumn} != 'NaN'
          AND ${targetColumn} != ''
          ${conditions}
        GROUP BY 1
        ORDER BY 2 DESC
    `;

    const startTime = Date.now();
    try {
        const result = await db.query(query, params);
        const duration = Date.now() - startTime;

        console.log(`🌳 [CategoryRepo] Level ${targetLevel} (${path.join('>')}) - ${result.rows.length} rows - ${duration}ms`);

        return result.rows.map(row => ({
            name: row.name,
            value: Number(row.value),
            count: Number(row.count)
        }));
    } catch (error) {
        console.error('Category TreeMap Query Failed', error);
        throw error;
    }
}
