-- Create materialized view for latest product prices
-- This pre-calculates the latest weighted_average_price for each product
-- Refresh once per day (your data updates daily anyway)

DROP MATERIALIZED VIEW IF EXISTS mv_latest_product_prices;

CREATE MATERIALIZED VIEW mv_latest_product_prices AS
SELECT DISTINCT ON (product_id)
    product_id,
    weighted_average_price,
    date as price_date
FROM data_inventorysnapshot
WHERE weighted_average_price > 0
ORDER BY product_id, date DESC;

-- Create index on the materialized view for fast lookups
CREATE UNIQUE INDEX idx_mv_latest_prices_product 
ON mv_latest_product_prices(product_id);

-- Analyze for better query planning
ANALYZE mv_latest_product_prices;

-- Refresh command (run this daily via cron or scheduled task)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_latest_product_prices;
