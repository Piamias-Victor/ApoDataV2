-- 1. Supprimer la VM existante si elle existe
DROP MATERIALIZED VIEW IF EXISTS mv_lab_stats_daily;

-- 2. Créer la Vue Matérialisée (Granularité : JOUR / PHARMACIE / LABO)
-- Cette granularité permet de requêter n'importe quelle période (ex: 1er au 15 fév) avec une performance maximale.
CREATE MATERIALIZED VIEW mv_lab_stats_daily AS
WITH
    -- A. Agrégation des Ventes par Jour
    daily_sales AS (
        SELECT
            sale_date as day,
            pharmacy_id,
            COALESCE(laboratory_name, 'Non défini') as laboratory_name,
            SUM(quantity) as qty_sold,
            SUM(montant_ht) as ht_sold,
            -- Calcul TTC : HT * (1 + TVA)
            SUM(montant_ht * (1 + COALESCE(tva_rate, 0) / 100.0)) as ttc_sold,
            SUM(montant_marge) as margin_sold
        FROM mv_sales_enriched
        GROUP BY 1, 2, 3
    ),

    -- B. Agrégation des Achats par Jour
    daily_purchases AS (
        SELECT
            o.delivery_date as day,
            ip.pharmacy_id,
            COALESCE(gp.bcb_lab, 'Non défini') as laboratory_name,
            SUM(po.qte_r) as qty_purchased,
            -- Valorisation : Qté * PAMP (ou Prix Achat si dispo, ici PAMP via mv_latest_product_prices)
            SUM(po.qte_r * COALESCE(lp.weighted_average_price, 0)) as ht_purchased
        FROM data_productorder po
        JOIN data_order o ON po.order_id = o.id
        JOIN data_internalproduct ip ON po.product_id = ip.id
        LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
        LEFT JOIN mv_latest_product_prices lp ON po.product_id = lp.product_id
        WHERE o.delivery_date IS NOT NULL
          AND po.qte_r > 0
        GROUP BY 1, 2, 3
    )

-- C. Fusion Ventes + Achats (Full Join car on peut avoir l'un sans l'autre)
SELECT
    COALESCE(s.day, p.day) as day,
    COALESCE(s.pharmacy_id, p.pharmacy_id) as pharmacy_id,
    COALESCE(s.laboratory_name, p.laboratory_name) as laboratory_name,
    
    -- Métriques Ventes
    COALESCE(s.qty_sold, 0) as qty_sold,
    COALESCE(s.ht_sold, 0) as ht_sold,
    COALESCE(s.ttc_sold, 0) as ttc_sold,
    COALESCE(s.margin_sold, 0) as margin_sold,
    
    -- Métriques Achats
    COALESCE(p.qty_purchased, 0) as qty_purchased,
    COALESCE(p.ht_purchased, 0) as ht_purchased

FROM daily_sales s
FULL OUTER JOIN daily_purchases p 
    ON s.day = p.day 
    AND s.pharmacy_id = p.pharmacy_id 
    AND s.laboratory_name = p.laboratory_name;

-- 3. Indexation pour la Performance
-- Index pour filtrer par plage de dates (CRITIQUE)
CREATE INDEX idx_mv_lab_stats_day ON mv_lab_stats_daily(day);

-- Index pour les agrégations par labo
CREATE INDEX idx_mv_lab_stats_lab ON mv_lab_stats_daily(laboratory_name);

-- Index composite pour les recherches spécifiques
CREATE INDEX idx_mv_lab_stats_composite ON mv_lab_stats_daily(pharmacy_id, day);

-- Index unique (pour refresh concurrent si besoin)
CREATE UNIQUE INDEX idx_mv_lab_stats_unique ON mv_lab_stats_daily(day, pharmacy_id, laboratory_name);
