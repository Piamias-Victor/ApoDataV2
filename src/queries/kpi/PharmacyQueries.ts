
export const PharmacyQueries = {
    getAnalysisQuery: (
        conditions: string,
        searchCondition: string
    ) => `
    WITH 
        -- 1. Calculate Market Totals (Group) to compute PDM
        market_stats AS (
             SELECT
                -- Current Period Market
                SUM(CASE WHEN month >= $1::date AND month <= $2::date THEN ttc_sold ELSE 0 END) as market_sales_ttc,
                SUM(CASE WHEN month >= $1::date AND month <= $2::date THEN ht_purchased ELSE 0 END) as market_purchases_ht,
                
                -- Previous Period Market
                SUM(CASE WHEN month >= $3::date AND month <= $4::date THEN ttc_sold ELSE 0 END) as market_sales_ttc_prev,
                SUM(CASE WHEN month >= $3::date AND month <= $4::date THEN ht_purchased ELSE 0 END) as market_purchases_ht_prev
            FROM mv_product_stats_monthly mv
            WHERE (month >= $1::date AND month <= $2::date) 
               OR (month >= $3::date AND month <= $4::date)
        ),

        -- 2. Pharmacy Stats (Current & Previous)
        pharmacy_stats_raw AS (
            SELECT 
                mv.pharmacy_id,
                
                -- Sales TTC
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.ttc_sold ELSE 0 END) as sales_ttc,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.ttc_sold ELSE 0 END) as sales_ttc_prev,

                -- Sales Qty
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.qty_sold ELSE 0 END) as sales_qty,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.qty_sold ELSE 0 END) as sales_qty_prev,

                -- Sales HT (for Margin calculation)
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.ht_sold ELSE 0 END) as sales_ht,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.ht_sold ELSE 0 END) as sales_ht_prev,

                -- Margin HT
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.margin_sold ELSE 0 END) as margin_ht,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.margin_sold ELSE 0 END) as margin_ht_prev,

                -- Purchases HT
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.ht_purchased ELSE 0 END) as purchases_ht,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.ht_purchased ELSE 0 END) as purchases_ht_prev,

                -- Purchases Qty
                SUM(CASE WHEN mv.month >= $1::date AND mv.month <= $2::date THEN mv.qty_purchased ELSE 0 END) as purchases_qty,
                SUM(CASE WHEN mv.month >= $3::date AND mv.month <= $4::date THEN mv.qty_purchased ELSE 0 END) as purchases_qty_prev

            FROM mv_product_stats_monthly mv
            -- Join with Pharmacy to enable search by name if needed, though usually filters are applied via conditions
            JOIN data_pharmacy p ON p.id = mv.pharmacy_id
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

        -- 3. Stock Snapshot (Current Period End)
        current_stock AS (
            SELECT 
                mv.pharmacy_id,
                SUM(mv.stock) as stock_qty,
                SUM(mv.stock_value_ht) as stock_value_ht
            FROM (
                SELECT DISTINCT ON (product_id, pharmacy_id) 
                    pharmacy_id,
                    stock,
                    stock_value_ht,
                    month_end_date,
                    -- Filter Columns (must match aliases expected by conditions)
                    laboratory_name,
                    code_13_ref as ean13,
                    category_name
                FROM mv_stock_monthly
                WHERE month_end_date <= $2::date
                ORDER BY product_id, pharmacy_id, month_end_date DESC
            ) mv
            WHERE 1=1
            ${conditions} -- Filter the snapshot by global conditions (Lab, Product, etc)
            GROUP BY 1
        ),
        
        -- 4. Stock Snapshot (Previous Period End)
        prev_stock AS (
             SELECT 
                mv.pharmacy_id,
                SUM(mv.stock) as stock_qty,
                SUM(mv.stock_value_ht) as stock_value_ht
            FROM (
                SELECT DISTINCT ON (product_id, pharmacy_id) 
                    pharmacy_id,
                    stock,
                    stock_value_ht,
                    month_end_date,
                    -- Filter Columns
                    laboratory_name,
                    code_13_ref as ean13,
                    category_name
                FROM mv_stock_monthly
                WHERE month_end_date <= $4::date
                ORDER BY product_id, pharmacy_id, month_end_date DESC
            ) mv
            WHERE 1=1
            ${conditions}
            GROUP BY 1
        )

    SELECT 
        p.name as pharmacy_name,
        p.id as pharmacy_id,
        p.address as pharmacy_city,
        p.area as pharmacy_region,

        -- METRICS CURRENT
        ps.sales_ttc,
        ps.sales_qty,
        ps.purchases_ht,
        ps.purchases_qty,
        ps.margin_ht,
        
        -- Sales PDM
        (ps.sales_ttc / NULLIF(ms.market_sales_ttc, 0)) * 100 as pdm_sales_pct,
        -- Purchases PDM
        (ps.purchases_ht / NULLIF(ms.market_purchases_ht, 0)) * 100 as pdm_purchases_pct,
        
        -- Margin Rate
        CASE WHEN ps.sales_ht = 0 THEN 0 ELSE (ps.margin_ht / ps.sales_ht) * 100 END as margin_rate,

        -- STOCK
        COALESCE(cs.stock_qty, 0) as stock_qty,
        COALESCE(cs.stock_value_ht, 0) as stock_value_ht,

        -- Days of Stock (Stock Value / (Sales HT - Margin) per day)
        CASE 
            WHEN (ps.sales_ht - ps.margin_ht) > 0 THEN 
                (COALESCE(cs.stock_value_ht, 0) / ((ps.sales_ht - ps.margin_ht) / GREATEST(1, ($2::date - $1::date)))) 
            ELSE 0 
        END as days_of_stock,

        -- EVOLUTIONS (N vs N-1)
        CASE WHEN ps.sales_ttc_prev = 0 THEN 0 ELSE ((ps.sales_ttc - ps.sales_ttc_prev) / ps.sales_ttc_prev) * 100 END as sales_evolution,
        CASE WHEN ps.sales_qty_prev = 0 THEN 0 ELSE ((ps.sales_qty - ps.sales_qty_prev) / ps.sales_qty_prev) * 100 END as sales_qty_evolution,
        
        CASE WHEN ps.purchases_ht_prev = 0 THEN 0 ELSE ((ps.purchases_ht - ps.purchases_ht_prev) / ps.purchases_ht_prev) * 100 END as purchases_evolution,
        CASE WHEN ps.purchases_qty_prev = 0 THEN 0 ELSE ((ps.purchases_qty - ps.purchases_qty_prev) / ps.purchases_qty_prev) * 100 END as purchases_qty_evolution,

        CASE WHEN ps.margin_ht_prev = 0 THEN 0 ELSE ((ps.margin_ht - ps.margin_ht_prev) / ABS(ps.margin_ht_prev)) * 100 END as margin_ht_evolution,

        CASE
            WHEN (ps.sales_ht_prev = 0) THEN 0
            ELSE ((CASE WHEN ps.sales_ht = 0 THEN 0 ELSE (ps.margin_ht / ps.sales_ht) * 100 END) - ((ps.margin_ht_prev / ps.sales_ht_prev) * 100))
        END as margin_rate_evolution,
        
        -- PDM Evolution
        ((ps.sales_ttc / NULLIF(ms.market_sales_ttc, 0)) * 100) - ((ps.sales_ttc_prev / NULLIF(ms.market_sales_ttc_prev, 0)) * 100) as pdm_sales_evolution,
        
        -- Stock Evolution
        CASE 
            WHEN COALESCE(ps_prev.stock_value_ht, 0) = 0 THEN 0 
            ELSE ((COALESCE(cs.stock_value_ht, 0) - COALESCE(ps_prev.stock_value_ht, 0)) / COALESCE(ps_prev.stock_value_ht, 0)) * 100 
        END as stock_value_evolution,
         CASE 
            WHEN COALESCE(ps_prev.stock_qty, 0) = 0 THEN 0 
            ELSE ((COALESCE(cs.stock_qty, 0) - COALESCE(ps_prev.stock_qty, 0)) / COALESCE(ps_prev.stock_qty, 0)) * 100 
        END as stock_qty_evolution,


        -- RANK (Dynamic based on Filtered Dataset)
        RANK() OVER(ORDER BY ps.sales_ttc DESC) as rank

    FROM pharmacy_stats_raw ps
    JOIN data_pharmacy p ON p.id = ps.pharmacy_id
    CROSS JOIN market_stats ms
    LEFT JOIN current_stock cs ON cs.pharmacy_id = ps.pharmacy_id
    LEFT JOIN prev_stock ps_prev ON ps_prev.pharmacy_id = ps.pharmacy_id
    ORDER BY ps.sales_ttc DESC
    `,

    getMonthlyStats: (conditions: string) => `
        SELECT 
            p.id as pharmacy_id,
            p.name as pharmacy_name,
            CAST(EXTRACT(MONTH FROM mv.month) AS INTEGER) as month_num,
            CAST(EXTRACT(YEAR FROM mv.month) AS INTEGER) as year_num,
            
            COALESCE(SUM(mv.ht_sold), 0) as sales_ht,
            COALESCE(SUM(mv.ttc_sold), 0) as sales_ttc,
            COALESCE(SUM(mv.qty_sold), 0) as sales_qty,
            COALESCE(SUM(mv.ht_purchased), 0) as purchases_ht,
            COALESCE(SUM(mv.qty_purchased), 0) as purchases_qty,
            COALESCE(SUM(mv.margin_sold), 0) as margin_ht

        FROM mv_product_stats_monthly mv
        JOIN data_pharmacy p ON p.id = mv.pharmacy_id
        LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
        WHERE 
            (EXTRACT(YEAR FROM mv.month) = $1::int OR EXTRACT(YEAR FROM mv.month) = $2::int)
            ${conditions}
        GROUP BY 1, 2, 3, 4
        ORDER BY p.name ASC, year_num DESC, month_num ASC
    `
};
