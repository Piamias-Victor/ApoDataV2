-- Refresh materialized view for latest product prices
-- Run this daily via cron job

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_latest_product_prices;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_enriched;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stock_monthly;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_stats_daily;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_lab_stats_daily;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_stats_monthly;
