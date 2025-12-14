-- 1. Create Materialized View (Granularity: MONTH / PHARMACY / EAN13)
-- Merges Daily stats into Monthly stats, grouping by EAN13 to consolidate variations.

DROP MATERIALIZED VIEW IF EXISTS mv_product_stats_monthly;

CREATE MATERIALIZED VIEW mv_product_stats_monthly AS
SELECT
    DATE_TRUNC('month', day)::date as month,
    pharmacy_id,
    
    -- CORE GROUPING: EAN13
    -- If EAN is null, we fallback to product_label to try and group reasonably, 
    -- or we accept NULL groupings. For Pharma, EAN is solid.
    -- Let's use COALESCE to avoid dropping NULL EANs if any.
    COALESCE(ean13, 'NO-EAN') as ean13,
    
    -- Metadata (Representative)
    MAX(product_label) as product_label,
    MAX(laboratory_name) as laboratory_name,
    -- We keep a reference generic product_id just in case, but it's arbitrary
    MAX(product_id::text)::uuid as product_id,
    
    -- Aggregated Metrics
    SUM(qty_sold) as qty_sold,
    SUM(ht_sold) as ht_sold,
    SUM(ttc_sold) as ttc_sold,
    SUM(margin_sold) as margin_sold,
    SUM(qty_purchased) as qty_purchased,
    SUM(ht_purchased) as ht_purchased

FROM mv_product_stats_daily
GROUP BY 1, 2, 3
WITH NO DATA;

-- 2. Indexes
CREATE UNIQUE INDEX idx_mv_prod_stats_monthly_unique ON mv_product_stats_monthly(pharmacy_id, month, ean13);
CREATE INDEX idx_mv_prod_stats_monthly_month ON mv_product_stats_monthly(month);
CREATE INDEX idx_mv_prod_stats_monthly_ean ON mv_product_stats_monthly(ean13);
CREATE INDEX idx_mv_prod_stats_monthly_comp ON mv_product_stats_monthly(pharmacy_id, month);

-- Text Search Index for Name/EAN/Lab
CREATE INDEX idx_mv_prod_stats_monthly_search ON mv_product_stats_monthly USING gin (product_label gin_trgm_ops);

-- Populate the view now
REFRESH MATERIALIZED VIEW mv_product_stats_monthly;
