import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi';
import { KpiRequestMapper } from '@/core/mappers/KpiRequestMapper';
import { BaseKpiRepository } from '@/repositories/base/BaseKpiRepository';
import { MargeQueries } from '@/queries/kpi/MargeQueries';

class MargeRepository extends BaseKpiRepository {
    async execute(request: AchatsKpiRequest): Promise<{ montant_marge: number; montant_ht: number }> {
        // 1. Prepare Context & Params
        const context = KpiRequestMapper.toContext(request);
        const baseParams = [context.periods.current.start, context.periods.current.end];

        // 2. Build Query Builder
        const qb = this.createBuilder(context, baseParams, {
            pharmacyId: 'mv.pharmacy_id',
            laboratory: 'mv.laboratory_name',
            productCode: 'mv.code_13_ref',
            tva: 'mv.tva_rate',
            reimbursable: 'mv.is_reimbursable',
            genericStatus: 'mv.bcb_generic_status',
            cat_l1: 'mv.category_name',
        });

        // 3. Add Specific Range Filters
        qb.addRangeFilter(request.purchasePriceNetRange, 'lp.weighted_average_price');
        qb.addRangeFilter(request.purchasePriceGrossRange, 'gp.prix_achat_ht_fabricant');
        qb.addRangeFilter(request.sellPriceRange, 'lp.price_with_tax');
        qb.addRangeFilter(request.discountRange, 'lp.discount_percentage');
        qb.addRangeFilter(request.marginRange, 'lp.margin_percentage');

        // 4. Determine Dynamic Joins
        const needsLatestPriceJoin = !!(request.purchasePriceNetRange || request.sellPriceRange ||
            request.discountRange || request.marginRange);

        const needsGlobalProductJoin = !!(request.purchasePriceGrossRange ||
            (request.groups && request.groups.length > 0) ||
            request.categories?.some(c => c.type !== 'bcb_segment_l1'));

        // 5. Assemble SQL
        const query = `
            ${MargeQueries.SELECT}
            ${MargeQueries.FROM}
            ${needsLatestPriceJoin ? MargeQueries.JOINS.LATEST_PRICES : ''}
            ${needsGlobalProductJoin ? MargeQueries.JOINS.GLOBAL_PRODUCT : ''}
            ${MargeQueries.WHERE_DATE}
            ${qb.getConditions()}
        `;

        // 6. Execute
        const startTime = Date.now();
        console.log('🔍 [Repository] Executing ULTRA-FAST Marge query (MV)');

        try {
            const result = await db.query(query, qb.getParams());
            const duration = Date.now() - startTime;
            const row = result.rows[0];

            const data = {
                montant_marge: Number(row?.montant_marge) || 0,
                montant_ht: Number(row?.montant_ht) || 0
            };

            console.log(`✅ [Repository] Marge Query completed: { montant_marge: ${data.montant_marge}, montant_ht: ${data.montant_ht}, duration: '${duration}ms' }`);
            return data;
        } catch (error) {
            console.error('❌ [Repository] Marge query failed:', error);
            throw error;
        }
    }
}

const repository = new MargeRepository();

export async function fetchMargeData(request: AchatsKpiRequest) {
    return repository.execute(request);
}
