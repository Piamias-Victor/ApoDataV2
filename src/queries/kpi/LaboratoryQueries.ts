
export const LaboratoryQueries = {
    getAnalysisQuery: (
        conditions: string,
        searchCondition: string
    ) => `
    WITH 
        pharmacy_counts AS (
            SELECT 
                CASE 
                    WHEN month >= $1::date AND month <= $2::date THEN 'CURRENT'
                    ELSE 'PREVIOUS'
                END as period,
                COUNT(DISTINCT pharmacy_id) as count
            FROM mv_product_stats_monthly mv
            WHERE (month >= $1::date AND month <= $2::date) 
               OR (month >= $3::date AND month <= $4::date)
            GROUP BY 1
        ),

        last_stock AS (
            -- Current Stock (at $2)
            SELECT 
                mv.laboratory_name,
                SUM(mv.stock) as stock_qty,
                SUM(mv.stock_value_ht) as stock_value_ht
            FROM (
                SELECT DISTINCT ON (product_id) 
                    laboratory_name,
                    stock,
                    stock_value_ht,
                    -- Filter Columns
                    code_13_ref as ean13,
                    category_name,
                    pharmacy_id
                FROM mv_stock_monthly
                WHERE month_end_date <= $2::date 
                  AND ($5::uuid IS NULL OR pharmacy_id = $5::uuid)
                ORDER BY product_id, month_end_date DESC
            ) mv
            LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
            WHERE 1=1
            ${conditions}
            GROUP BY 1
        ),

        last_stock_prev AS (
            -- Previous Stock (at $4)
            SELECT 
                mv.laboratory_name,
                SUM(mv.stock) as stock_qty,
                SUM(mv.stock_value_ht) as stock_value_ht
            FROM (
                SELECT DISTINCT ON (product_id) 
                    laboratory_name,
                    stock,
                    stock_value_ht,
                    -- Filter Columns
                    code_13_ref as ean13,
                    category_name,
                    pharmacy_id
                FROM mv_stock_monthly
                WHERE month_end_date <= $4::date
                  AND ($5::uuid IS NULL OR pharmacy_id = $5::uuid)
                ORDER BY product_id, month_end_date DESC
            ) mv
            LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
            WHERE 1=1
            ${conditions}
            GROUP BY 1
        ),

        lab_stats AS (
            SELECT 
                mv.laboratory_name,

                -- My Metrics (Current)
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.ttc_sold ELSE 0 END) as my_sales_ttc,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.qty_sold ELSE 0 END) as my_sales_qty,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.margin_sold ELSE 0 END) as my_margin_ht,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.ht_sold ELSE 0 END) as my_sales_ht,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.ht_purchased ELSE 0 END) as my_purchases_ht,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $1::date AND mv.month <= $2::date THEN mv.qty_purchased ELSE 0 END) as my_purchases_qty,

                -- My Metrics (Previous)
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.ttc_sold ELSE 0 END) as my_sales_ttc_prev,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.qty_sold ELSE 0 END) as my_sales_qty_prev,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.margin_sold ELSE 0 END) as my_margin_ht_prev,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.ht_sold ELSE 0 END) as my_sales_ht_prev,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.ht_purchased ELSE 0 END) as my_purchases_ht_prev,
                SUM(CASE WHEN ($5::uuid IS NULL OR mv.pharmacy_id = $5::uuid) AND mv.month >= $3::date AND mv.month <= $4::date THEN mv.qty_purchased ELSE 0 END) as my_purchases_qty_prev,

                -- Group Metrics (Current)
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.ttc_sold ELSE 0 END) as group_total_sales_ttc,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.qty_sold ELSE 0 END) as group_total_sales_qty,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.margin_sold ELSE 0 END) as group_total_margin_ht,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.ht_sold ELSE 0 END) as group_total_sales_ht,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.ht_purchased ELSE 0 END) as group_total_purchases_ht,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.qty_purchased ELSE 0 END) as group_total_purchases_qty,

                -- Group Metrics (Previous)
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.ttc_sold ELSE 0 END) as group_total_sales_ttc_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.qty_sold ELSE 0 END) as group_total_sales_qty_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.margin_sold ELSE 0 END) as group_total_margin_ht_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.ht_sold ELSE 0 END) as group_total_sales_ht_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.ht_purchased ELSE 0 END) as group_total_purchases_ht_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.qty_purchased ELSE 0 END) as group_total_purchases_qty_prev
                
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

        -- Metrics
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
        
        -- PDM Sales
        (ls.my_sales_ttc / NULLIF(gt.my_total_sales_market, 0)) * 100 as my_pdm_pct,
        
        -- PDM Purchases
        (ls.my_purchases_ht / NULLIF(gt.my_total_purchases_market, 0)) * 100 as my_pdm_purchases_pct,

        RANK() OVER(ORDER BY ls.my_sales_ttc DESC) as my_rank,

        -- Group Averages
        ls.group_total_sales_ttc / NULLIF(pc_current.count, 0) as group_avg_sales_ttc,
        ls.group_total_sales_qty / NULLIF(pc_current.count, 0) as group_avg_sales_qty,
        ls.group_total_purchases_ht / NULLIF(pc_current.count, 0) as group_avg_purchases_ht,
        ls.group_total_purchases_qty / NULLIF(pc_current.count, 0) as group_avg_purchases_qty,

        CASE WHEN ls.group_total_sales_ht = 0 THEN 0 ELSE (ls.group_total_margin_ht / ls.group_total_sales_ht) * 100 END as group_avg_margin_rate,

        (ls.group_total_sales_ttc / NULLIF(gt.group_total_sales_market, 0)) * 100 as group_pdm_pct,

        RANK() OVER(ORDER BY ls.group_total_sales_ttc DESC) as group_rank,

        -- Evolutions Sales
        CASE WHEN ls.my_sales_ttc_prev = 0 THEN 0 ELSE ((ls.my_sales_ttc - ls.my_sales_ttc_prev) / ls.my_sales_ttc_prev) * 100 END as my_sales_evolution,
        CASE WHEN ls.group_total_sales_ttc_prev = 0 THEN 0 ELSE ((ls.group_total_sales_ttc - ls.group_total_sales_ttc_prev) / ls.group_total_sales_ttc_prev) * 100 END as group_sales_evolution,

        CASE WHEN ls.my_purchases_ht_prev = 0 THEN 0 ELSE ((ls.my_purchases_ht - ls.my_purchases_ht_prev) / ls.my_purchases_ht_prev) * 100 END as my_purchases_evolution,
        CASE WHEN ls.group_total_purchases_ht_prev = 0 THEN 0 ELSE ((ls.group_total_purchases_ht - ls.group_total_purchases_ht_prev) / ls.group_total_purchases_ht_prev) * 100 END as group_purchases_evolution,

        CASE WHEN ls.my_sales_qty_prev = 0 THEN 0 ELSE ((ls.my_sales_qty - ls.my_sales_qty_prev) / ls.my_sales_qty_prev) * 100 END as my_sales_qty_evolution,
        CASE WHEN ls.group_total_sales_qty_prev = 0 THEN 0 ELSE ((ls.group_total_sales_qty - ls.group_total_sales_qty_prev) / ls.group_total_sales_qty_prev) * 100 END as group_sales_qty_evolution,

        CASE WHEN ls.my_purchases_qty_prev = 0 THEN 0 ELSE ((ls.my_purchases_qty - ls.my_purchases_qty_prev) / ls.my_purchases_qty_prev) * 100 END as my_purchases_qty_evolution,
        CASE WHEN ls.group_total_purchases_qty_prev = 0 THEN 0 ELSE ((ls.group_total_purchases_qty - ls.group_total_purchases_qty_prev) / ls.group_total_purchases_qty_prev) * 100 END as group_purchases_qty_evolution,

        -- Evolutions Margin
        CASE WHEN ls.my_margin_ht_prev = 0 THEN 0 ELSE ((ls.my_margin_ht - ls.my_margin_ht_prev) / ABS(ls.my_margin_ht_prev)) * 100 END as my_margin_ht_evolution,
        CASE
            WHEN (ls.my_sales_ht_prev = 0) THEN 0
            ELSE ((CASE WHEN ls.my_sales_ht = 0 THEN 0 ELSE (ls.my_margin_ht / ls.my_sales_ht) * 100 END) - ((ls.my_margin_ht_prev / ls.my_sales_ht_prev) * 100))
        END as my_margin_rate_evolution,
        CASE
            WHEN (ls.group_total_sales_ht_prev = 0) THEN 0
            ELSE ((CASE WHEN ls.group_total_sales_ht = 0 THEN 0 ELSE (ls.group_total_margin_ht / ls.group_total_sales_ht) * 100 END) - ((ls.group_total_margin_ht_prev / ls.group_total_sales_ht_prev) * 100))
        END as group_margin_rate_evolution,

        -- Evolutions PDM
        ((ls.my_sales_ttc / NULLIF(gt.my_total_sales_market, 0)) * 100) - ((ls.my_sales_ttc_prev / NULLIF(gt.my_total_sales_market_prev, 0)) * 100) as my_pdm_evolution,
        ((ls.group_total_sales_ttc / NULLIF(gt.group_total_sales_market, 0)) * 100) - ((ls.group_total_sales_ttc_prev / NULLIF(gt.group_total_sales_market_prev, 0)) * 100) as group_pdm_evolution,
        
        -- Evolutions PDM Purchases
        ((ls.my_purchases_ht / NULLIF(gt.my_total_purchases_market, 0)) * 100) - ((ls.my_purchases_ht_prev / NULLIF(gt.my_total_purchases_market_prev, 0)) * 100) as my_pdm_purchases_evolution,

        -- Stock Evolutions
        -- Note: days of stock evolution could be calculated but requires prev sales also. Let's stick to Qty/Value evo.
        CASE 
            WHEN COALESCE(lstp.stock_qty, 0) = 0 THEN 0 
            ELSE ((COALESCE(lst.stock_qty, 0) - COALESCE(lstp.stock_qty, 0)) / COALESCE(lstp.stock_qty, 0)) * 100 
        END as my_stock_qty_evolution,
        
        CASE 
            WHEN COALESCE(lstp.stock_value_ht, 0) = 0 THEN 0 
            ELSE ((COALESCE(lst.stock_value_ht, 0) - COALESCE(lstp.stock_value_ht, 0)) / COALESCE(lstp.stock_value_ht, 0)) * 100 
        END as my_stock_value_evolution

    FROM lab_stats ls
    LEFT JOIN last_stock lst ON lst.laboratory_name = ls.laboratory_name
    LEFT JOIN last_stock_prev lstp ON lstp.laboratory_name = ls.laboratory_name
    CROSS JOIN global_totals gt
    LEFT JOIN pharmacy_counts pc_current ON pc_current.period = 'CURRENT'
    ORDER BY ls.my_sales_ttc DESC
    `
};
