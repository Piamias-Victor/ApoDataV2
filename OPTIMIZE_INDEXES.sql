-- SQL Optimization for Achats KPI
-- Create indexes for better performance

-- Index on delivery_date for faster date range queries
CREATE INDEX IF NOT EXISTS idx_order_delivery_date 
ON data_order(delivery_date) 
WHERE delivery_date IS NOT NULL;

-- Index on product_id for faster joins
CREATE INDEX IF NOT EXISTS idx_productorder_product_id 
ON data_productorder(product_id);

-- Index on order_id for faster joins
CREATE INDEX IF NOT EXISTS idx_productorder_order_id 
ON data_productorder(order_id);

-- Composite index for inventory snapshots (product + date DESC)
CREATE INDEX IF NOT EXISTS idx_inventorysnapshot_product_date 
ON data_inventorysnapshot(product_id, date DESC) 
WHERE weighted_average_price > 0;

-- Index on code_13_ref_id for product filtering
CREATE INDEX IF NOT EXISTS idx_internalproduct_code_ref 
ON data_internalproduct(code_13_ref_id);

-- Index on pharmacy_id for pharmacy filtering
CREATE INDEX IF NOT EXISTS idx_internalproduct_pharmacy 
ON data_internalproduct(pharmacy_id);

-- Analyze tables to update statistics
ANALYZE data_order;
ANALYZE data_productorder;
ANALYZE data_internalproduct;
ANALYZE data_inventorysnapshot;
