-- 1. Supprimer la VM existante si elle existe
DROP MATERIALIZED VIEW IF EXISTS mv_stock_monthly;

-- 2. Créer la Vue Matérialisée Stock Fin de Mois
-- Elle ne garde que le DERNIER snapshot de chaque mois pour chaque produit
CREATE MATERIALIZED VIEW mv_stock_monthly AS
WITH MonthlyRanked AS (
    SELECT
        inv.product_id,
        inv.date,
        inv.stock,
        inv.weighted_average_price,
        -- Identifier le dernier snapshot du mois
        ROW_NUMBER() OVER (
            PARTITION BY inv.product_id, DATE_TRUNC('month', inv.date) 
            ORDER BY inv.date DESC
        ) as rn,
        -- Créer une colonne clé "2024-01-01" pour le mois de Janvier
        CAST(DATE_TRUNC('month', inv.date) AS DATE) + INTERVAL '1 month' - INTERVAL '1 day' as month_end_date
    FROM data_inventorysnapshot inv
)
SELECT
    mr.product_id,
    mr.month_end_date,
    mr.stock,
    -- Calcul Valeur HT = Stock * PAMP
    CAST(mr.stock * COALESCE(mr.weighted_average_price, 0) AS DECIMAL(15,2)) as stock_value_ht,
    
    -- IDs pour relations
    ip.pharmacy_id,
    gp.code_13_ref,
    
    -- Colonnes filtres
    gp.bcb_lab AS laboratory_name,
    gp.bcb_segment_l1 AS category_name,
    gp.is_reimbursable,
    gp.bcb_generic_status

FROM MonthlyRanked mr
    INNER JOIN data_internalproduct ip ON mr.product_id = ip.id
    LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
WHERE mr.rn = 1; -- On garde uniquement le DERNIER snapshot du mois

-- 3. Créer les indexes
CREATE INDEX idx_mv_stock_date ON mv_stock_monthly(month_end_date);
CREATE INDEX idx_mv_stock_composite ON mv_stock_monthly(month_end_date, pharmacy_id);

-- 4. Index Unique requis pour REFRESH CONCURRENTLY
CREATE UNIQUE INDEX idx_mv_stock_monthly_unique ON mv_stock_monthly(product_id, month_end_date);
