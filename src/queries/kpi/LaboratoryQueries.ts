
export const LaboratoryQueries = {
    getAnalysisQueryV2: (
        conditions: string,
        searchCondition: string
    ) => `
    WITH 
        -- 1. Sales Data (From mv_sales_enriched - Daily Accuracy)
        sales_stats AS (
            SELECT 
                COALESCE(mv.laboratory_name, 'Non défini') as laboratory_name,
                
                -- My Metrics (Current)
                SUM(CASE WHEN ($5::uuid[] IS NULL OR mv.pharmacy_id = ANY($5::uuid[])) AND mv.sale_date >= $1::date AND mv.sale_date <= $2::date THEN (mv.montant_ht * (1 + COALESCE(mv.tva_rate, 0) / 100.0)) ELSE 0 END) as my_sales_ttc,
                SUM(CASE WHEN ($5::uuid[] IS NULL OR mv.pharmacy_id = ANY($5::uuid[])) AND mv.sale_date >= $1::date AND mv.sale_date <= $2::date THEN mv.quantity ELSE 0 END) as my_sales_qty,
                SUM(CASE WHEN ($5::uuid[] IS NULL OR mv.pharmacy_id = ANY($5::uuid[])) AND mv.sale_date >= $1::date AND mv.sale_date <= $2::date THEN mv.montant_marge ELSE 0 END) as my_margin_ht,
                SUM(CASE WHEN ($5::uuid[] IS NULL OR mv.pharmacy_id = ANY($5::uuid[])) AND mv.sale_date >= $1::date AND mv.sale_date <= $2::date THEN mv.montant_ht ELSE 0 END) as my_sales_ht,
                
                -- My Metrics (Previous)
                SUM(CASE WHEN ($5::uuid[] IS NULL OR mv.pharmacy_id = ANY($5::uuid[])) AND mv.sale_date >= $3::date AND mv.sale_date <= $4::date THEN (mv.montant_ht * (1 + COALESCE(mv.tva_rate, 0) / 100.0)) ELSE 0 END) as my_sales_ttc_prev,
                SUM(CASE WHEN ($5::uuid[] IS NULL OR mv.pharmacy_id = ANY($5::uuid[])) AND mv.sale_date >= $3::date AND mv.sale_date <= $4::date THEN mv.quantity ELSE 0 END) as my_sales_qty_prev,
                SUM(CASE WHEN ($5::uuid[] IS NULL OR mv.pharmacy_id = ANY($5::uuid[])) AND mv.sale_date >= $3::date AND mv.sale_date <= $4::date THEN mv.montant_marge ELSE 0 END) as my_margin_ht_prev,
                SUM(CASE WHEN ($5::uuid[] IS NULL OR mv.pharmacy_id = ANY($5::uuid[])) AND mv.sale_date >= $3::date AND mv.sale_date <= $4::date THEN mv.montant_ht ELSE 0 END) as my_sales_ht_prev,

                -- Group Metrics (Current)
                SUM(CASE WHEN mv.sale_date >= $1::date AND mv.sale_date <= $2::date THEN (mv.montant_ht * (1 + COALESCE(mv.tva_rate, 0) / 100.0)) ELSE 0 END) as group_sales_ttc,
                SUM(CASE WHEN mv.sale_date >= $1::date AND mv.sale_date <= $2::date THEN mv.quantity ELSE 0 END) as group_sales_qty,
                SUM(CASE WHEN mv.sale_date >= $1::date AND mv.sale_date <= $2::date THEN mv.montant_marge ELSE 0 END) as group_margin_ht,
                SUM(CASE WHEN mv.sale_date >= $1::date AND mv.sale_date <= $2::date THEN mv.montant_ht ELSE 0 END) as group_sales_ht,

                -- Group Metrics (Previous)
                SUM(CASE WHEN mv.sale_date >= $3::date AND mv.sale_date <= $4::date THEN (mv.montant_ht * (1 + COALESCE(mv.tva_rate, 0) / 100.0)) ELSE 0 END) as group_sales_ttc_prev,
                SUM(CASE WHEN mv.sale_date >= $3::date AND mv.sale_date <= $4::date THEN mv.quantity ELSE 0 END) as group_sales_qty_prev,
                SUM(CASE WHEN mv.sale_date >= $3::date AND mv.sale_date <= $4::date THEN mv.montant_marge ELSE 0 END) as group_margin_ht_prev,
                SUM(CASE WHEN mv.sale_date >= $3::date AND mv.sale_date <= $4::date THEN mv.montant_ht ELSE 0 END) as group_sales_ht_prev

            FROM mv_sales_enriched mv
            -- FIX: Join gp so we can filter by gp.bcb_family
            LEFT JOIN data_globalproduct gp ON mv.code_13_ref = gp.code_13_ref
            -- Hack: We alias the table as 'source', and project 'ean13' for the WHERE clause.
            CROSS JOIN LATERAL (
                SELECT mv.code_13_ref as ean13
            ) aliases
            WHERE (
                (mv.sale_date >= $1::date AND mv.sale_date <= $2::date) 
                OR (mv.sale_date >= $3::date AND mv.sale_date <= $4::date)
            )
            -- Apply Filters. Note: The condition string uses 'mv.ean13', 'mv.laboratory_name', 'mv.pharmacy_id'.
            -- mv_sales_enriched has 'laboratory_name' and 'pharmacy_id'.
            -- It does NOT have 'ean13' directly (it has code_13_ref).
            -- We need to ensure the condition string is compatible or wrap it.
            -- Since we can't easily change the injected string here, let's wrap the FROM.
            -- Actually, simpler: define 'mv' as a subquery with correct aliases.
            AND 1=1
            ${conditions.replace(/mv\.ean13/g, 'mv.code_13_ref')} 
            ${searchCondition.replace(/mv\.product_label/g, 'mv.product_name').replace(/mv\.ean13/g, 'mv.code_13_ref')}
            GROUP BY 1
        ),

        -- 2. Purchases Data (From data_productorder - Exact Transactions)
        purchases_stats AS (
            SELECT
                COALESCE(gp.bcb_lab, 'Non défini') as laboratory_name,

                -- My Metrics (Current)
                SUM(CASE WHEN ($5::uuid[] IS NULL OR o.pharmacy_id = ANY($5::uuid[])) AND o.delivery_date >= $1::date AND o.delivery_date <= $2::date THEN (po.qte_r * COALESCE(lp.weighted_average_price, 0)) ELSE 0 END) as my_purchases_ht,
                SUM(CASE WHEN ($5::uuid[] IS NULL OR o.pharmacy_id = ANY($5::uuid[])) AND o.delivery_date >= $1::date AND o.delivery_date <= $2::date THEN po.qte_r ELSE 0 END) as my_purchases_qty,
                
                -- My Metrics (Previous)
                SUM(CASE WHEN ($5::uuid[] IS NULL OR o.pharmacy_id = ANY($5::uuid[])) AND o.delivery_date >= $3::date AND o.delivery_date <= $4::date THEN (po.qte_r * COALESCE(lp.weighted_average_price, 0)) ELSE 0 END) as my_purchases_ht_prev,
                SUM(CASE WHEN ($5::uuid[] IS NULL OR o.pharmacy_id = ANY($5::uuid[])) AND o.delivery_date >= $3::date AND o.delivery_date <= $4::date THEN po.qte_r ELSE 0 END) as my_purchases_qty_prev,

                -- Group Metrics (Current)
                SUM(CASE WHEN o.delivery_date >= $1::date AND o.delivery_date <= $2::date THEN (po.qte_r * COALESCE(lp.weighted_average_price, 0)) ELSE 0 END) as group_purchases_ht,
                SUM(CASE WHEN o.delivery_date >= $1::date AND o.delivery_date <= $2::date THEN po.qte_r ELSE 0 END) as group_purchases_qty,

                -- Group Metrics (Previous)
                SUM(CASE WHEN o.delivery_date >= $3::date AND o.delivery_date <= $4::date THEN (po.qte_r * COALESCE(lp.weighted_average_price, 0)) ELSE 0 END) as group_purchases_ht_prev,
                SUM(CASE WHEN o.delivery_date >= $3::date AND o.delivery_date <= $4::date THEN po.qte_r ELSE 0 END) as group_purchases_qty_prev

            FROM data_productorder po
            INNER JOIN data_order o ON po.order_id = o.id
            INNER JOIN data_internalproduct ip ON po.product_id = ip.id
            LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
            LEFT JOIN mv_latest_product_prices lp ON po.product_id = lp.product_id
            
            -- Alias for condition compatibility
            CROSS JOIN LATERAL (
                SELECT 
                    gp.bcb_lab as laboratory_name, 
                    ip.code_13_ref_id as ean13, 
                    o.pharmacy_id as pharmacy_id
            ) mv

            WHERE (
                (o.delivery_date >= $1::date AND o.delivery_date <= $2::date) 
                OR (o.delivery_date >= $3::date AND o.delivery_date <= $4::date)
            )
            AND po.qte_r > 0
            ${conditions} -- Uses 'mv.laboratory_name', 'mv.ean13', 'mv.pharmacy_id' mapped via CROSS JOIN LATERAL
            ${searchCondition.replace(/mv\.product_label/g, 'ip.name')} -- Map product label to ip.name
            GROUP BY 1
        ),

        -- 3. Stock (Snapshot can remain on MV for performance, or use Stock raw query. Keeping MV for now as Stock is usually monthly snapshot or live)
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
                    code_13_ref as ean13, -- Alias
                    pharmacy_id
                FROM mv_stock_monthly
                WHERE month_end_date <= $2::date 
                  AND ($5::uuid[] IS NULL OR pharmacy_id = ANY($5::uuid[]))
                ORDER BY product_id, month_end_date DESC
            ) mv
            -- FIX: Join gp so we can filter by gp.bcb_family
            LEFT JOIN data_globalproduct gp ON mv.ean13 = gp.code_13_ref
            WHERE 1=1 
            -- Re-inject conditions? Risky if aliases differ. 
            -- Provide minimal filtering or ensure alias match.
            -- The original query injected conditions here.
            ${conditions}
            GROUP BY 1
        ),
        
        last_stock_prev AS (
             SELECT 
                mv.laboratory_name,
                SUM(mv.stock) as stock_qty,
                SUM(mv.stock_value_ht) as stock_value_ht
            FROM (
                SELECT DISTINCT ON (product_id) 
                    laboratory_name,
                    stock,
                    stock_value_ht,
                    code_13_ref as ean13,
                    pharmacy_id
                FROM mv_stock_monthly
                WHERE month_end_date <= $4::date
                  AND ($5::uuid[] IS NULL OR pharmacy_id = ANY($5::uuid[]))
                ORDER BY product_id, month_end_date DESC
            ) mv
            -- FIX: Join gp so we can filter by gp.bcb_family
            LEFT JOIN data_globalproduct gp ON mv.ean13 = gp.code_13_ref
            WHERE 1=1
            ${conditions}
            GROUP BY 1
        ),

        -- 4. Combine
        lab_stats_combined AS (
            SELECT 
                COALESCE(s.laboratory_name, p.laboratory_name) as laboratory_name,
                
                COALESCE(s.my_sales_ttc, 0) as my_sales_ttc,
                COALESCE(s.my_sales_qty, 0) as my_sales_qty,
                COALESCE(s.my_margin_ht, 0) as my_margin_ht,
                COALESCE(s.my_sales_ht, 0) as my_sales_ht,
                
                COALESCE(p.my_purchases_ht, 0) as my_purchases_ht,
                COALESCE(p.my_purchases_qty, 0) as my_purchases_qty,

                COALESCE(s.my_sales_ttc_prev, 0) as my_sales_ttc_prev,
                COALESCE(s.my_sales_qty_prev, 0) as my_sales_qty_prev,
                COALESCE(s.my_margin_ht_prev, 0) as my_margin_ht_prev,
                COALESCE(s.my_sales_ht_prev, 0) as my_sales_ht_prev,
                
                COALESCE(p.my_purchases_ht_prev, 0) as my_purchases_ht_prev,
                COALESCE(p.my_purchases_qty_prev, 0) as my_purchases_qty_prev,

                -- Group
                COALESCE(s.group_sales_ttc, 0) as group_total_sales_ttc,
                COALESCE(s.group_sales_qty, 0) as group_total_sales_qty,
                COALESCE(s.group_margin_ht, 0) as group_total_margin_ht,
                COALESCE(s.group_sales_ht, 0) as group_total_sales_ht,
                
                COALESCE(p.group_purchases_ht, 0) as group_total_purchases_ht,
                COALESCE(p.group_purchases_qty, 0) as group_total_purchases_qty,

                COALESCE(s.group_sales_ttc_prev, 0) as group_total_sales_ttc_prev,
                COALESCE(s.group_sales_qty_prev, 0) as group_total_sales_qty_prev,
                COALESCE(s.group_margin_ht_prev, 0) as group_total_margin_ht_prev,
                COALESCE(s.group_sales_ht_prev, 0) as group_total_sales_ht_prev,
                
                COALESCE(p.group_purchases_ht_prev, 0) as group_total_purchases_ht_prev,
                COALESCE(p.group_purchases_qty_prev, 0) as group_total_purchases_qty_prev

            FROM sales_stats s
            FULL OUTER JOIN purchases_stats p ON s.laboratory_name = p.laboratory_name
        ),

        pharmacy_counts AS (
            -- Approximation: For pure accuracy we'd query distinct pharmacies from raw data too, 
            -- but the original query used MV. Let's stick to MV for pharmacy counts to save perf,
            -- unless distinct count is critical. 
            -- The error was with AMOUNTS, not counts.
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
        
        global_totals AS (
            SELECT
                SUM(my_sales_ttc) as my_total_sales_market,
                SUM(my_purchases_ht) as my_total_purchases_market,
                SUM(group_total_sales_ttc) as group_total_sales_market,
                
                SUM(my_sales_ttc_prev) as my_total_sales_market_prev,
                SUM(my_purchases_ht_prev) as my_total_purchases_market_prev,
                SUM(group_total_sales_ttc_prev) as group_total_sales_market_prev
            FROM lab_stats_combined
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
        CASE WHEN ls.my_sales_ttc_prev = 0 THEN 0 ELSE ((ls.my_sales_ttc - ls.my_sales_ttc_prev) / ls.my_sales_ttc_prev::numeric) * 100 END as my_sales_evolution,
        CASE WHEN ls.group_total_sales_ttc_prev = 0 THEN 0 ELSE ((ls.group_total_sales_ttc - ls.group_total_sales_ttc_prev) / ls.group_total_sales_ttc_prev::numeric) * 100 END as group_sales_evolution,

        CASE WHEN ls.my_purchases_ht_prev = 0 THEN 0 ELSE ((ls.my_purchases_ht - ls.my_purchases_ht_prev) / ls.my_purchases_ht_prev::numeric) * 100 END as my_purchases_evolution,
        CASE WHEN ls.group_total_purchases_ht_prev = 0 THEN 0 ELSE ((ls.group_total_purchases_ht - ls.group_total_purchases_ht_prev) / ls.group_total_purchases_ht_prev::numeric) * 100 END as group_purchases_evolution,

        CASE WHEN ls.my_sales_qty_prev = 0 THEN 0 ELSE ((ls.my_sales_qty - ls.my_sales_qty_prev) / ls.my_sales_qty_prev::numeric) * 100 END as my_sales_qty_evolution,
        CASE WHEN ls.group_total_sales_qty_prev = 0 THEN 0 ELSE ((ls.group_total_sales_qty - ls.group_total_sales_qty_prev) / ls.group_total_sales_qty_prev::numeric) * 100 END as group_sales_qty_evolution,

        CASE WHEN ls.my_purchases_qty_prev = 0 THEN 0 ELSE ((ls.my_purchases_qty - ls.my_purchases_qty_prev) / ls.my_purchases_qty_prev::numeric) * 100 END as my_purchases_qty_evolution,
        CASE WHEN ls.group_total_purchases_qty_prev = 0 THEN 0 ELSE ((ls.group_total_purchases_qty - ls.group_total_purchases_qty_prev) / ls.group_total_purchases_qty_prev::numeric) * 100 END as group_purchases_qty_evolution,

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
        CASE 
            WHEN COALESCE(lstp.stock_qty, 0) = 0 THEN 0 
            ELSE ((COALESCE(lst.stock_qty, 0) - COALESCE(lstp.stock_qty, 0)) / COALESCE(lstp.stock_qty, 0)) * 100 
        END as my_stock_qty_evolution,
        
        CASE 
            WHEN COALESCE(lstp.stock_value_ht, 0) = 0 THEN 0 
            ELSE ((COALESCE(lst.stock_value_ht, 0) - COALESCE(lstp.stock_value_ht, 0)) / COALESCE(lstp.stock_value_ht, 0)) * 100 
        END as my_stock_value_evolution

    FROM lab_stats_combined ls
    LEFT JOIN last_stock lst ON lst.laboratory_name = ls.laboratory_name
    LEFT JOIN last_stock_prev lstp ON lstp.laboratory_name = ls.laboratory_name
    CROSS JOIN global_totals gt
    LEFT JOIN pharmacy_counts pc_current ON pc_current.period = 'CURRENT'
    ORDER BY ls.my_sales_ttc DESC
    `
};
