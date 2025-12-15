
export const ProductQueries = {
    getGlobalQuery: (
        conditions: string,
        searchCondition: string,
        limitClause: string,
        limitIdx: number,
        offsetIdx: number
    ) => `
        WITH 
        last_stock AS (
            SELECT 
                ean13,
                SUM(stock) as stock_qty,
                SUM(stock_value_ht) as stock_value_ht
            FROM (
                SELECT DISTINCT ON (ms.product_id) 
                    ms.code_13_ref as ean13,
                    ms.stock,
                    ms.stock_value_ht
                FROM mv_stock_monthly ms
                WHERE ms.month_end_date <= $2::date 
                  AND ($5::uuid IS NULL OR ms.pharmacy_id = $5::uuid)
                ORDER BY ms.product_id, ms.month_end_date DESC
            ) t
            WHERE ean13 IS NOT NULL
            GROUP BY 1
        ),

        last_stock_prev AS (
            SELECT 
                ean13,
                SUM(stock) as stock_qty,
                SUM(stock_value_ht) as stock_value_ht
            FROM (
                SELECT DISTINCT ON (ms.product_id) 
                    ms.code_13_ref as ean13,
                    ms.stock,
                    ms.stock_value_ht
                FROM mv_stock_monthly ms
                WHERE ms.month_end_date <= $4::date 
                  AND ($5::uuid IS NULL OR ms.pharmacy_id = $5::uuid)
                ORDER BY ms.product_id, ms.month_end_date DESC
            ) t
            WHERE ean13 IS NOT NULL
            GROUP BY 1
        ),

        global_stats AS (
            SELECT 
                mv.ean13,
                MAX(mv.product_label) as product_name,
                MAX(mv.laboratory_name) as laboratory_name,
                MAX(mv.product_id::text)::uuid as product_id,

                -- Metrics (Current)
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.ttc_sold ELSE 0 END) as sales_ttc,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.qty_sold ELSE 0 END) as sales_qty,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.margin_sold ELSE 0 END) as margin_ht,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.ht_sold ELSE 0 END) as sales_ht,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.ht_purchased ELSE 0 END) as purchases_ht,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.qty_purchased ELSE 0 END) as purchases_qty,

                -- Metrics (Previous)
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.ttc_sold ELSE 0 END) as sales_ttc_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.qty_sold ELSE 0 END) as sales_qty_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.margin_sold ELSE 0 END) as margin_ht_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.ht_sold ELSE 0 END) as sales_ht_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.ht_purchased ELSE 0 END) as purchases_ht_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.qty_purchased ELSE 0 END) as purchases_qty_prev

            FROM mv_product_stats_monthly mv
            LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
            WHERE (
                (mv.month >= $1::date AND mv.month <= $2::date) 
                OR (mv.month >= $3::date AND mv.month <= $4::date)
            )
            AND ($5::uuid IS NULL OR true)
            AND mv.ean13 != 'NO-EAN'
            ${conditions}
            ${searchCondition}
            GROUP BY mv.ean13
            ORDER BY sales_qty DESC
            ${limitClause}
        ),
        
        pharmacy_counts AS (
            SELECT 
                CASE 
                    WHEN month >= $1::date AND month <= $2::date THEN 'CURRENT'
                    ELSE 'PREVIOUS'
                END as period,
                COUNT(DISTINCT pharmacy_id) as count
            FROM mv_product_stats_monthly
            WHERE (month >= $1::date AND month <= $2::date) 
               OR (month >= $3::date AND month <= $4::date)
            GROUP BY 1
        ),
        
        global_totals AS (
            SELECT
                SUM(sales_ttc) as total_sales_market,
                SUM(purchases_ht) as total_purchases_market,
                SUM(sales_ttc_prev) as total_sales_market_prev,
                SUM(purchases_ht_prev) as total_purchases_market_prev
            FROM global_stats
        )

        SELECT
            gs.product_name,
            gs.ean13,
            gs.laboratory_name,

            -- "Me" = "Group" (Global)
            gs.sales_ttc as my_sales_ttc,
            gs.sales_qty as my_sales_qty,
            gs.purchases_ht as my_purchases_ht,
            gs.purchases_qty as my_purchases_qty,
            gs.margin_ht as my_margin_ht,

            -- Stock
            COALESCE(lst.stock_qty, 0) as my_stock_qty,
            COALESCE(lst.stock_value_ht, 0) as my_stock_value_ht,

            -- Days of Stock
            CASE 
                WHEN (gs.sales_ht - gs.margin_ht) > 0 THEN 
                    (COALESCE(lst.stock_value_ht, 0) / ((gs.sales_ht - gs.margin_ht) / GREATEST(1, ($2::date - $1::date)))) 
                ELSE 0 
            END as my_days_of_stock,

            CASE WHEN gs.sales_ht = 0 THEN 0 ELSE (gs.margin_ht / gs.sales_ht) * 100 END as my_margin_rate,
            (gs.sales_ttc / NULLIF(gt.total_sales_market, 0)) * 100 as my_pdm_pct,
            (gs.purchases_ht / NULLIF(gt.total_purchases_market, 0)) * 100 as my_pdm_purchases_pct,

            RANK() OVER(ORDER BY gs.sales_qty DESC) as my_rank,

            -- Group Averages
            gs.sales_ttc / NULLIF(pc_current.count, 0) as group_avg_sales_ttc,
            gs.sales_qty / NULLIF(pc_current.count, 0) as group_avg_sales_qty,
            gs.purchases_ht / NULLIF(pc_current.count, 0) as group_avg_purchases_ht,
            gs.purchases_qty / NULLIF(pc_current.count, 0) as group_avg_purchases_qty,

            CASE WHEN gs.sales_ht = 0 THEN 0 ELSE (gs.margin_ht / gs.sales_ht) * 100 END as group_avg_margin_rate,
            (gs.sales_ttc / NULLIF(gt.total_sales_market, 0)) * 100 as group_pdm_pct,
            RANK() OVER(ORDER BY gs.sales_qty DESC) as group_rank,

            -- Evolutions
            CASE WHEN gs.sales_ttc_prev = 0 THEN 0 ELSE ((gs.sales_ttc - gs.sales_ttc_prev) / gs.sales_ttc_prev) * 100 END as my_sales_evolution,
            CASE WHEN gs.sales_ttc_prev = 0 THEN 0 ELSE ((gs.sales_ttc - gs.sales_ttc_prev) / gs.sales_ttc_prev) * 100 END as group_sales_evolution,

            CASE WHEN gs.purchases_ht_prev = 0 THEN 0 ELSE ((gs.purchases_ht - gs.purchases_ht_prev) / gs.purchases_ht_prev) * 100 END as my_purchases_evolution,
            CASE WHEN gs.purchases_ht_prev = 0 THEN 0 ELSE ((gs.purchases_ht - gs.purchases_ht_prev) / gs.purchases_ht_prev) * 100 END as group_purchases_evolution,

            CASE WHEN gs.sales_qty_prev = 0 THEN 0 ELSE ((gs.sales_qty - gs.sales_qty_prev) / gs.sales_qty_prev) * 100 END as my_sales_qty_evolution,
            CASE WHEN gs.sales_qty_prev = 0 THEN 0 ELSE ((gs.sales_qty - gs.sales_qty_prev) / gs.sales_qty_prev) * 100 END as group_sales_qty_evolution,

            CASE WHEN gs.purchases_qty_prev = 0 THEN 0 ELSE ((gs.purchases_qty - gs.purchases_qty_prev) / gs.purchases_qty_prev) * 100 END as my_purchases_qty_evolution,
            CASE WHEN gs.purchases_qty_prev = 0 THEN 0 ELSE ((gs.purchases_qty - gs.purchases_qty_prev) / gs.purchases_qty_prev) * 100 END as group_purchases_qty_evolution,

            CASE
                WHEN (gs.sales_ht_prev = 0) THEN 0
                ELSE ((CASE WHEN gs.sales_ht = 0 THEN 0 ELSE (gs.margin_ht / gs.sales_ht) * 100 END) - ((gs.margin_ht_prev / gs.sales_ht_prev) * 100))
            END as my_margin_rate_evolution,
            CASE
                WHEN (gs.sales_ht_prev = 0) THEN 0
                ELSE ((CASE WHEN gs.sales_ht = 0 THEN 0 ELSE (gs.margin_ht / gs.sales_ht) * 100 END) - ((gs.margin_ht_prev / gs.sales_ht_prev) * 100))
            END as group_margin_rate_evolution,

            ((gs.sales_ttc / NULLIF(gt.total_sales_market, 0)) * 100) - ((gs.sales_ttc_prev / NULLIF(gt.total_sales_market_prev, 0)) * 100) as my_pdm_evolution,
            0 as group_pdm_evolution,

            ((gs.purchases_ht / NULLIF(gt.total_purchases_market, 0)) * 100) - ((gs.purchases_ht_prev / NULLIF(gt.total_purchases_market_prev, 0)) * 100) as my_pdm_purchases_evolution,
            CASE WHEN gs.margin_ht_prev = 0 THEN 0 ELSE ((gs.margin_ht - gs.margin_ht_prev) / ABS(gs.margin_ht_prev)) * 100 END as my_margin_ht_evolution,
            
             CASE 
                WHEN COALESCE(lstp.stock_qty, 0) = 0 THEN 0 
                ELSE ((COALESCE(lst.stock_qty, 0) - COALESCE(lstp.stock_qty, 0)) / COALESCE(lstp.stock_qty, 0)) * 100 
            END as my_stock_qty_evolution,
            
            CASE 
                WHEN COALESCE(lstp.stock_value_ht, 0) = 0 THEN 0 
                ELSE ((COALESCE(lst.stock_value_ht, 0) - COALESCE(lstp.stock_value_ht, 0)) / COALESCE(lstp.stock_value_ht, 0)) * 100 
            END as my_stock_value_ht_evolution,
            
            COUNT(*) OVER() as total_rows
            
        FROM global_stats gs
        LEFT JOIN last_stock lst ON lst.ean13 = gs.ean13
        LEFT JOIN last_stock_prev lstp ON lstp.ean13 = gs.ean13
        CROSS JOIN global_totals gt
        LEFT JOIN pharmacy_counts pc_current ON pc_current.period = 'CURRENT'
        ORDER BY gs.sales_qty DESC
        LIMIT $${limitIdx}::int OFFSET $${offsetIdx}::int
    `,

    getComparativeQuery: (
        conditions: string,
        searchCondition: string,
        limitClause: string,
        limitIdx: number,
        offsetIdx: number
    ) => `
        WITH 
        pharmacy_counts AS (
            SELECT 
                CASE 
                    WHEN month >= $1::date AND month <= $2::date THEN 'CURRENT'
                    ELSE 'PREVIOUS'
                END as period,
                COUNT(DISTINCT pharmacy_id) as count
            FROM mv_product_stats_monthly
            WHERE (month >= $1::date AND month <= $2::date) 
               OR (month >= $3::date AND month <= $4::date)
            GROUP BY 1
        ),

        last_stock AS (
            SELECT 
                ean13,
                SUM(stock) as stock_qty,
                SUM(stock_value_ht) as stock_value_ht
            FROM (
                SELECT DISTINCT ON (ms.product_id) 
                    ms.code_13_ref as ean13,
                    ms.stock,
                    ms.stock_value_ht
                FROM mv_stock_monthly ms
                WHERE ms.month_end_date <= $2::date 
                  AND ms.pharmacy_id = $5::uuid
                ORDER BY ms.product_id, ms.month_end_date DESC
            ) t
            WHERE ean13 IS NOT NULL
            GROUP BY 1
        ),

        last_stock_prev AS (
            SELECT 
                ean13,
                SUM(stock) as stock_qty,
                SUM(stock_value_ht) as stock_value_ht
            FROM (
                SELECT DISTINCT ON (ms.product_id) 
                    ms.code_13_ref as ean13,
                    ms.stock,
                    ms.stock_value_ht
                FROM mv_stock_monthly ms
                WHERE ms.month_end_date <= $4::date
                  AND ms.pharmacy_id = $5::uuid
                ORDER BY ms.product_id, ms.month_end_date DESC
            ) t
            WHERE ean13 IS NOT NULL
            GROUP BY 1
        ),

        my_stats AS (
            SELECT 
                mv.ean13,
                MAX(mv.product_label) as product_name,
                MAX(mv.laboratory_name) as laboratory_name,
                MAX(mv.product_id::text)::uuid as product_id,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.ttc_sold ELSE 0 END) as my_sales_ttc,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.qty_sold ELSE 0 END) as my_sales_qty,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.margin_sold ELSE 0 END) as my_margin_ht,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.ht_sold ELSE 0 END) as my_sales_ht,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.ht_purchased ELSE 0 END) as my_purchases_ht,
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.qty_purchased ELSE 0 END) as my_purchases_qty,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.ttc_sold ELSE 0 END) as my_sales_ttc_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.qty_sold ELSE 0 END) as my_sales_qty_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.margin_sold ELSE 0 END) as my_margin_ht_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.ht_sold ELSE 0 END) as my_sales_ht_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.ht_purchased ELSE 0 END) as my_purchases_ht_prev,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.qty_purchased ELSE 0 END) as my_purchases_qty_prev
            FROM mv_product_stats_monthly mv
            LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
            WHERE mv.pharmacy_id = $5::uuid 
              AND ((mv.month >= $1::date AND mv.month <= $2::date) OR (mv.month >= $3::date AND mv.month <= $4::date))
              AND mv.ean13 != 'NO-EAN'
              ${conditions}
              ${searchCondition}
            GROUP BY mv.ean13
            ORDER BY my_sales_qty DESC 
            ${limitClause}
        ),

        group_stats AS (
            SELECT 
                ean13,
                SUM(CASE WHEN month >= $1::date AND month <= $2::date THEN ttc_sold ELSE 0 END) as group_total_sales_ttc,
                SUM(CASE WHEN month >= $1::date AND month <= $2::date THEN qty_sold ELSE 0 END) as group_total_sales_qty,
                SUM(CASE WHEN month >= $1::date AND month <= $2::date THEN margin_sold ELSE 0 END) as group_total_margin_ht,
                SUM(CASE WHEN month >= $1::date AND month <= $2::date THEN ht_sold ELSE 0 END) as group_total_sales_ht,
                SUM(CASE WHEN month >= $1::date AND month <= $2::date THEN ht_purchased ELSE 0 END) as group_total_purchases_ht,
                SUM(CASE WHEN month >= $1::date AND month <= $2::date THEN qty_purchased ELSE 0 END) as group_total_purchases_qty,
                SUM(CASE WHEN month >= $3::date AND month <= $4::date THEN ttc_sold ELSE 0 END) as group_total_sales_ttc_prev,
                SUM(CASE WHEN month >= $3::date AND month <= $4::date THEN qty_sold ELSE 0 END) as group_total_sales_qty_prev,
                SUM(CASE WHEN month >= $3::date AND month <= $4::date THEN margin_sold ELSE 0 END) as group_total_margin_ht_prev,
                SUM(CASE WHEN month >= $3::date AND month <= $4::date THEN ht_sold ELSE 0 END) as group_total_sales_ht_prev,
                SUM(CASE WHEN month >= $3::date AND month <= $4::date THEN ht_purchased ELSE 0 END) as group_total_purchases_ht_prev,
                SUM(CASE WHEN month >= $3::date AND month <= $4::date THEN qty_purchased ELSE 0 END) as group_total_purchases_qty_prev
            FROM mv_product_stats_monthly
            WHERE ean13 IN (SELECT ean13 FROM my_stats)
              AND ((month >= $1::date AND month <= $2::date) OR (month >= $3::date AND month <= $4::date))
            GROUP BY ean13
        ),
        
        global_totals AS (
            SELECT
                SUM(my_sales_ttc) as my_total_sales_market,
                SUM(my_purchases_ht) as my_total_purchases_market,
                SUM(group_total_sales_ttc) as group_total_sales_market,
                
                SUM(my_sales_ttc_prev) as my_total_sales_market_prev,
                SUM(my_purchases_ht_prev) as my_total_purchases_market_prev,
                SUM(group_total_sales_ttc_prev) as group_total_sales_market_prev,
                COUNT(*) as total_rows
            FROM my_stats 
            JOIN group_stats USING (ean13)
        )

        SELECT
            ms.product_name,
            ms.ean13,
            ms.laboratory_name,
            ms.my_sales_ttc,
            ms.my_sales_qty,
            ms.my_purchases_ht,
            ms.my_purchases_qty,
            ms.my_margin_ht,

            -- Stock
            COALESCE(lst.stock_qty, 0) as my_stock_qty,
            COALESCE(lst.stock_value_ht, 0) as my_stock_value_ht,

            -- Days of Stock
            CASE 
                WHEN (ms.my_sales_ht - ms.my_margin_ht) > 0 THEN 
                    (COALESCE(lst.stock_value_ht, 0) / ((ms.my_sales_ht - ms.my_margin_ht) / GREATEST(1, ($2::date - $1::date)))) 
                ELSE 0 
            END as my_days_of_stock,

            CASE WHEN ms.my_sales_ht = 0 THEN 0 ELSE (ms.my_margin_ht / ms.my_sales_ht) * 100 END as my_margin_rate,
            (ms.my_sales_ttc / NULLIF(gt.my_total_sales_market, 0)) * 100 as my_pdm_pct,
            (ms.my_purchases_ht / NULLIF(gt.my_total_purchases_market, 0)) * 100 as my_pdm_purchases_pct,

            RANK() OVER(ORDER BY ms.my_sales_qty DESC) as my_rank,

            gs.group_total_sales_ttc / NULLIF(pc_current.count, 0) as group_avg_sales_ttc,
            gs.group_total_sales_qty / NULLIF(pc_current.count, 0) as group_avg_sales_qty,
            gs.group_total_purchases_ht / NULLIF(pc_current.count, 0) as group_avg_purchases_ht,
            gs.group_total_purchases_qty / NULLIF(pc_current.count, 0) as group_avg_purchases_qty,

            CASE WHEN gs.group_total_sales_ht = 0 THEN 0 ELSE (gs.group_total_margin_ht / gs.group_total_sales_ht) * 100 END as group_avg_margin_rate,
            (gs.group_total_sales_ttc / NULLIF(gt.group_total_sales_market, 0)) * 100 as group_pdm_pct,

            RANK() OVER(ORDER BY gs.group_total_sales_qty DESC) as group_rank,

            CASE WHEN ms.my_sales_ttc_prev = 0 THEN 0 ELSE ((ms.my_sales_ttc - ms.my_sales_ttc_prev) / ms.my_sales_ttc_prev) * 100 END as my_sales_evolution,
            CASE WHEN gs.group_total_sales_ttc_prev = 0 THEN 0 ELSE ((gs.group_total_sales_ttc - gs.group_total_sales_ttc_prev) / gs.group_total_sales_ttc_prev) * 100 END as group_sales_evolution,

            CASE WHEN ms.my_purchases_ht_prev = 0 THEN 0 ELSE ((ms.my_purchases_ht - ms.my_purchases_ht_prev) / ms.my_purchases_ht_prev) * 100 END as my_purchases_evolution,
            CASE WHEN gs.group_total_purchases_ht_prev = 0 THEN 0 ELSE ((gs.group_total_purchases_ht - gs.group_total_purchases_ht_prev) / gs.group_total_purchases_ht_prev) * 100 END as group_purchases_evolution,

            CASE WHEN ms.my_sales_qty_prev = 0 THEN 0 ELSE ((ms.my_sales_qty - ms.my_sales_qty_prev) / ms.my_sales_qty_prev) * 100 END as my_sales_qty_evolution,
            CASE WHEN gs.group_total_sales_qty_prev = 0 THEN 0 ELSE ((gs.group_total_sales_qty - gs.group_total_sales_qty_prev) / gs.group_total_sales_qty_prev) * 100 END as group_sales_qty_evolution,

            CASE WHEN ms.my_purchases_qty_prev = 0 THEN 0 ELSE ((ms.my_purchases_qty - ms.my_purchases_qty_prev) / ms.my_purchases_qty_prev) * 100 END as my_purchases_qty_evolution,
            CASE WHEN gs.group_total_purchases_qty_prev = 0 THEN 0 ELSE ((gs.group_total_purchases_qty - gs.group_total_purchases_qty_prev) / gs.group_total_purchases_qty_prev) * 100 END as group_purchases_qty_evolution,

            CASE
                WHEN (ms.my_sales_ht_prev = 0) THEN 0
                ELSE ((CASE WHEN ms.my_sales_ht = 0 THEN 0 ELSE (ms.my_margin_ht / ms.my_sales_ht) * 100 END) - ((ms.my_margin_ht_prev / ms.my_sales_ht_prev) * 100))
            END as my_margin_rate_evolution,
            CASE
                WHEN (gs.group_total_sales_ht_prev = 0) THEN 0
                ELSE ((CASE WHEN gs.group_total_sales_ht = 0 THEN 0 ELSE (gs.group_total_margin_ht / gs.group_total_sales_ht) * 100 END) - ((gs.group_total_margin_ht_prev / gs.group_total_sales_ht_prev) * 100))
            END as group_margin_rate_evolution,

            ((ms.my_sales_ttc / NULLIF(gt.my_total_sales_market, 0)) * 100) - ((ms.my_sales_ttc_prev / NULLIF(gt.my_total_sales_market_prev, 0)) * 100) as my_pdm_evolution,
            ((gs.group_total_sales_ttc / NULLIF(gt.group_total_sales_market, 0)) * 100) - ((gs.group_total_sales_ttc_prev / NULLIF(gt.group_total_sales_market_prev, 0)) * 100) as group_pdm_evolution,

            ((ms.my_purchases_ht / NULLIF(gt.my_total_purchases_market, 0)) * 100) - ((ms.my_purchases_ht_prev / NULLIF(gt.my_total_purchases_market_prev, 0)) * 100) as my_pdm_purchases_evolution,

            CASE WHEN ms.my_margin_ht_prev = 0 THEN 0 ELSE ((ms.my_margin_ht - ms.my_margin_ht_prev) / ABS(ms.my_margin_ht_prev)) * 100 END as my_margin_ht_evolution,

             CASE 
                WHEN COALESCE(lstp.stock_qty, 0) = 0 THEN 0 
                ELSE ((COALESCE(lst.stock_qty, 0) - COALESCE(lstp.stock_qty, 0)) / COALESCE(lstp.stock_qty, 0)) * 100 
            END as my_stock_qty_evolution,
            
            CASE 
                WHEN COALESCE(lstp.stock_value_ht, 0) = 0 THEN 0 
                ELSE ((COALESCE(lst.stock_value_ht, 0) - COALESCE(lstp.stock_value_ht, 0)) / COALESCE(lstp.stock_value_ht, 0)) * 100 
            END as my_stock_value_ht_evolution,

            gt.total_rows

        FROM my_stats ms
        JOIN group_stats gs ON ms.ean13 = gs.ean13
        LEFT JOIN last_stock lst ON lst.ean13 = ms.ean13
        LEFT JOIN last_stock_prev lstp ON lstp.ean13 = ms.ean13
        CROSS JOIN global_totals gt
        LEFT JOIN pharmacy_counts pc_current ON pc_current.period = 'CURRENT'
        ORDER BY ms.my_sales_qty DESC
        LIMIT $${limitIdx}::int OFFSET $${offsetIdx}::int
    `
};
