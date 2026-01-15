-- 1. Cleaner
CREATE EXTENSION IF NOT EXISTS pg_trgm;
DROP MATERIALIZED VIEW IF EXISTS mv_product_stats_daily;

-- 2. Create Materialized View
CREATE MATERIALIZED VIEW mv_product_stats_daily AS
WITH
    daily_sales AS (
        SELECT
            sale_date as day,
            pharmacy_id,
            internal_product_id as product_id,
            SUM(quantity) as qty_sold,
            SUM(montant_ht) as ht_sold,
            SUM(montant_ht * (1 + COALESCE(tva_rate, 0) / 100.0)) as ttc_sold,
            SUM(montant_marge) as margin_sold
        FROM mv_sales_enriched
        GROUP BY 1, 2, 3
    ),

    daily_purchases AS (
        SELECT
            o.delivery_date as day,
            ip.pharmacy_id, -- REVERTED: No smart merge
            po.product_id,
            SUM(po.qte_r) as qty_purchased,
            SUM(po.qte_r * COALESCE(lp.weighted_average_price, 0)) as ht_purchased
        FROM data_productorder po
        JOIN data_order o ON po.order_id = o.id
        JOIN data_internalproduct ip ON po.product_id = ip.id
        LEFT JOIN mv_latest_product_prices lp ON po.product_id = lp.product_id
        WHERE o.delivery_date IS NOT NULL
          AND po.qte_r > 0
        GROUP BY 1, 2, 3
    )

SELECT
    COALESCE(s.day, p.day) as day,
    COALESCE(s.pharmacy_id, p.pharmacy_id) as pharmacy_id,
    COALESCE(s.product_id, p.product_id) as product_id,
    ip.name as product_label,
    gp.code_13_ref as ean13, -- Kept the FIX (gp.code_13_ref) because ip.code_13_ref was verified as correct column name logic in other files, preventing crash.
    COALESCE(gp.bcb_lab, 'Non défini') as laboratory_name,
    COALESCE(s.qty_sold, 0) as qty_sold,
    COALESCE(s.ht_sold, 0) as ht_sold,
    COALESCE(s.ttc_sold, 0) as ttc_sold,
    COALESCE(s.margin_sold, 0) as margin_sold,
    COALESCE(p.qty_purchased, 0) as qty_purchased,
    COALESCE(p.ht_purchased, 0) as ht_purchased
FROM daily_sales s
FULL OUTER JOIN daily_purchases p 
    ON s.day = p.day 
    AND s.pharmacy_id = p.pharmacy_id
    AND s.product_id = p.product_id
JOIN data_internalproduct ip ON COALESCE(s.product_id, p.product_id) = ip.id
LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
WITH NO DATA;

-- 3. Indexes
CREATE UNIQUE INDEX idx_mv_prod_stats_unique ON mv_product_stats_daily(pharmacy_id, day, product_id);
CREATE INDEX idx_mv_prod_stats_day ON mv_product_stats_daily(day);
CREATE INDEX idx_mv_prod_stats_pharmacy ON mv_product_stats_daily(pharmacy_id);
CREATE INDEX idx_mv_prod_stats_composite ON mv_product_stats_daily(pharmacy_id, day);
CREATE INDEX idx_mv_prod_stats_label ON mv_product_stats_daily USING gin (product_label gin_trgm_ops);
CREATE INDEX idx_mv_prod_stats_ean ON mv_product_stats_daily(ean13);
