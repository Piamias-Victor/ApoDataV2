import { db } from '@/lib/db';
import { AchatsKpiRequest, LaboratoryAnalysisRow } from '@/types/kpi';

export async function getLaboratoryAnalysis(request: AchatsKpiRequest): Promise<LaboratoryAnalysisRow[]> {
    const {
        dateRange,
        pharmacyIds = [],
    } = request;

    const myPharmacyId = pharmacyIds[0];
    if (!myPharmacyId) {
        throw new Error("Pharmacy ID is required for Laboratory Analysis");
    }

    const { start, end } = dateRange;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const duration = endDate.getTime() - startDate.getTime();
    const prevStart = new Date(startDate.getTime() - duration);
    const prevEnd = new Date(startDate.getTime() - 86400000);

    const query = `
        WITH 
        pharmacy_counts AS (
            SELECT 
                CASE 
                    WHEN day >= $1::date AND day <= $2::date THEN 'CURRENT'
                    ELSE 'PREVIOUS'
                END as period,
                COUNT(DISTINCT pharmacy_id) as count
            FROM mv_lab_stats_daily
            WHERE (day >= $1::date AND day <= $2::date) 
               OR (day >= $3::date AND day <= $4::date)
            GROUP BY 1
        ),
        
        lab_stats AS (
            SELECT 
                laboratory_name,
                
                -- My Metrics (Current)
                SUM(CASE WHEN pharmacy_id = $5::uuid AND day >= $1::date AND day <= $2::date THEN ttc_sold ELSE 0 END) as my_sales_ttc,
                SUM(CASE WHEN pharmacy_id = $5::uuid AND day >= $1::date AND day <= $2::date THEN qty_sold ELSE 0 END) as my_sales_qty,
                SUM(CASE WHEN pharmacy_id = $5::uuid AND day >= $1::date AND day <= $2::date THEN margin_sold ELSE 0 END) as my_margin_ht,
                SUM(CASE WHEN pharmacy_id = $5::uuid AND day >= $1::date AND day <= $2::date THEN ht_sold ELSE 0 END) as my_sales_ht,
                SUM(CASE WHEN pharmacy_id = $5::uuid AND day >= $1::date AND day <= $2::date THEN ht_purchased ELSE 0 END) as my_purchases_ht,
                SUM(CASE WHEN pharmacy_id = $5::uuid AND day >= $1::date AND day <= $2::date THEN qty_purchased ELSE 0 END) as my_purchases_qty,
                
                -- My Metrics (Previous)
                SUM(CASE WHEN pharmacy_id = $5::uuid AND day >= $3::date AND day <= $4::date THEN ttc_sold ELSE 0 END) as my_sales_ttc_prev,
                SUM(CASE WHEN pharmacy_id = $5::uuid AND day >= $3::date AND day <= $4::date THEN qty_sold ELSE 0 END) as my_sales_qty_prev,
                SUM(CASE WHEN pharmacy_id = $5::uuid AND day >= $3::date AND day <= $4::date THEN margin_sold ELSE 0 END) as my_margin_ht_prev,
                SUM(CASE WHEN pharmacy_id = $5::uuid AND day >= $3::date AND day <= $4::date THEN ht_sold ELSE 0 END) as my_sales_ht_prev,
                SUM(CASE WHEN pharmacy_id = $5::uuid AND day >= $3::date AND day <= $4::date THEN ht_purchased ELSE 0 END) as my_purchases_ht_prev,
                SUM(CASE WHEN pharmacy_id = $5::uuid AND day >= $3::date AND day <= $4::date THEN qty_purchased ELSE 0 END) as my_purchases_qty_prev,
                
                -- Group Metrics (Current)
                SUM(CASE WHEN day >= $1::date AND day <= $2::date THEN ttc_sold ELSE 0 END) as group_total_sales_ttc,
                SUM(CASE WHEN day >= $1::date AND day <= $2::date THEN qty_sold ELSE 0 END) as group_total_sales_qty,
                SUM(CASE WHEN day >= $1::date AND day <= $2::date THEN margin_sold ELSE 0 END) as group_total_margin_ht,
                SUM(CASE WHEN day >= $1::date AND day <= $2::date THEN ht_sold ELSE 0 END) as group_total_sales_ht,
                SUM(CASE WHEN day >= $1::date AND day <= $2::date THEN ht_purchased ELSE 0 END) as group_total_purchases_ht,
                SUM(CASE WHEN day >= $1::date AND day <= $2::date THEN qty_purchased ELSE 0 END) as group_total_purchases_qty,
                
                -- Group Metrics (Previous)
                SUM(CASE WHEN day >= $3::date AND day <= $4::date THEN ttc_sold ELSE 0 END) as group_total_sales_ttc_prev,
                SUM(CASE WHEN day >= $3::date AND day <= $4::date THEN qty_sold ELSE 0 END) as group_total_sales_qty_prev,
                SUM(CASE WHEN day >= $3::date AND day <= $4::date THEN margin_sold ELSE 0 END) as group_total_margin_ht_prev,
                SUM(CASE WHEN day >= $3::date AND day <= $4::date THEN ht_sold ELSE 0 END) as group_total_sales_ht_prev,
                SUM(CASE WHEN day >= $3::date AND day <= $4::date THEN ht_purchased ELSE 0 END) as group_total_purchases_ht_prev,
                SUM(CASE WHEN day >= $3::date AND day <= $4::date THEN qty_purchased ELSE 0 END) as group_total_purchases_qty_prev
                
            FROM mv_lab_stats_daily
            WHERE (
                (day >= $1::date AND day <= $2::date) 
               OR (day >= $3::date AND day <= $4::date)
            )
            AND laboratory_name NOT IN ('Non défini', 'Inconnu')
            GROUP BY 1
        ),
        
        global_totals AS (
            SELECT
                SUM(my_sales_ttc) as my_total_market,
                SUM(group_total_sales_ttc) as group_total_market,
                SUM(my_sales_ttc_prev) as my_total_market_prev,
                SUM(group_total_sales_ttc_prev) as group_total_market_prev
            FROM lab_stats
        )

        SELECT 
            ls.laboratory_name,
            
            -- Metrics
            ls.my_sales_ttc,
            ls.my_sales_qty,
            ls.my_purchases_ht,
            ls.my_purchases_qty,
            
            -- Calculated Rates (Current)
            CASE WHEN ls.my_sales_ht = 0 THEN 0 ELSE (ls.my_margin_ht / ls.my_sales_ht) * 100 END as my_margin_rate,
            CASE WHEN gt.my_total_market = 0 THEN 0 ELSE (ls.my_sales_ttc / gt.my_total_market) * 100 END as my_pdm_pct,
            
            -- Rank
            RANK() OVER (ORDER BY ls.my_sales_ttc DESC) as my_rank,
            
            -- Group Averages
            ls.group_total_sales_ttc / NULLIF(pc_current.count, 0) as group_avg_sales_ttc,
            ls.group_total_sales_qty / NULLIF(pc_current.count, 0) as group_avg_sales_qty,
            ls.group_total_purchases_ht / NULLIF(pc_current.count, 0) as group_avg_purchases_ht,
            ls.group_total_purchases_qty / NULLIF(pc_current.count, 0) as group_avg_purchases_qty,
            
            -- Group Margin Rate
            CASE WHEN ls.group_total_sales_ht = 0 THEN 0 ELSE (ls.group_total_margin_ht / ls.group_total_sales_ht) * 100 END as group_avg_margin_rate,
            
            -- Group PDM
            CASE WHEN gt.group_total_market = 0 THEN 0 ELSE (ls.group_total_sales_ttc / gt.group_total_market) * 100 END as group_pdm_pct,
            
            -- Group Rank
            RANK() OVER (ORDER BY ls.group_total_sales_ttc DESC) as group_rank,
            
            -- Evolutions (Simple Values)
            CASE WHEN ls.my_sales_ttc_prev = 0 THEN 0 ELSE ((ls.my_sales_ttc - ls.my_sales_ttc_prev) / ls.my_sales_ttc_prev) * 100 END as my_sales_evolution,
            CASE WHEN ls.group_total_sales_ttc_prev = 0 THEN 0 ELSE ((ls.group_total_sales_ttc - ls.group_total_sales_ttc_prev) / ls.group_total_sales_ttc_prev) * 100 END as group_sales_evolution,
            CASE WHEN ls.my_purchases_ht_prev = 0 THEN 0 ELSE ((ls.my_purchases_ht - ls.my_purchases_ht_prev) / ls.my_purchases_ht_prev) * 100 END as my_purchases_evolution,
            CASE WHEN ls.group_total_purchases_ht_prev = 0 THEN 0 ELSE ((ls.group_total_purchases_ht - ls.group_total_purchases_ht_prev) / ls.group_total_purchases_ht_prev) * 100 END as group_purchases_evolution,

            -- Evolutions (Detailed)
            -- QTY
            CASE WHEN ls.my_sales_qty_prev = 0 THEN 0 ELSE ((ls.my_sales_qty - ls.my_sales_qty_prev) / ls.my_sales_qty_prev) * 100 END as my_sales_qty_evolution,
            CASE WHEN ls.group_total_sales_qty_prev = 0 THEN 0 ELSE ((ls.group_total_sales_qty - ls.group_total_sales_qty_prev) / ls.group_total_sales_qty_prev) * 100 END as group_sales_qty_evolution,
            CASE WHEN ls.my_purchases_qty_prev = 0 THEN 0 ELSE ((ls.my_purchases_qty - ls.my_purchases_qty_prev) / ls.my_purchases_qty_prev) * 100 END as my_purchases_qty_evolution,
            CASE WHEN ls.group_total_purchases_qty_prev = 0 THEN 0 ELSE ((ls.group_total_purchases_qty - ls.group_total_purchases_qty_prev) / ls.group_total_purchases_qty_prev) * 100 END as group_purchases_qty_evolution,

            -- Margin (Evolution of the Rate itself)
            CASE 
                WHEN (ls.my_sales_ht_prev = 0) THEN 0 
                ELSE (
                    (CASE WHEN ls.my_sales_ht = 0 THEN 0 ELSE (ls.my_margin_ht / ls.my_sales_ht) * 100 END) - 
                    ((ls.my_margin_ht_prev / ls.my_sales_ht_prev) * 100)
                ) 
            END as my_margin_rate_evolution, -- Points evolution
             CASE 
                WHEN (ls.group_total_sales_ht_prev = 0) THEN 0 
                ELSE (
                    (CASE WHEN ls.group_total_sales_ht = 0 THEN 0 ELSE (ls.group_total_margin_ht / ls.group_total_sales_ht) * 100 END) - 
                    ((ls.group_total_margin_ht_prev / ls.group_total_sales_ht_prev) * 100)
                ) 
            END as group_margin_rate_evolution,

            -- PDM (Evolution of the Share itself)
             CASE 
                WHEN (gt.my_total_market_prev = 0) THEN 0 
                ELSE (
                    (CASE WHEN gt.my_total_market = 0 THEN 0 ELSE (ls.my_sales_ttc / gt.my_total_market) * 100 END) - 
                    ((ls.my_sales_ttc_prev / gt.my_total_market_prev) * 100)
                ) 
            END as my_pdm_evolution,
            CASE 
                WHEN (gt.group_total_market_prev = 0) THEN 0 
                ELSE (
                    (CASE WHEN gt.group_total_market = 0 THEN 0 ELSE (ls.group_total_sales_ttc / gt.group_total_market) * 100 END) - 
                    ((ls.group_total_sales_ttc_prev / gt.group_total_market_prev) * 100)
                ) 
            END as group_pdm_evolution

        FROM lab_stats ls
        CROSS JOIN global_totals gt
        LEFT JOIN pharmacy_counts pc_current ON pc_current.period = 'CURRENT'
        ORDER BY ls.my_sales_ttc DESC
    `;

    try {
        const result = await db.query(query, [
            start, // $1
            end, // $2
            prevStart.toISOString(), // $3
            prevEnd.toISOString(), // $4
            myPharmacyId // $5
        ]);

        return result.rows.map(row => ({
            laboratory_name: row.laboratory_name,
            my_rank: Number(row.my_rank),
            my_sales_ttc: Number(row.my_sales_ttc),
            my_sales_qty: Number(row.my_sales_qty),
            my_purchases_ht: Number(row.my_purchases_ht),
            my_purchases_qty: Number(row.my_purchases_qty),
            my_margin_rate: Number(row.my_margin_rate),
            my_pdm_pct: Number(row.my_pdm_pct),

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
            group_pdm_evolution: Number(row.group_pdm_evolution)
        }));
    } catch (error) {
        console.error("Failed to fetch laboratory analysis:", error);
        throw error;
    }
}
