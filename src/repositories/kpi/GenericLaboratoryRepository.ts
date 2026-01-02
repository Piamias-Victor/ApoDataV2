
import { db } from '@/lib/db';
import { AchatsKpiRequest, GenericLaboratoryRow } from '@/types/kpi';
import { KpiRequestMapper } from '@/core/mappers/KpiRequestMapper';
import { BaseKpiRepository } from '@/repositories/base/BaseKpiRepository';

export class GenericLaboratoryRepository extends BaseKpiRepository {
    async execute(request: AchatsKpiRequest): Promise<GenericLaboratoryRow[]> {
        const context = KpiRequestMapper.toContext(request);
        const myPharmacyIds = request.pharmacyIds || [];
        const { current, previous } = context.periods;
        const baseParams = [current.start, current.end, previous.start, previous.end];

        // Global Context for Group Data (No Pharmacy Filter)
        const globalContext = {
            ...context,
            request: { ...context.request, pharmacyIds: [] } // Corrected context modification
        };

        const qb = this.createBuilder(globalContext, baseParams, {
            laboratory: 'mv.laboratory_name',
            productCode: 'mv.ean13',
            pharmacyId: 'mv.pharmacy_id',
            group: 'gp.bcb_generic_group'
        });

        // Apply store filters
        qb.addReimbursementStatus(request.reimbursementStatus);
        qb.addGenericStatus(request.isGeneric);

        const search = (request as any).search || '';
        let searchCondition = '';
        const params = qb.getParams();

        // Add myPharmacyIds to params for Conditional Aggregation
        const pharmacyParamIdx = params.length + 1;
        params.push(myPharmacyIds);

        if (search) {
            const idx = params.length + 1;
            searchCondition = `AND (mv.laboratory_name ILIKE $${idx})`;
            params.push(`%${search}%`);
        }

        const conditions = qb.getConditions();

        // Handle Pharmacy Filter for "My Stats"
        // Use cardinality check for empty arrays to avoid type errors
        const myFilter = `(cardinality($${pharmacyParamIdx}::uuid[]) = 0 OR mv.pharmacy_id = ANY($${pharmacyParamIdx}::uuid[]))`;

        const sql = `
        WITH 
        pharmacy_counts AS (
            SELECT 
                CASE 
                    WHEN month >= $1::date AND month <= $2::date THEN 'CURRENT'
                    ELSE 'PREVIOUS'
                END as period,
                COUNT(DISTINCT pharmacy_id) as count
            FROM mv_product_stats_monthly mv
            LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
            WHERE ((month >= $1::date AND month <= $2::date) OR (month >= $3::date AND month <= $4::date))
            AND mv.ean13 != 'NO-EAN'
            ${conditions}
            GROUP BY 1
        ),
        
        last_stock AS (
            SELECT 
                mv.laboratory_name,
                SUM(mv.stock) as stock_qty,
                SUM(mv.stock_value_ht) as stock_value_ht
            FROM (
                SELECT DISTINCT ON (product_id) 
                    laboratory_name,
                    stock,
                    stock_value_ht,
                    code_13_ref as ean13
                FROM mv_stock_monthly
                WHERE month_end_date <= $2::date 
                AND (cardinality($${pharmacyParamIdx}::uuid[]) = 0 OR pharmacy_id = ANY($${pharmacyParamIdx}::uuid[]))
                ORDER BY product_id, month_end_date DESC
            ) mv
            LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
            WHERE 1=1 ${conditions.replace(/mv\./g, 'mv.')} 
            GROUP BY 1
        ),

        lab_stats AS (
            SELECT 
                mv.laboratory_name,
                
                -- CURRENT PERIOD
                
                -- My Product Count
                COUNT(DISTINCT CASE WHEN ${myFilter} AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.ean13 END) as my_product_count,
                 -- Previous
                COUNT(DISTINCT CASE WHEN ${myFilter} AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.ean13 END) as my_product_count_prev,

                -- My Metrics
                SUM(CASE WHEN ${myFilter} AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.qty_purchased ELSE 0 END) as my_purchases_qty,
                SUM(CASE WHEN ${myFilter} AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.ht_purchased ELSE 0 END) as my_purchases_ht,
                SUM(CASE WHEN ${myFilter} AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.qty_sold ELSE 0 END) as my_sales_qty,
                SUM(CASE WHEN ${myFilter} AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.ttc_sold ELSE 0 END) as my_sales_ttc,
                SUM(CASE WHEN ${myFilter} AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.ht_sold ELSE 0 END) as my_sales_ht,
                SUM(CASE WHEN ${myFilter} AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.margin_sold ELSE 0 END) as my_margin_ht,

                -- Group Metrics (Total)
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.ht_purchased ELSE 0 END) as group_total_purchases_ht,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.qty_purchased ELSE 0 END) as group_total_purchases_qty,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.ttc_sold ELSE 0 END) as group_total_sales_ttc,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.qty_sold ELSE 0 END) as group_total_sales_qty,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.margin_sold ELSE 0 END) as group_total_margin_ht,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.ht_sold ELSE 0 END) as group_total_sales_ht,

                -- PREVIOUS PERIODS
                
                -- My Metrics Prev
                SUM(CASE WHEN ${myFilter} AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.qty_purchased ELSE 0 END) as my_purchases_qty_prev,
                SUM(CASE WHEN ${myFilter} AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.ht_purchased ELSE 0 END) as my_purchases_ht_prev,
                SUM(CASE WHEN ${myFilter} AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.qty_sold ELSE 0 END) as my_sales_qty_prev,
                SUM(CASE WHEN ${myFilter} AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.ttc_sold ELSE 0 END) as my_sales_ttc_prev,
                SUM(CASE WHEN ${myFilter} AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.ht_sold ELSE 0 END) as my_sales_ht_prev,
                SUM(CASE WHEN ${myFilter} AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.margin_sold ELSE 0 END) as my_margin_ht_prev,

                -- Group Metrics Prev
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.ht_purchased ELSE 0 END) as group_total_purchases_ht_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.qty_purchased ELSE 0 END) as group_total_purchases_qty_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.ttc_sold ELSE 0 END) as group_total_sales_ttc_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.qty_sold ELSE 0 END) as group_total_sales_qty_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.margin_sold ELSE 0 END) as group_total_margin_ht_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.ht_sold ELSE 0 END) as group_total_sales_ht_prev

            FROM mv_product_stats_monthly mv
            LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
            WHERE (
                (mv.month >= $1::date AND mv.month <= $2::date) 
                OR (mv.month >= $3::date AND mv.month <= $4::date)
            )
            AND mv.ean13 != 'NO-EAN'
            ${conditions}
            ${searchCondition}
            GROUP BY 1
        ),

        global_totals AS (
            SELECT
                SUM(my_sales_ttc) as my_total_sales_market,
                SUM(my_purchases_ht) as my_total_purchases_market,
                SUM(group_total_sales_ttc) as group_total_sales_market,
                
                SUM(my_sales_ttc_prev) as my_total_sales_market_prev,
                SUM(my_purchases_ht_prev) as my_total_purchases_market_prev,
                SUM(group_total_sales_ttc_prev) as group_total_sales_market_prev
            FROM lab_stats
        )

        SELECT
            ls.laboratory_name,
            
            -- Product Count
            ls.my_product_count as product_count,
            ls.my_product_count_prev, 
            
            -- My Metrics
            ls.my_sales_ttc,
            ls.my_sales_qty,
            ls.my_purchases_ht,
            ls.my_purchases_qty,
            ls.my_margin_ht,

            -- Stock
            COALESCE(lst.stock_qty, 0) as my_stock_qty,
            COALESCE(lst.stock_value_ht, 0) as my_stock_value_ht,
            
            -- Days of Stock 
            CASE 
                WHEN (ls.my_sales_ht - ls.my_margin_ht) > 0 THEN 
                    (COALESCE(lst.stock_value_ht, 0) / ((ls.my_sales_ht - ls.my_margin_ht) / GREATEST(1, ($2::date - $1::date)))) 
                ELSE 0 
            END as my_days_of_stock,

            CASE WHEN ls.my_sales_ht = 0 THEN 0 ELSE (ls.my_margin_ht / ls.my_sales_ht) * 100 END as my_margin_rate,
            
            -- PDM
            (ls.my_sales_ttc / NULLIF(gt.my_total_sales_market, 0)) * 100 as my_pdm_pct,
            (ls.my_purchases_ht / NULLIF(gt.my_total_purchases_market, 0)) * 100 as my_pdm_purchases_pct,
            
            RANK() OVER(ORDER BY ls.my_sales_qty DESC) as my_rank,

            -- Group Averages
            ls.group_total_sales_ttc / NULLIF(pc_current.count, 0) as group_avg_sales_ttc,
            ls.group_total_sales_qty / NULLIF(pc_current.count, 0) as group_avg_sales_qty,
            ls.group_total_purchases_ht / NULLIF(pc_current.count, 0) as group_avg_purchases_ht,
            ls.group_total_purchases_qty / NULLIF(pc_current.count, 0) as group_avg_purchases_qty,
            
            CASE WHEN ls.group_total_sales_ht = 0 THEN 0 ELSE (ls.group_total_margin_ht / ls.group_total_sales_ht) * 100 END as group_avg_margin_rate,
            
            (ls.group_total_sales_ttc / NULLIF(gt.group_total_sales_market, 0)) * 100 as group_pdm_pct,

            RANK() OVER(ORDER BY ls.group_total_sales_ttc DESC) as group_rank,

            -- Evolutions
            CASE WHEN ls.my_sales_ttc_prev = 0 THEN 0 ELSE ((ls.my_sales_ttc - ls.my_sales_ttc_prev) / ls.my_sales_ttc_prev) * 100 END as my_sales_evolution,
            CASE WHEN ls.group_total_sales_ttc_prev = 0 THEN 0 ELSE ((ls.group_total_sales_ttc - ls.group_total_sales_ttc_prev) / ls.group_total_sales_ttc_prev) * 100 END as group_sales_evolution,

            CASE WHEN ls.my_purchases_ht_prev = 0 THEN 0 ELSE ((ls.my_purchases_ht - ls.my_purchases_ht_prev) / ls.my_purchases_ht_prev) * 100 END as my_purchases_evolution,
            CASE WHEN ls.group_total_purchases_ht_prev = 0 THEN 0 ELSE ((ls.group_total_purchases_ht - ls.group_total_purchases_ht_prev) / ls.group_total_purchases_ht_prev) * 100 END as group_purchases_evolution,

            CASE WHEN ls.my_sales_qty_prev = 0 THEN 0 ELSE ((ls.my_sales_qty - ls.my_sales_qty_prev) / ls.my_sales_qty_prev) * 100 END as my_sales_qty_evolution,
            CASE WHEN ls.group_total_sales_qty_prev = 0 THEN 0 ELSE ((ls.group_total_sales_qty - ls.group_total_sales_qty_prev) / ls.group_total_sales_qty_prev) * 100 END as group_sales_qty_evolution,

            CASE WHEN ls.my_purchases_qty_prev = 0 THEN 0 ELSE ((ls.my_purchases_qty - ls.my_purchases_qty_prev) / ls.my_purchases_qty_prev) * 100 END as my_purchases_qty_evolution,
            CASE WHEN ls.group_total_purchases_qty_prev = 0 THEN 0 ELSE ((ls.group_total_purchases_qty - ls.group_total_purchases_qty_prev) / ls.group_total_purchases_qty_prev) * 100 END as group_purchases_qty_evolution,
            
            CASE WHEN ls.my_product_count_prev = 0 THEN 0 ELSE ((ls.my_product_count - ls.my_product_count_prev)::numeric / ls.my_product_count_prev) * 100 END as product_count_evolution,

            -- Margin Evo (Points)
            (
                (CASE WHEN ls.my_sales_ht = 0 THEN 0 ELSE (ls.my_margin_ht / ls.my_sales_ht) * 100 END) - 
                (CASE WHEN ls.my_sales_ht_prev = 0 THEN 0 ELSE (ls.my_margin_ht_prev / ls.my_sales_ht_prev) * 100 END)
            ) as my_margin_rate_evolution,
             (
                (CASE WHEN ls.group_total_sales_ht = 0 THEN 0 ELSE (ls.group_total_margin_ht / ls.group_total_sales_ht) * 100 END) - 
                (CASE WHEN ls.group_total_sales_ht_prev = 0 THEN 0 ELSE (ls.group_total_margin_ht_prev / ls.group_total_sales_ht_prev) * 100 END)
            ) as group_margin_rate_evolution,

            -- PDM Evo (Points)
            ((ls.my_sales_ttc / NULLIF(gt.my_total_sales_market, 0)) * 100) - ((ls.my_sales_ttc_prev / NULLIF(gt.my_total_sales_market_prev, 0)) * 100) as my_pdm_evolution,
            ((ls.group_total_sales_ttc / NULLIF(gt.group_total_sales_market, 0)) * 100) - ((ls.group_total_sales_ttc_prev / NULLIF(gt.group_total_sales_market_prev, 0)) * 100) as group_pdm_evolution,
            
            ((ls.my_purchases_ht / NULLIF(gt.my_total_purchases_market, 0)) * 100) - ((ls.my_purchases_ht_prev / NULLIF(gt.my_total_purchases_market_prev, 0)) * 100) as my_pdm_purchases_evolution

        FROM lab_stats ls
        LEFT JOIN last_stock lst ON lst.laboratory_name = ls.laboratory_name
        CROSS JOIN global_totals gt
        LEFT JOIN pharmacy_counts pc_current ON pc_current.period = 'CURRENT'
        ORDER BY ls.my_sales_ttc DESC
        `;

        try {
            const result = await db.query(sql, params);
            return result.rows.map(row => ({
                laboratory_name: row.laboratory_name,

                my_rank: Number(row.my_rank),
                product_count: Number(row.product_count),
                my_sales_ttc: Number(row.my_sales_ttc),
                my_sales_qty: Number(row.my_sales_qty),
                my_purchases_ht: Number(row.my_purchases_ht),
                my_purchases_qty: Number(row.my_purchases_qty),
                my_margin_ht: Number(row.my_margin_ht),
                my_margin_rate: Number(row.my_margin_rate),
                my_pdm_pct: Number(row.my_pdm_pct),
                my_pdm_purchases_pct: Number(row.my_pdm_purchases_pct),

                my_stock_qty: Number(row.my_stock_qty),
                my_stock_value_ht: Number(row.my_stock_value_ht),
                my_days_of_stock: Number(row.my_days_of_stock),

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

                product_count_evolution: Number(row.product_count_evolution),

                my_stock_qty_evolution: 0,
                my_stock_value_ht_evolution: 0,
                my_margin_ht_evolution: 0,
            }));
        } catch (error) {
            console.error("Failed to fetch generic laboratory analysis:", error);
            throw error;
        }
    }
}
