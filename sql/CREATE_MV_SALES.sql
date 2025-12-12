-- 1. Supprimer la VM existante
DROP MATERIALIZED VIEW IF EXISTS mv_sales_enriched;

-- 2. Créer la Vue Matérialisée enrichie avec la Marge
CREATE MATERIALIZED VIEW mv_sales_enriched AS
SELECT
    s.id AS sale_id,
    s.date AS sale_date,
    s.quantity,
    
    -- IDs pour les relations
    inv.product_id AS internal_product_id,
    ip.pharmacy_id,
    gp.code_13_ref,

    -- Calculs pré-traités (Montant HT)
    -- Formule : Quantité * (Prix TTC / (1 + TVA/100))
    CAST(
        s.quantity * (
            s.unit_price_ttc / NULLIF((1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0), 0)
        ) AS DECIMAL(15,2)
    ) AS montant_ht,

    -- Calcul pré-traité (Marge HT)
    -- Formule : Ventes HT - (Quantité * PAMP)
    -- PAMP = inv.weighted_average_price
    CAST(
        (s.quantity * (
            s.unit_price_ttc / NULLIF((1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0), 0)
        )) - (s.quantity * COALESCE(inv.weighted_average_price, 0))
    AS DECIMAL(15,2)) AS montant_marge,

    -- Colonnes de filtrage dénormalisées
    gp.bcb_lab AS laboratory_name,
    gp.bcb_segment_l1 AS category_name,
    COALESCE(gp.tva_percentage, gp.bcb_tva_rate) AS tva_rate,
    gp.is_reimbursable,
    gp.bcb_generic_status

FROM data_sales s
    -- Chemin de jointure
    INNER JOIN data_inventorysnapshot inv ON s.product_id = inv.id
    INNER JOIN data_internalproduct ip ON inv.product_id = ip.id
    LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref;

-- 3. Créer les indexes
CREATE INDEX idx_mv_sales_date ON mv_sales_enriched(sale_date);
CREATE INDEX idx_mv_sales_composite ON mv_sales_enriched(sale_date, pharmacy_id, laboratory_name);
