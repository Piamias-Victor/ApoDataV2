
import { db } from '@/lib/db';
import { AchatsKpiRequest, ProductAnalysisRow } from '@/types/kpi';
import { KpiRequestMapper } from '@/core/mappers/KpiRequestMapper';
import { BaseKpiRepository } from '@/repositories/base/BaseKpiRepository';
import { ProductQueries } from '@/queries/kpi/ProductQueries';

export class ProductAnalysisRepository extends BaseKpiRepository {

    async execute(request: AchatsKpiRequest, page = 1, pageSize = 20, search = ''): Promise<{ data: ProductAnalysisRow[], total: number }> {
        const context = KpiRequestMapper.toContext(request, page, pageSize);
        const myPharmacyId = request.pharmacyIds?.[0] || null;

        // 1. Prepare Base Params
        const { current, previous } = context.periods;
        const baseParams = [current.start, current.end, previous.start, previous.end, myPharmacyId];

        // 2. Operators Tuning (Manual pharmacy handling in SQL)
        const operators = (myPharmacyId) ? (request.filterOperators || []).slice(1) : request.filterOperators;

        // 3. Build Query
        const qb = this.createBuilder(context, baseParams, {
            pharmacyId: 'mv.pharmacy_id',
            laboratory: 'mv.laboratory_name',
            productCode: 'mv.ean13'
        }, operators);

        // 4. Handle Search (Specific to this repo)
        let searchCondition = '';
        const params = qb.getParams();

        if (search) {
            const idx = params.length + 1;
            searchCondition = `AND (mv.product_label ILIKE $${idx} OR mv.ean13 ILIKE $${idx} OR mv.laboratory_name ILIKE $${idx})`;
            params.push(`%${search}%`);
        }

        // 5. Finalize SQL Parts
        const isFiltered = search || qb.getConditions().length > 0;
        const limitClause = isFiltered ? '' : 'LIMIT 1000';

        const limitIdx = params.length + 1;
        const offsetIdx = params.length + 2;
        params.push(pageSize, context.pagination!.offset);

        // 6. Select Strategy & SQL
        const querySql = (!myPharmacyId)
            ? ProductQueries.getGlobalQuery(qb.getConditions(), searchCondition, limitClause, limitIdx, offsetIdx)
            : ProductQueries.getComparativeQuery(qb.getConditions(), searchCondition, limitClause, limitIdx, offsetIdx);

        // 7. Execute
        const result = await db.query(querySql, params);
        const total = result.rows.length > 0 ? Number(result.rows[0].total_rows) : 0;

        return { data: result.rows, total };
    }
}

export const productAnalysisRepository = new ProductAnalysisRepository();

export async function getProductAnalysis(request: AchatsKpiRequest, page = 1, pageSize = 20, search = '') {
    return productAnalysisRepository.execute(request, page, pageSize, search);
}
