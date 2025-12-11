-- Refresh materialized view for latest product prices
-- Run this daily via cron job

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_latest_product_prices;
