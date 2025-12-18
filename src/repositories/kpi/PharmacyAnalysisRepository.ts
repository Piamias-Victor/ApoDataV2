
import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi';
import { KpiRequestMapper } from '@/core/mappers/KpiRequestMapper';
import { BaseKpiRepository } from '@/repositories/base/BaseKpiRepository';
import { PharmacyQueries } from '@/queries/kpi/PharmacyQueries';

export interface PharmacyAnalysisRow {
    pharmacy_name: string;
    pharmacy_id: string;

    sales_ttc: number;
    sales_qty: number;
    purchases_ht: number;
    purchases_qty: number;
    margin_ht: number;
    margin_rate: number;
    pdm_sales_pct: number;
    pdm_purchases_pct: number;

    stock_qty: number;
    stock_value_ht: number;
    days_of_stock: number;

    sales_evolution: number;
    sales_qty_evolution: number;
    purchases_evolution: number;
    purchases_qty_evolution: number;
    margin_ht_evolution: number;
    margin_rate_evolution: number;
    pdm_sales_evolution: number;
    stock_value_evolution: number;
    stock_qty_evolution: number;

    rank: number;
}

export class PharmacyAnalysisRepository extends BaseKpiRepository {
    async execute(request: AchatsKpiRequest & { search?: string }): Promise<PharmacyAnalysisRow[]> {
        const context = KpiRequestMapper.toContext(request);

        // 1. Prepare Base Params
        const { current, previous } = context.periods;
        const baseParams = [current.start, current.end, previous.start, previous.end];

        // 2. Build Query
        // For Pharmacy Analysis, we WANT to respect global pharmacy filters if selected,
        // BUT usually this table is used to see ALL pharmacies.
        // If the user selects one pharmacy in the filter, `BaseKpiRepository` usually constrains the `WHERE` clause.
        // We will default to standard behavior: if they select a pharmacy, we show only that one. 
        // If they select "All", we show all.

        const qb = this.createBuilder(context, baseParams, {
            laboratory: 'mv.laboratory_name',
            productCode: 'mv.ean13',
            pharmacyId: 'mv.pharmacy_id'
        });

        // 3. Handle Search
        const search = request.search || '';
        let searchCondition = '';
        const params = qb.getParams();

        if (search) {
            const idx = params.length + 1;
            searchCondition = `AND (p.name ILIKE $${idx})`; // Search in joined data_pharmacy table
            params.push(`%${search}%`);
        }

        // 4. Build SQL
        const querySql = PharmacyQueries.getAnalysisQuery(qb.getConditions(), searchCondition);

        // 5. Execute & Map
        try {
            const result = await db.query(querySql, params);
            return result.rows.map(row => ({
                pharmacy_name: row.pharmacy_name,
                pharmacy_id: row.pharmacy_id,

                sales_ttc: Number(row.sales_ttc),
                sales_qty: Number(row.sales_qty),
                purchases_ht: Number(row.purchases_ht),
                purchases_qty: Number(row.purchases_qty),
                margin_ht: Number(row.margin_ht),
                margin_rate: Number(row.margin_rate),
                pdm_sales_pct: Number(row.pdm_sales_pct),
                pdm_purchases_pct: Number(row.pdm_purchases_pct),

                stock_qty: Number(row.stock_qty),
                stock_value_ht: Number(row.stock_value_ht),
                days_of_stock: Number(row.days_of_stock),

                sales_evolution: Number(row.sales_evolution),
                sales_qty_evolution: Number(row.sales_qty_evolution),
                purchases_evolution: Number(row.purchases_evolution),
                purchases_qty_evolution: Number(row.purchases_qty_evolution),
                margin_ht_evolution: Number(row.margin_ht_evolution),
                margin_rate_evolution: Number(row.margin_rate_evolution),
                pdm_sales_evolution: Number(row.pdm_sales_evolution),
                stock_value_evolution: Number(row.stock_value_evolution),
                stock_qty_evolution: Number(row.stock_qty_evolution),

                rank: Number(row.rank)
            }));
        } catch (error) {
            console.error("Failed to fetch pharmacy analysis:", error);
            throw error;
        }
    }
}

const repository = new PharmacyAnalysisRepository();

export async function getPharmacyAnalysis(request: AchatsKpiRequest & { search?: string }) {
    return repository.execute(request);
}
