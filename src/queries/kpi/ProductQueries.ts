
export const ProductQueries = {
    getGlobalQuery: (
        conditions: string,
        searchCondition: string,
        limitClause: string,
        limitIdx: number,
        offsetIdx: number,
        orderByClause: string = 'ORDER BY sales_qty DESC',
        finalOrderByClause: string = 'ORDER BY sales_qty DESC',
        genericStatusFilter?: string,
        productTypeFilter?: string
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
                  AND ($5::uuid[] IS NULL OR ms.pharmacy_id = ANY($5::uuid[]))
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
                  AND ($5::uuid[] IS NULL OR ms.pharmacy_id = ANY($5::uuid[]))
                ORDER BY ms.product_id, ms.month_end_date DESC
            ) t
            WHERE ean13 IS NOT NULL
            GROUP BY 1
        ),

        global_stats AS (
            SELECT 
                mv.ean13,
                MAX(COALESCE(gp.name, mv.product_label)) as product_name,
                MAX(mv.laboratory_name) as laboratory_name,
                MAX(mv.product_id::text)::uuid as product_id,
                
                -- Price Info (NEW)
                MAX(gp.prix_achat_ht_fabricant) as prix_brut,
                AVG(lp.discount_percentage) as discount_pct,

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
            LEFT JOIN mv_latest_product_prices lp ON lp.product_id = mv.product_id
            WHERE (
                (mv.month >= $1::date AND mv.month <= $2::date) 
                OR (mv.month >= $3::date AND mv.month <= $4::date)
            )
            AND ($5::uuid[] IS NULL OR true)
            AND mv.ean13 != 'NO-EAN'
            ${genericStatusFilter ? `AND ${genericStatusFilter}` : ''}
            ${productTypeFilter ? `AND ${productTypeFilter}` : ''}
            ${conditions}
            ${searchCondition}
            GROUP BY mv.ean13
            ${orderByClause}
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
        ),
        
        ranked_stats AS (
            SELECT
                gs.*,
                lst.stock_qty,
                lst.stock_value_ht,
                lstp.stock_qty as stock_qty_prev,
                lstp.stock_value_ht as stock_value_ht_prev,
                
                -- Calculate ranks BEFORE pagination
                RANK() OVER(ORDER BY gs.sales_qty DESC) as my_rank,
                RANK() OVER(ORDER BY gs.sales_qty DESC) as group_rank,
                
                -- Calculated fields needed for sorting
                CASE WHEN gs.purchases_qty = 0 THEN 0 ELSE gs.purchases_ht / gs.purchases_qty END as avg_purchase_price,
                CASE WHEN gs.sales_qty = 0 THEN 0 ELSE gs.sales_ttc / gs.sales_qty END as avg_sell_price,
                CASE WHEN gs.sales_ht = 0 THEN 0 ELSE (gs.margin_ht / gs.sales_ht) * 100 END as my_margin_rate,
                
                -- Days of Stock
                CASE 
                    WHEN (gs.sales_ht - gs.margin_ht) > 0 THEN 
                        (COALESCE(lst.stock_value_ht, 0) / ((gs.sales_ht - gs.margin_ht) / GREATEST(1, ($2::date - $1::date)))) 
                    ELSE 0 
                END as my_days_of_stock
                
            FROM global_stats gs
            LEFT JOIN last_stock lst ON lst.ean13 = gs.ean13
            LEFT JOIN last_stock_prev lstp ON lstp.ean13 = gs.ean13
        )

        SELECT
            rs.product_name,
            rs.ean13,
            rs.laboratory_name,
            
            -- Price Info (NEW)
            COALESCE(rs.prix_brut, 0) as prix_brut,
            COALESCE(rs.discount_pct, 0) as discount_pct,

            -- "Me" = "Group" (Global)
            rs.sales_ttc as my_sales_ttc,
            rs.sales_qty as my_sales_qty,
            rs.purchases_ht as my_purchases_ht,
            rs.purchases_qty as my_purchases_qty,
            rs.margin_ht as my_margin_ht,
            
            -- Calculated Prices for Sorting
            rs.avg_purchase_price,
            rs.avg_sell_price,

            -- Stock
            COALESCE(rs.stock_qty, 0) as my_stock_qty,
            COALESCE(rs.stock_value_ht, 0) as my_stock_value_ht,

            -- Days of Stock
            rs.my_days_of_stock,

            rs.my_margin_rate,
            (rs.sales_ttc / NULLIF(gt.total_sales_market, 0)) * 100 as my_pdm_pct,
            (rs.purchases_ht / NULLIF(gt.total_purchases_market, 0)) * 100 as my_pdm_purchases_pct,

            rs.my_rank,

            -- Group Averages
            rs.sales_ttc / NULLIF(pc_current.count, 0) as group_avg_sales_ttc,
            rs.sales_qty / NULLIF(pc_current.count, 0) as group_avg_sales_qty,
            rs.purchases_ht / NULLIF(pc_current.count, 0) as group_avg_purchases_ht,
            rs.purchases_qty / NULLIF(pc_current.count, 0) as group_avg_purchases_qty,

            rs.my_margin_rate as group_avg_margin_rate,
            (rs.sales_ttc / NULLIF(gt.total_sales_market, 0)) * 100 as group_pdm_pct,
            rs.group_rank,

            -- Evolutions
            CASE WHEN rs.sales_ttc_prev = 0 THEN 0 ELSE ((rs.sales_ttc - rs.sales_ttc_prev) / rs.sales_ttc_prev) * 100 END as my_sales_evolution,
            CASE WHEN rs.sales_ttc_prev = 0 THEN 0 ELSE ((rs.sales_ttc - rs.sales_ttc_prev) / rs.sales_ttc_prev) * 100 END as group_sales_evolution,

            CASE WHEN rs.purchases_ht_prev = 0 THEN 0 ELSE ((rs.purchases_ht - rs.purchases_ht_prev) / rs.purchases_ht_prev) * 100 END as my_purchases_evolution,
            CASE WHEN rs.purchases_ht_prev = 0 THEN 0 ELSE ((rs.purchases_ht - rs.purchases_ht_prev) / rs.purchases_ht_prev) * 100 END as group_purchases_evolution,

            CASE WHEN rs.sales_qty_prev = 0 THEN 0 ELSE ((rs.sales_qty - rs.sales_qty_prev) / rs.sales_qty_prev) * 100 END as my_sales_qty_evolution,
            CASE WHEN rs.sales_qty_prev = 0 THEN 0 ELSE ((rs.sales_qty - rs.sales_qty_prev) / rs.sales_qty_prev) * 100 END as group_sales_qty_evolution,

            CASE WHEN rs.purchases_qty_prev = 0 THEN 0 ELSE ((rs.purchases_qty - rs.purchases_qty_prev) / rs.purchases_qty_prev) * 100 END as my_purchases_qty_evolution,
            CASE WHEN rs.purchases_qty_prev = 0 THEN 0 ELSE ((rs.purchases_qty - rs.purchases_qty_prev) / rs.purchases_qty_prev) * 100 END as group_purchases_qty_evolution,

            CASE
                WHEN (rs.sales_ht_prev = 0) THEN 0
                ELSE ((rs.my_margin_rate) - ((rs.margin_ht_prev / rs.sales_ht_prev) * 100))
            END as my_margin_rate_evolution,
            CASE
                WHEN (rs.sales_ht_prev = 0) THEN 0
                ELSE ((rs.my_margin_rate) - ((rs.margin_ht_prev / rs.sales_ht_prev) * 100))
            END as group_margin_rate_evolution,

            ((rs.sales_ttc / NULLIF(gt.total_sales_market, 0)) * 100) - ((rs.sales_ttc_prev / NULLIF(gt.total_sales_market_prev, 0)) * 100) as my_pdm_evolution,
            0 as group_pdm_evolution,

            ((rs.purchases_ht / NULLIF(gt.total_purchases_market, 0)) * 100) - ((gt.total_purchases_market_prev / NULLIF(gt.total_purchases_market_prev, 0)) * 100) as my_pdm_purchases_evolution,
            CASE WHEN rs.margin_ht_prev = 0 THEN 0 ELSE ((rs.margin_ht - rs.margin_ht_prev) / ABS(rs.margin_ht_prev)) * 100 END as my_margin_ht_evolution,
            
             CASE 
                WHEN COALESCE(rs.stock_qty_prev, 0) = 0 THEN 0 
                ELSE ((COALESCE(rs.stock_qty, 0) - COALESCE(rs.stock_qty_prev, 0)) / COALESCE(rs.stock_qty_prev, 0)) * 100 
            END as my_stock_qty_evolution,
            
            CASE 
                WHEN COALESCE(rs.stock_value_ht_prev, 0) = 0 THEN 0 
                ELSE ((COALESCE(rs.stock_value_ht, 0) - COALESCE(rs.stock_value_ht_prev, 0)) / COALESCE(rs.stock_value_ht_prev, 0)) * 100 
            END as my_stock_value_ht_evolution,
            
            COUNT(*) OVER() as total_rows
            
        FROM ranked_stats rs
        CROSS JOIN global_totals gt
        LEFT JOIN pharmacy_counts pc_current ON pc_current.period = 'CURRENT'
        ${finalOrderByClause}
        LIMIT $${limitIdx}::int OFFSET $${offsetIdx}::int
    `,

    getComparativeQuery: (
        conditions: string,
        searchCondition: string,
        limitClause: string,
        limitIdx: number,
        offsetIdx: number,
        orderByClause: string = 'ORDER BY my_sales_qty DESC',
        finalOrderByClause: string = 'ORDER BY my_sales_qty DESC',
        genericStatusFilter?: string,
        productTypeFilter?: string
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
                  AND ms.pharmacy_id = ANY($5::uuid[])
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
                  AND ms.pharmacy_id = ANY($5::uuid[])
                ORDER BY ms.product_id, ms.month_end_date DESC
            ) t
            WHERE ean13 IS NOT NULL
            GROUP BY 1
        ),

        my_stats AS (
            SELECT 
                mv.ean13,
                MAX(COALESCE(gp.name, mv.product_label)) as product_name,
                MAX(mv.laboratory_name) as laboratory_name,
                MAX(mv.product_id::text)::uuid as product_id,
                
                -- Price Info (NEW)
                MAX(gp.prix_achat_ht_fabricant) as prix_brut,
                AVG(lp.discount_percentage) as discount_pct,
                
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
            LEFT JOIN mv_latest_product_prices lp ON lp.product_id = mv.product_id
            WHERE mv.pharmacy_id = ANY($5::uuid[]) 
              AND ((mv.month >= $1::date AND mv.month <= $2::date) OR (mv.month >= $3::date AND mv.month <= $4::date))
              AND mv.ean13 != 'NO-EAN'
              ${genericStatusFilter ? `AND ${genericStatusFilter}` : ''}
              ${productTypeFilter ? `AND ${productTypeFilter}` : ''}
              ${conditions}
              ${searchCondition}
            GROUP BY mv.ean13
            ${orderByClause}
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
        ),
        
        ranked_my_stats AS (
            SELECT
                ms.*,
                lst.stock_qty,
                lst.stock_value_ht,
                lstp.stock_qty as stock_qty_prev,
                lstp.stock_value_ht as stock_value_ht_prev,
                
                -- Calculate my_rank BEFORE pagination
                RANK() OVER(ORDER BY ms.my_sales_qty DESC) as my_rank,
                
                -- Calculated fields needed for sorting
                CASE WHEN ms.my_purchases_qty = 0 THEN 0 ELSE ms.my_purchases_ht / ms.my_purchases_qty END as avg_purchase_price,
                CASE WHEN ms.my_sales_qty = 0 THEN 0 ELSE ms.my_sales_ttc / ms.my_sales_qty END as avg_sell_price,
                CASE WHEN ms.my_sales_ht = 0 THEN 0 ELSE (ms.my_margin_ht / ms.my_sales_ht) * 100 END as my_margin_rate,
                
                -- Days of Stock
                CASE 
                    WHEN (ms.my_sales_ht - ms.my_margin_ht) > 0 THEN 
                        (COALESCE(lst.stock_value_ht, 0) / ((ms.my_sales_ht - ms.my_margin_ht) / GREATEST(1, ($2::date - $1::date)))) 
                    ELSE 0 
                END as my_days_of_stock
                
            FROM my_stats ms
            LEFT JOIN last_stock lst ON lst.ean13 = ms.ean13
            LEFT JOIN last_stock_prev lstp ON lstp.ean13 = ms.ean13
        ),
        
        ranked_group_stats AS (
            SELECT
                gs.*,
                -- Calculate group_rank BEFORE pagination
                RANK() OVER(ORDER BY gs.group_total_sales_qty DESC) as group_rank,
                CASE WHEN gs.group_total_sales_ht = 0 THEN 0 ELSE (gs.group_total_margin_ht / gs.group_total_sales_ht) * 100 END as group_avg_margin_rate
            FROM group_stats gs
        )

        SELECT
            rms.product_name,
            rms.ean13,
            rms.laboratory_name,
            
            -- Price Info (NEW)
            COALESCE(rms.prix_brut, 0) as prix_brut,
            COALESCE(rms.discount_pct, 0) as discount_pct,
            
            rms.my_sales_ttc,
            rms.my_sales_qty,
            rms.my_purchases_ht,
            rms.my_purchases_qty,
            rms.my_margin_ht,

            -- Calculated Prices for Sorting
            rms.avg_purchase_price,
            rms.avg_sell_price,

            -- Stock
            COALESCE(rms.stock_qty, 0) as my_stock_qty,
            COALESCE(rms.stock_value_ht, 0) as my_stock_value_ht,

            -- Days of Stock
            rms.my_days_of_stock,

            rms.my_margin_rate,
            (rms.my_sales_ttc / NULLIF(gt.my_total_sales_market, 0)) * 100 as my_pdm_pct,
            (rms.my_purchases_ht / NULLIF(gt.my_total_purchases_market, 0)) * 100 as my_pdm_purchases_pct,

            rms.my_rank,

            rgs.group_total_sales_ttc / NULLIF(pc_current.count, 0) as group_avg_sales_ttc,
            rgs.group_total_sales_qty / NULLIF(pc_current.count, 0) as group_avg_sales_qty,
            rgs.group_total_purchases_ht / NULLIF(pc_current.count, 0) as group_avg_purchases_ht,
            rgs.group_total_purchases_qty / NULLIF(pc_current.count, 0) as group_avg_purchases_qty,

            rgs.group_avg_margin_rate,
            (rgs.group_total_sales_ttc / NULLIF(gt.group_total_sales_market, 0)) * 100 as group_pdm_pct,

            rgs.group_rank,

            CASE WHEN rms.my_sales_ttc_prev = 0 THEN 0 ELSE ((rms.my_sales_ttc - rms.my_sales_ttc_prev) / rms.my_sales_ttc_prev) * 100 END as my_sales_evolution,
            CASE WHEN rgs.group_total_sales_ttc_prev = 0 THEN 0 ELSE ((rgs.group_total_sales_ttc - rgs.group_total_sales_ttc_prev) / rgs.group_total_sales_ttc_prev) * 100 END as group_sales_evolution,

            CASE WHEN rms.my_purchases_ht_prev = 0 THEN 0 ELSE ((rms.my_purchases_ht - rms.my_purchases_ht_prev) / rms.my_purchases_ht_prev) * 100 END as my_purchases_evolution,
            CASE WHEN rgs.group_total_purchases_ht_prev = 0 THEN 0 ELSE ((rgs.group_total_purchases_ht - rgs.group_total_purchases_ht_prev) / rgs.group_total_purchases_ht_prev) * 100 END as group_purchases_evolution,

            CASE WHEN rms.my_sales_qty_prev = 0 THEN 0 ELSE ((rms.my_sales_qty - rms.my_sales_qty_prev) / rms.my_sales_qty_prev) * 100 END as my_sales_qty_evolution,
            CASE WHEN rgs.group_total_sales_qty_prev = 0 THEN 0 ELSE ((rgs.group_total_sales_qty - rgs.group_total_sales_qty_prev) / rgs.group_total_sales_qty_prev) * 100 END as group_sales_qty_evolution,

            CASE WHEN rms.my_purchases_qty_prev = 0 THEN 0 ELSE ((rms.my_purchases_qty - rms.my_purchases_qty_prev) / rms.my_purchases_qty_prev) * 100 END as my_purchases_qty_evolution,
            CASE WHEN rgs.group_total_purchases_qty_prev = 0 THEN 0 ELSE ((rgs.group_total_purchases_qty - rgs.group_total_purchases_qty_prev) / rgs.group_total_purchases_qty_prev) * 100 END as group_purchases_qty_evolution,

            CASE
                WHEN (rms.my_sales_ht_prev = 0) THEN 0
                ELSE ((rms.my_margin_rate) - ((rms.my_margin_ht_prev / rms.my_sales_ht_prev) * 100))
            END as my_margin_rate_evolution,
            CASE
                WHEN (rgs.group_total_sales_ht_prev = 0) THEN 0
                ELSE ((rgs.group_avg_margin_rate) - ((rgs.group_total_margin_ht_prev / rgs.group_total_sales_ht_prev) * 100))
            END as group_margin_rate_evolution,

            ((rms.my_sales_ttc / NULLIF(gt.my_total_sales_market, 0)) * 100) - ((rms.my_sales_ttc_prev / NULLIF(gt.my_total_sales_market_prev, 0)) * 100) as my_pdm_evolution,
            ((rgs.group_total_sales_ttc / NULLIF(gt.group_total_sales_market, 0)) * 100) - ((rgs.group_total_sales_ttc_prev / NULLIF(gt.group_total_sales_market_prev, 0)) * 100) as group_pdm_evolution,

            ((rms.my_purchases_ht / NULLIF(gt.my_total_purchases_market, 0)) * 100) - ((rms.my_purchases_ht_prev / NULLIF(gt.my_total_purchases_market_prev, 0)) * 100) as my_pdm_purchases_evolution,

            CASE WHEN rms.my_margin_ht_prev = 0 THEN 0 ELSE ((rms.my_margin_ht - rms.my_margin_ht_prev) / ABS(rms.my_margin_ht_prev)) * 100 END as my_margin_ht_evolution,

             CASE 
                WHEN COALESCE(rms.stock_qty_prev, 0) = 0 THEN 0 
                ELSE ((COALESCE(rms.stock_qty, 0) - COALESCE(rms.stock_qty_prev, 0)) / COALESCE(rms.stock_qty_prev, 0)) * 100 
            END as my_stock_qty_evolution,
            
            CASE 
                WHEN COALESCE(rms.stock_value_ht_prev, 0) = 0 THEN 0 
                ELSE ((COALESCE(rms.stock_value_ht, 0) - COALESCE(rms.stock_value_ht_prev, 0)) / COALESCE(rms.stock_value_ht_prev, 0)) * 100 
            END as my_stock_value_ht_evolution,

            gt.total_rows

        FROM ranked_my_stats rms
        JOIN ranked_group_stats rgs ON rms.ean13 = rgs.ean13
        CROSS JOIN global_totals gt
        LEFT JOIN pharmacy_counts pc_current ON pc_current.period = 'CURRENT'
        ${finalOrderByClause}
        LIMIT $${limitIdx}::int OFFSET $${offsetIdx}::int
    `
};
