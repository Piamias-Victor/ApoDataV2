-- Create materialized view for latest product prices
-- This pre-calculates the latest weighted_average_price for each product
-- Refresh once per day (your data updates daily anyway)

DROP MATERIALIZED VIEW IF EXISTS mv_latest_product_prices;

CREATE MATERIALIZED VIEW mv_latest_product_prices AS
SELECT DISTINCT ON (dis.product_id)
    dis.product_id,
    dis.weighted_average_price,
    dis.price_with_tax,
    dis.date as price_date,
    -- Discount Calculation: (Fabricant - WeightedAvg) / Fabricant * 100
    CASE 
        WHEN gp.prix_achat_ht_fabricant > 0 THEN 
            GREATEST(0, ((gp.prix_achat_ht_fabricant - dis.weighted_average_price) / gp.prix_achat_ht_fabricant) * 100)
        ELSE 0 
    END as discount_percentage,

    -- Sell Price HT Calculation: SellPriceTTC / (1 + VAT/100)
    (dis.price_with_tax / NULLIF((1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0), 0)) as sell_price_ht,

    -- Margin Percentage Calculation: (SellPriceHT - WeightedAvg) / SellPriceHT * 100
    CASE 
        WHEN (dis.price_with_tax / NULLIF((1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0), 0)) > 0 THEN 
            GREATEST(0, (
                ((dis.price_with_tax / NULLIF((1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0), 0)) - dis.weighted_average_price) 
                / (dis.price_with_tax / NULLIF((1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0), 0))
            ) * 100)
        ELSE 0 
    END as margin_percentage
FROM data_inventorysnapshot dis
JOIN data_internalproduct ip ON dis.product_id = ip.id
LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
WHERE dis.weighted_average_price > 0
ORDER BY dis.product_id, dis.date DESC;

-- Create index on the materialized view for fast lookups
CREATE UNIQUE INDEX idx_mv_latest_prices_product 
ON mv_latest_product_prices(product_id);

-- Analyze for better query planning
ANALYZE mv_latest_product_prices;

-- Refresh command (run this daily via cron or scheduled task)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_latest_product_prices;
