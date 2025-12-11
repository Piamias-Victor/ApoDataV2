-- Test direct dans la DB pour débugger
-- Vérifier s'il y a des données dans data_productorder

-- 1. Compter les lignes dans data_productorder
SELECT COUNT(*) as total_orders FROM data_productorder;

-- 2. Vérifier les dates dans data_order
SELECT 
  MIN(delivery_date) as min_date,
  MAX(delivery_date) as max_date,
  COUNT(*) as total_orders
FROM data_order
WHERE delivery_date IS NOT NULL;

-- 3. Vérifier les données pour 2025
SELECT 
  COUNT(*) as count_2025,
  SUM(po.qte_r) as total_qte
FROM data_productorder po
INNER JOIN data_order o ON po.order_id = o.id
WHERE o.delivery_date >= '2025-01-01'::date 
  AND o.delivery_date <= '2025-12-31'::date
  AND o.delivery_date IS NOT NULL
  AND po.qte_r > 0;

-- 4. Vérifier avec INNER JOIN sur data_internalproduct
SELECT 
  COUNT(*) as count_with_ip,
  SUM(po.qte_r) as total_qte
FROM data_productorder po
INNER JOIN data_order o ON po.order_id = o.id
INNER JOIN data_internalproduct ip ON po.product_id = ip.id
WHERE o.delivery_date >= '2025-01-01'::date 
  AND o.delivery_date <= '2025-12-31'::date
  AND o.delivery_date IS NOT NULL
  AND po.qte_r > 0;

-- 5. Vérifier les product_id qui ne matchent pas
SELECT 
  COUNT(DISTINCT po.product_id) as products_in_orders,
  COUNT(DISTINCT ip.id) as products_in_internal
FROM data_productorder po
LEFT JOIN data_internalproduct ip ON po.product_id = ip.id
WHERE ip.id IS NULL;
