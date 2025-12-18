import { AchatsKpiRequest } from '@/types/kpi';
import { db } from '@/lib/db';
import { FilterQueryBuilder } from '@/repositories/utils/FilterQueryBuilder';

export interface NetworkHealthKpi {
    dn_percent: number;
    active_count: number;
    total_count: number;
    active_pharmacies: { id: string; name: string }[];
    missing_pharmacy_names: string[];

    concentration_percent: number;
    pareto_pharmacies: { id: string; name: string }[];
}

export const getNetworkHealthKpi = async (request: AchatsKpiRequest): Promise<NetworkHealthKpi> => {
    const { dateRange, pharmacyIds = [], laboratories = [], categories = [], productCodes = [], filterOperators = [] } = request;

    // 1. Get Total Pharmacies (in scope)
    // If pharmacyIds are provided, scope is limited to those.
    // If NOT provided, scope is ALL pharmacies in network.
    let totalCount = 0;
    let totalPharmacies: { id: string; name: string }[] = [];

    if (pharmacyIds.length > 0) {
        const query = `SELECT id, name FROM data_pharmacy WHERE id = ANY($1::uuid[])`;
        const res = await db.query(query, [pharmacyIds]);
        totalPharmacies = res.rows;
        totalCount = res.rowCount || 0;
    } else {
        const query = `SELECT id, name FROM data_pharmacy`;
        const res = await db.query(query);
        totalPharmacies = res.rows;
        totalCount = res.rowCount || 0;
    }

    if (totalCount === 0) {
        return {
            dn_percent: 0, active_count: 0, total_count: 0, active_pharmacies: [], missing_pharmacy_names: [],
            concentration_percent: 0, pareto_pharmacies: []
        };
    }

    // 2. Get Active Pharmacies (Sales > 0)
    const initialParams = [dateRange.start, dateRange.end];
    // Map MV columns (mv_sales_enriched)
    const qb = new FilterQueryBuilder(initialParams, 3, filterOperators, {
        pharmacyId: 'mv.pharmacy_id',
        laboratory: 'mv.laboratory_name',
        productCode: 'mv.code_13_ref',
        tva: 'mv.tva_rate',
        reimbursable: 'mv.is_reimbursable',
        genericStatus: 'mv.bcb_generic_status',
        cat_l1: 'mv.category_name', // Simplified mapping as per Ventes Repo
    });

    qb.addPharmacies(pharmacyIds);
    qb.addLaboratories(laboratories);
    qb.addCategories(categories);
    qb.addProducts(productCodes);
    if (request.excludedPharmacyIds) qb.addExcludedPharmacies(request.excludedPharmacyIds);
    // ... exclusions ...

    const conditions = qb.getConditions();
    const params = qb.getParams();

    // mv_sales_enriched usually contains enough info for basic filters.
    // However, if complex category filters (l2, l3...) are used, we might need GlobalProduct join.
    const needsGlobalProductJoin = categories.some(c => c.type !== 'bcb_segment_l1') ||
        (request.excludedCategories && request.excludedCategories.some(c => c.type !== 'bcb_segment_l1'));

    // Query:
    const activeQuery = `
        SELECT
            mv.pharmacy_id,
            SUM(mv.montant_ht * (1 + COALESCE(mv.tva_rate, 0) / 100.0)) as total_sales
        FROM mv_sales_enriched mv
        ${needsGlobalProductJoin ? 'LEFT JOIN data_globalproduct gp ON mv.code_13_ref = gp.code_13_ref' : ''}
        WHERE mv.sale_date >= $1::date
          AND mv.sale_date <= $2::date
          ${conditions}
        GROUP BY mv.pharmacy_id
        HAVING SUM(mv.montant_ht) > 0
        ORDER BY total_sales DESC
    `;

    const activeRes = await db.query(activeQuery, params);
    const activeStats = activeRes.rows;

    const pharmacyMap = new Map(totalPharmacies.map((p: { id: string; name: string }) => [p.id, p.name]));

    const activePharmacyIds = activeStats.map((s: { pharmacy_id: string }) => s.pharmacy_id);
    const activeCount = activePharmacyIds.length;
    const dnPercent = totalCount > 0 ? (activeCount / totalCount) * 100 : 0;

    const activePharmacies = activeStats.map((s: { pharmacy_id: string }) => ({
        id: s.pharmacy_id,
        name: pharmacyMap.get(s.pharmacy_id) || 'Inconnu'
    }));

    // Missing
    const missingPharmacies = totalPharmacies.filter((p: { id: string }) => !activePharmacyIds.includes(p.id));
    const missingPharmacyNames = missingPharmacies.slice(0, 50).map((p: { name: string }) => p.name).sort();

    // Pareto
    // activeStats already has total_sales (TTC inferred calc or HT, actually variable name is total_sales).
    // The query calculates TTC: SUM(mv.montant_ht * (1 + COALESCE(mv.tva_rate, 0) / 100.0))
    const totalSales = activeStats.reduce((acc: number, curr: { total_sales: string }) => acc + Number(curr.total_sales), 0);
    const top20Count = Math.max(1, Math.ceil(totalCount * 0.20));

    // activeStats is already sorted DESC by SQL
    const top20Pharmas = activeStats.slice(0, top20Count);
    const top20Sales = top20Pharmas.reduce((acc: number, curr: { total_sales: string }) => acc + Number(curr.total_sales), 0);

    const concentrationPercent = totalSales > 0 ? (top20Sales / totalSales) * 100 : 0;

    const paretoPharmacies = top20Pharmas.map((p: { pharmacy_id: string }) => ({
        id: p.pharmacy_id,
        name: pharmacyMap.get(p.pharmacy_id) || 'Inconnu'
    }));

    return {
        dn_percent: dnPercent,
        active_count: activeCount,
        total_count: totalCount,
        active_pharmacies: activePharmacies,
        missing_pharmacy_names: missingPharmacyNames,
        concentration_percent: concentrationPercent,
        pareto_pharmacies: paretoPharmacies
    };
};
