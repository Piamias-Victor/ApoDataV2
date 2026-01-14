-- 1. Supprimer la VM existante si elle existe
DROP MATERIALIZED VIEW IF EXISTS mv_stock_monthly;

-- 2. Créer la Vue Matérialisée Stock Fin de Mois
-- Elle ne garde que le DERNIER snapshot de chaque mois pour chaque produit
CREATE MATERIALIZED VIEW mv_stock_monthly AS
WITH RankedSnapshots AS (
    SELECT
        inv.product_id, -- On garde l'ID technique pour les jointures, mais ce n'est plus la clé de dédoublonnage
        ip.pharmacy_id,
        ip.code_13_ref_id as code_13_ref,
        inv.date,
        inv.stock,
        inv.weighted_average_price,
        -- C'EST ICI QUE TOUT SE JOUE : 
        -- On ne regarde plus l'ID technique (qui double), mais le couple (Pharmacie + Code CIP)
        -- On ne garde que la DERNIERE photo du mois pour ce CIP dans cette Pharmacie.
        ROW_NUMBER() OVER (
            PARTITION BY ip.pharmacy_id, ip.code_13_ref_id, DATE_TRUNC('month', inv.date) 
            ORDER BY inv.date DESC
        ) as rn,
        -- On définit la date de fin de mois (ex: 2025-10-31)
        CAST(DATE_TRUNC('month', inv.date) AS DATE) + INTERVAL '1 month' - INTERVAL '1 day' as month_end_date
    FROM data_inventorysnapshot inv
    JOIN data_internalproduct ip ON inv.product_id = ip.id
)
SELECT
    rs.product_id, -- ID du "gagnant" (le snapshot retenu)
    rs.month_end_date,
    rs.stock,
    -- Calcul Valeur HT
    CAST(rs.stock * COALESCE(rs.weighted_average_price, 0) AS DECIMAL(15,2)) as stock_value_ht,
    rs.pharmacy_id,
    rs.code_13_ref,
    
    -- Colonnes filtres (enrichissement)
    gp.bcb_lab AS laboratory_name,
    gp.bcb_segment_l1 AS category_name,
    gp.is_reimbursable,
    gp.bcb_generic_status

FROM RankedSnapshots rs
    LEFT JOIN data_globalproduct gp ON rs.code_13_ref = gp.code_13_ref
    -- On garde uniquement le champion du mois pour ce CIP
WHERE rs.rn = 1;

-- 3. Créer les indexes
CREATE INDEX idx_mv_stock_date ON mv_stock_monthly(month_end_date);
CREATE INDEX idx_mv_stock_composite ON mv_stock_monthly(month_end_date, pharmacy_id);

-- 4. Index Unique requis pour REFRESH CONCURRENTLY
CREATE UNIQUE INDEX idx_mv_stock_monthly_unique ON mv_stock_monthly(product_id, month_end_date);
