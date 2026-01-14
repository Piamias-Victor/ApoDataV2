
import { db } from '@/lib/db';
import { AchatsKpiRequest, LaboratoryAnalysisRow } from '@/types/kpi';
import { KpiRequestMapper } from '@/core/mappers/KpiRequestMapper';
import { BaseKpiRepository } from '@/repositories/base/BaseKpiRepository';
import { LaboratoryQueries } from '@/queries/kpi/LaboratoryQueries';

export class LaboratoryAnalysisRepository extends BaseKpiRepository {
    async execute(request: AchatsKpiRequest & { search?: string }): Promise<LaboratoryAnalysisRow[]> {
        const context = KpiRequestMapper.toContext(request);
        const myPharmacyIds = request.pharmacyIds?.length ? request.pharmacyIds : null;

        // 1. Prepare Base Params
        const { current, previous } = context.periods;
        const baseParams = [current.start, current.end, previous.start, previous.end, myPharmacyIds];

        // 2. Operators Tuning: Remove the first operator if we have a pharmacy filter (since we manually remove the filter below)
        const operators = (myPharmacyIds && request.filterOperators) ? request.filterOperators.slice(1) : request.filterOperators;

        // CRITICAL: BaseKpiRepository automatically adds pharmacyIds filters from the request.
        // We MUST prevent this for Laboratory Analysis because we need the full Group dataset.
        // We create a modified context where pharmacyIds is empty, so createBuilder doesn't add the WHERE constraint.
        const modifiedContext = {
            ...context,
            request: {
                ...context.request,
                pharmacyIds: [] // Force empty to prevent auto-filtering
            }
        };

        // 3. Build Query
        const qb = this.createBuilder(modifiedContext, baseParams, {
            laboratory: 'mv.laboratory_name',
            productCode: 'mv.ean13',
            pharmacyId: 'mv.pharmacy_id' // Explicit mapping to avoid 'ip' error
        }, operators);

        // 4. Handle Search
        const search = request.search || '';
        let searchCondition = '';
        const params = qb.getParams();

        if (search) {
            const idx = params.length + 1;
            searchCondition = `AND (mv.laboratory_name ILIKE $${idx} OR mv.product_label ILIKE $${idx})`;
            params.push(`%${search}%`);
        }

        // 5. Build SQL
        const querySql = LaboratoryQueries.getAnalysisQueryV2(qb.getConditions(), searchCondition);

        // 6. Execute & Map
        try {
            const result = await db.query(querySql, params);
            return result.rows.map(row => ({
                laboratory_name: row.laboratory_name,
                my_rank: Number(row.my_rank),
                my_sales_ttc: Number(row.my_sales_ttc),
                my_sales_qty: Number(row.my_sales_qty),

                my_purchases_ht: Number(row.my_purchases_ht),
                my_purchases_qty: Number(row.my_purchases_qty),

                my_margin_ht: Number(row.my_margin_ht), // New
                my_margin_rate: Number(row.my_margin_rate),

                my_pdm_pct: Number(row.my_pdm_pct),
                my_pdm_purchases_pct: Number(row.my_pdm_purchases_pct), // New

                my_stock_qty: Number(row.my_stock_qty), // New
                my_stock_value_ht: Number(row.my_stock_value_ht), // New
                my_days_of_stock: Number(row.my_days_of_stock), // New

                group_rank: Number(row.group_rank),
                group_avg_sales_ttc: Number(row.group_avg_sales_ttc),
                group_avg_sales_qty: Number(row.group_avg_sales_qty),
                group_avg_purchases_ht: Number(row.group_avg_purchases_ht),
                group_avg_purchases_qty: Number(row.group_avg_purchases_qty),
                group_avg_margin_rate: Number(row.group_avg_margin_rate),
                group_pdm_pct: Number(row.group_pdm_pct),
                my_sales_evolution: Number(row.my_sales_evolution),
                group_sales_evolution: Number(row.group_sales_evolution),
                my_purchases_evolution: Number(row.my_purchases_evolution),
                group_purchases_evolution: Number(row.group_purchases_evolution),
                my_sales_qty_evolution: Number(row.my_sales_qty_evolution),
                group_sales_qty_evolution: Number(row.group_sales_qty_evolution),
                my_purchases_qty_evolution: Number(row.my_purchases_qty_evolution),
                group_purchases_qty_evolution: Number(row.group_purchases_qty_evolution),
                my_margin_rate_evolution: Number(row.my_margin_rate_evolution),
                group_margin_rate_evolution: Number(row.group_margin_rate_evolution),
                my_pdm_evolution: Number(row.my_pdm_evolution),
                group_pdm_evolution: Number(row.group_pdm_evolution),
                my_pdm_purchases_evolution: Number(row.my_pdm_purchases_evolution),

                my_stock_qty_evolution: Number(row.my_stock_qty_evolution),
                my_stock_value_ht_evolution: Number(row.my_stock_value_ht_evolution),
                my_margin_ht_evolution: Number(row.my_margin_ht_evolution),
            }));
        } catch (error) {
            console.error("Failed to fetch laboratory analysis:", error);
            throw error;
        }
    }
}

const repository = new LaboratoryAnalysisRepository();

export async function getLaboratoryAnalysis(request: AchatsKpiRequest & { search?: string }) {
    return repository.execute(request);
}
