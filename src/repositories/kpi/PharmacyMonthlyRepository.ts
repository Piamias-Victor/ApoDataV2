import { db } from '@/lib/db';
import { PharmacyQueries } from '@/queries/kpi/PharmacyQueries';
import { BaseKpiRepository } from '@/repositories/base/BaseKpiRepository';
import { AchatsKpiRequest } from '@/types/kpi';
import { KpiRequestMapper } from '@/core/mappers/KpiRequestMapper';

export interface PharmacyMonthlyStat {
    pharmacy_id: string;
    pharmacy_name: string;
    month_num: number;
    year_num: number;
    sales_ht: number;
    sales_ttc: number;
    sales_qty: number;
    purchases_ht: number;
    purchases_qty: number;
    margin_ht: number;
}

export class PharmacyMonthlyRepository extends BaseKpiRepository {
    async execute(request: AchatsKpiRequest): Promise<PharmacyMonthlyStat[]> {
        const context = KpiRequestMapper.toContext(request);
        
        const currentYear = new Date(context.periods.current.end).getFullYear();
        const previousYear = currentYear - 1;

        console.log('PharmacyMonthlyRepository Params:', { 
            currentStart: context.periods.current.start,
            currentEnd: context.periods.current.end,
            currentYear, 
            previousYear 
        });

        const baseParams = [
            context.periods.current.start,
            context.periods.current.end,
            context.periods.previous.start,
            context.periods.previous.end
        ];

        const qb = this.createBuilder(context, baseParams, {
            laboratory: 'mv.laboratory_name',
            productCode: 'mv.ean13',
            pharmacyId: 'mv.pharmacy_id',
            // OPTIMIZATION: Use MV column for main category filter if available to avoid join dependency
            // Assuming 'category_name' in MV corresponds to L1. Correct me if L0/L2.
            // If this fails (column not exists), we will revert to gp.
            // cat_l1: 'mv.category_name', 
            
            // Reverting to GP for safety but verifying alias match
            cat_l1: 'gp.bcb_segment_l1',
            cat_family: 'gp.bcb_family'
        });

        // Add filter conditions (Standard)
        const conditions = qb.getConditions();
        const params = qb.getParams();

        console.log('PharmacyMonthlyRepository Conditions:', conditions);

        const querySql = PharmacyQueries.getMonthlyStats(conditions);

        try {
            const result = await db.query(querySql, params);
            console.log('PharmacyMonthlyRepository Result Count:', result.rows.length);
            return result.rows.map(row => ({
                pharmacy_id: row.pharmacy_id,
                pharmacy_name: row.pharmacy_name,
                month_num: Number(row.month_num),
                year_num: Number(row.year_num),
                sales_ht: Number(row.sales_ht),
                sales_ttc: Number(row.sales_ttc),
                sales_qty: Number(row.sales_qty),
                purchases_ht: Number(row.purchases_ht),
                purchases_qty: Number(row.purchases_qty),
                margin_ht: Number(row.margin_ht),
            }));
        } catch (error) {
            console.error("Failed to fetch pharmacy monthly stats:", error);
            console.error("Query was:", querySql);
            console.error("Params were:", params);
            throw error;
        }
    }
}
