// src/app/api/ruptures/order-reception-metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface OrderReceptionRequest {
  dateRange: { start: string; end: string };
  comparisonDateRange?: { start: string; end: string };
  productCodes?: string[];
  laboratoryCodes?: string[];
  categoryCodes?: string[];
  pharmacyIds?: string[];
}

interface OrderReceptionMetricsResponse {
  readonly quantite_commandee: number;
  readonly quantite_receptionnee: number;
  readonly montant_commande_ht: number;
  readonly montant_receptionne_ht: number;
  readonly delta_quantite: number;
  readonly delta_montant: number;
  readonly taux_reception_quantite: number;
  readonly taux_reception_montant: number;
  readonly nb_commandes: number;
  readonly nb_lignes_commandes: number;
  readonly nb_fournisseurs: number;
  readonly nb_references_total: number;
  readonly nb_references_rupture: number;
  readonly taux_references_rupture: number;
  readonly delai_moyen_reception_jours: number | null;
  // Nouvelles métriques ruptures
  readonly nb_ruptures_totales_courtes: number;
  readonly nb_ruptures_totales_longues: number;
  readonly nb_ruptures_partielles_courtes: number;
  readonly nb_ruptures_partielles_longues: number;
  readonly qte_rupture_totale: number;
  readonly qte_rupture_partielle: number;
  readonly taux_rupture_totale_pct: number;
  readonly comparison?: {
    readonly quantite_commandee: number;
    readonly quantite_receptionnee: number;
    readonly montant_commande_ht: number;
    readonly montant_receptionne_ht: number;
    readonly delta_quantite: number;
    readonly delta_montant: number;
    readonly nb_references_total: number;
    readonly nb_references_rupture: number;
    readonly taux_references_rupture: number;
    readonly nb_ruptures_totales_courtes: number;
    readonly nb_ruptures_totales_longues: number;
    readonly nb_ruptures_partielles_courtes: number;
    readonly nb_ruptures_partielles_longues: number;
    readonly qte_rupture_totale: number;
    readonly qte_rupture_partielle: number;
    readonly taux_rupture_totale_pct: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse<OrderReceptionMetricsResponse | { error: string }>> {
  const startTime = Date.now();
  console.log('📦 [API] Order Reception Metrics Request started');

  try {
    const body = await request.json();
    const validatedRequest = validateRequest(body);
    
    console.log('✅ [API] Request validated:', {
      dateRange: validatedRequest.dateRange,
      hasComparison: !!validatedRequest.comparisonDateRange,
      filtersCount: {
        products: validatedRequest.productCodes?.length || 0,
        laboratories: validatedRequest.laboratoryCodes?.length || 0,
        categories: validatedRequest.categoryCodes?.length || 0,
        pharmacies: validatedRequest.pharmacyIds?.length || 0
      }
    });

    const metrics = await calculateMetrics(validatedRequest);
    
    let comparison: {
      quantite_commandee: number;
      quantite_receptionnee: number;
      montant_commande_ht: number;
      montant_receptionne_ht: number;
      delta_quantite: number;
      delta_montant: number;
      nb_references_total: number;
      nb_references_rupture: number;
      taux_references_rupture: number;
      nb_ruptures_totales_courtes: number;
      nb_ruptures_totales_longues: number;
      nb_ruptures_partielles_courtes: number;
      nb_ruptures_partielles_longues: number;
      qte_rupture_totale: number;
      qte_rupture_partielle: number;
      taux_rupture_totale_pct: number;
    } | undefined = undefined;
    
    if (validatedRequest.comparisonDateRange) {
      console.log('📊 [API] Calculating comparison metrics');
      const comparisonRequest: OrderReceptionRequest = {
        dateRange: validatedRequest.comparisonDateRange,
        ...(validatedRequest.productCodes && { productCodes: validatedRequest.productCodes }),
        ...(validatedRequest.laboratoryCodes && { laboratoryCodes: validatedRequest.laboratoryCodes }),
        ...(validatedRequest.categoryCodes && { categoryCodes: validatedRequest.categoryCodes }),
        ...(validatedRequest.pharmacyIds && { pharmacyIds: validatedRequest.pharmacyIds })
      };
      const comparisonMetrics = await calculateMetrics(comparisonRequest);
      comparison = {
        quantite_commandee: comparisonMetrics.quantite_commandee,
        quantite_receptionnee: comparisonMetrics.quantite_receptionnee,
        montant_commande_ht: comparisonMetrics.montant_commande_ht,
        montant_receptionne_ht: comparisonMetrics.montant_receptionne_ht,
        delta_quantite: comparisonMetrics.delta_quantite,
        delta_montant: comparisonMetrics.delta_montant,
        nb_references_total: comparisonMetrics.nb_references_total,
        nb_references_rupture: comparisonMetrics.nb_references_rupture,
        taux_references_rupture: comparisonMetrics.taux_references_rupture,
        nb_ruptures_totales_courtes: comparisonMetrics.nb_ruptures_totales_courtes,
        nb_ruptures_totales_longues: comparisonMetrics.nb_ruptures_totales_longues,
        nb_ruptures_partielles_courtes: comparisonMetrics.nb_ruptures_partielles_courtes,
        nb_ruptures_partielles_longues: comparisonMetrics.nb_ruptures_partielles_longues,
        qte_rupture_totale: comparisonMetrics.qte_rupture_totale,
        qte_rupture_partielle: comparisonMetrics.qte_rupture_partielle,
        taux_rupture_totale_pct: comparisonMetrics.taux_rupture_totale_pct
      };
    }

    const response: OrderReceptionMetricsResponse = {
      ...metrics,
      ...(comparison && { comparison }),
      queryTime: Date.now() - startTime,
      cached: false
    };
    
    console.log('✅ [API] Calculation completed in', response.queryTime, 'ms');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [API] Order Reception Metrics failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

function validateRequest(body: any): OrderReceptionRequest {
  if (!body.dateRange?.start || !body.dateRange?.end) {
    throw new Error('Date range is required');
  }
  
  return {
    dateRange: body.dateRange,
    ...(body.comparisonDateRange && { comparisonDateRange: body.comparisonDateRange }),
    ...(body.productCodes && { productCodes: body.productCodes }),
    ...(body.laboratoryCodes && { laboratoryCodes: body.laboratoryCodes }),
    ...(body.categoryCodes && { categoryCodes: body.categoryCodes }),
    ...(body.pharmacyIds && { pharmacyIds: body.pharmacyIds })
  };
}

async function calculateMetrics(request: OrderReceptionRequest): Promise<Omit<OrderReceptionMetricsResponse, 'comparison' | 'queryTime' | 'cached'>> {
  const { dateRange, productCodes = [], laboratoryCodes = [], categoryCodes = [], pharmacyIds } = request;

  const allProductCodes = Array.from(new Set([
    ...productCodes,
    ...laboratoryCodes,
    ...categoryCodes
  ]));

  const hasProductFilter = allProductCodes.length > 0;
  const hasPharmacyFilter = pharmacyIds && pharmacyIds.length > 0;

  const productFilter = hasProductFilter 
    ? 'AND ip.code_13_ref_id = ANY($3::text[])'
    : '';

  const pharmacyFilter = hasPharmacyFilter
    ? (hasProductFilter ? 'AND o.pharmacy_id = ANY($4::uuid[])' : 'AND o.pharmacy_id = ANY($3::uuid[])')
    : '';

  const params: any[] = [dateRange.start, dateRange.end];
  
  if (hasProductFilter) {
    params.push(allProductCodes);
  }
  
  if (hasPharmacyFilter) {
    params.push(pharmacyIds);
  }

  const query = `
    WITH orders_data AS (
      SELECT 
        o.id as order_id,
        o.delivery_date,
        po.qte,
        po.qte_r,
        ip.id as product_id,
        ip.code_13_ref_id
      FROM data_order o
      INNER JOIN data_productorder po ON po.order_id = o.id
      INNER JOIN data_internalproduct ip ON po.product_id = ip.id
      WHERE o.delivery_date >= $1::date 
        AND o.delivery_date <= $2::date
        AND o.delivery_date IS NOT NULL
        ${productFilter}
        ${pharmacyFilter}
    ),
    orders_avec_reception AS (
      SELECT *
      FROM orders_data
      WHERE qte_r > 0
    ),
    orders_sans_reception AS (
      SELECT 
        order_id,
        delivery_date,
        qte,
        qte_r,
        product_id,
        code_13_ref_id,
        (CURRENT_DATE - delivery_date) as delai_jours_total
      FROM orders_data
      WHERE qte_r = 0
    ),
    daily_sales AS (
      SELECT 
        s.date,
        SUM(s.quantity) as quantite_vendue,
        ins.product_id
      FROM data_sales s
      INNER JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      WHERE s.date >= $1::date - INTERVAL '30 days'
        AND s.date <= $2::date + INTERVAL '30 days'
      GROUP BY s.date, ins.product_id
    ),
    stock_snapshots AS (
      SELECT 
        ins.date as snapshot_date,
        ins.stock,
        ins.product_id,
        LAG(ins.stock) OVER (PARTITION BY ins.product_id ORDER BY ins.date) as stock_veille,
        (ins.stock - LAG(ins.stock) OVER (PARTITION BY ins.product_id ORDER BY ins.date)) as delta_stock_brut
      FROM data_inventorysnapshot ins
      WHERE ins.date >= $1::date - INTERVAL '30 days'
        AND ins.date <= $2::date + INTERVAL '30 days'
    ),
    stock_with_sales AS (
      SELECT 
        ss.snapshot_date,
        ss.stock,
        ss.stock_veille,
        ss.delta_stock_brut,
        COALESCE(ds.quantite_vendue, 0) as ventes_jour,
        ss.delta_stock_brut + COALESCE(ds.quantite_vendue, 0) as reception_estimee,
        ss.product_id
      FROM stock_snapshots ss
      LEFT JOIN daily_sales ds ON ds.date = ss.snapshot_date 
        AND ds.product_id = ss.product_id
      WHERE ss.delta_stock_brut + COALESCE(ds.quantite_vendue, 0) > 10
    ),
    matched_with_reception AS (
      SELECT 
        od.order_id,
        od.delivery_date,
        od.qte,
        od.qte_r,
        od.code_13_ref_id,
        sws.snapshot_date as date_reception_estimee,
        sws.reception_estimee,
        (sws.snapshot_date::date - od.delivery_date::date) as delai_jours,
        ABS(sws.reception_estimee - od.qte_r) as ecart_quantite,
        ROW_NUMBER() OVER (
          PARTITION BY od.order_id 
          ORDER BY ABS(sws.reception_estimee - od.qte_r), 
                   ABS(sws.snapshot_date::date - od.delivery_date::date)
        ) as rank_by_order,
        ROW_NUMBER() OVER (
          PARTITION BY sws.snapshot_date 
          ORDER BY ABS(sws.reception_estimee - od.qte_r)
        ) as rank_by_snapshot
      FROM orders_avec_reception od
      LEFT JOIN stock_with_sales sws ON sws.product_id = od.product_id
        AND sws.snapshot_date::date >= (od.delivery_date::date - INTERVAL '5 days')::date
        AND sws.snapshot_date::date <= (od.delivery_date::date + INTERVAL '90 days')::date
    ),
    final_results AS (
      -- Commandes AVEC réception
      SELECT 
        order_id,
        delivery_date,
        date_reception_estimee,
        delai_jours,
        qte as commandee,
        qte_r as recue,
        (qte - qte_r) as manquante,
        code_13_ref_id,
        CASE 
          WHEN date_reception_estimee IS NULL AND qte_r < qte
          THEN 'RUPTURE_NON_DETECTEE'
          
          WHEN qte_r < qte AND delai_jours > 60 
          THEN 'RUPTURE_LONGUE'
          
          WHEN qte_r < qte AND delai_jours > 30 
          THEN 'RUPTURE_COURTE'
          
          WHEN qte_r < qte 
          THEN 'RECEPTION_PARTIELLE'
          
          ELSE 'OK'
        END as statut_rupture
      FROM matched_with_reception
      WHERE rank_by_order = 1 
        AND rank_by_snapshot = 1  -- MODE STRICT
      
      UNION ALL
      
      -- Commandes SANS réception (qte_r = 0)
      SELECT 
        order_id,
        delivery_date,
        NULL::date as date_reception_estimee,
        delai_jours_total as delai_jours,
        qte as commandee,
        qte_r as recue,
        qte as manquante,
        code_13_ref_id,
        CASE 
          WHEN delai_jours_total > 60 THEN 'RUPTURE_TOTALE_LONGUE'
          WHEN delai_jours_total > 30 THEN 'RUPTURE_TOTALE_COURTE'
          ELSE 'RUPTURE_TOTALE'
        END as statut_rupture
      FROM orders_sans_reception
    ),
    aggregated_metrics AS (
      SELECT 
        COUNT(*) as nb_commandes,
        COUNT(DISTINCT code_13_ref_id) as nb_references_total,
        
        -- Ruptures totales (qte_r = 0)
        COUNT(CASE WHEN statut_rupture = 'RUPTURE_TOTALE_LONGUE' THEN 1 END) as nb_ruptures_totales_longues,
        COUNT(CASE WHEN statut_rupture = 'RUPTURE_TOTALE_COURTE' THEN 1 END) as nb_ruptures_totales_courtes,
        
        -- Ruptures partielles (qte_r > 0 mais < qte)
        COUNT(CASE WHEN statut_rupture = 'RUPTURE_LONGUE' THEN 1 END) as nb_ruptures_partielles_longues,
        COUNT(CASE WHEN statut_rupture = 'RUPTURE_COURTE' THEN 1 END) as nb_ruptures_partielles_courtes,
        
        -- Quantités manquantes
        SUM(CASE WHEN statut_rupture LIKE 'RUPTURE_TOTALE%' THEN manquante ELSE 0 END) as qte_rupture_totale,
        SUM(CASE WHEN statut_rupture IN ('RUPTURE_LONGUE', 'RUPTURE_COURTE') THEN manquante ELSE 0 END) as qte_rupture_partielle,
        
        -- Références en rupture (toutes catégories)
        COUNT(DISTINCT CASE WHEN statut_rupture LIKE 'RUPTURE_%' THEN code_13_ref_id END) as nb_references_rupture,
        
        -- Quantités et montants
        SUM(commandee) as quantite_commandee,
        SUM(recue) as quantite_receptionnee
        
      FROM final_results
    ),
    pricing_data AS (
      SELECT 
        COUNT(DISTINCT o.supplier_id) as nb_fournisseurs,
        COUNT(po.id) as nb_lignes_commandes,
        SUM(po.qte * COALESCE(latest_price.weighted_average_price, 0)) as montant_commande_ht,
        SUM(po.qte_r * COALESCE(latest_price.weighted_average_price, 0)) as montant_receptionne_ht
      FROM data_order o
      INNER JOIN data_productorder po ON po.order_id = o.id
      INNER JOIN data_internalproduct ip ON po.product_id = ip.id
      LEFT JOIN LATERAL (
        SELECT weighted_average_price
        FROM data_inventorysnapshot ins
        WHERE ins.product_id = po.product_id
          AND ins.weighted_average_price > 0
        ORDER BY ins.date DESC
        LIMIT 1
      ) latest_price ON true
      WHERE o.delivery_date >= $1::date 
        AND o.delivery_date <= $2::date
        AND o.delivery_date IS NOT NULL
        ${productFilter}
        ${pharmacyFilter}
    )
    SELECT 
      COALESCE(am.quantite_commandee, 0)::numeric as quantite_commandee,
      COALESCE(am.quantite_receptionnee, 0)::numeric as quantite_receptionnee,
      COALESCE(pd.montant_commande_ht, 0)::numeric as montant_commande_ht,
      COALESCE(pd.montant_receptionne_ht, 0)::numeric as montant_receptionne_ht,
      COALESCE(am.quantite_commandee - am.quantite_receptionnee, 0)::numeric as delta_quantite,
      COALESCE(pd.montant_commande_ht - pd.montant_receptionne_ht, 0)::numeric as delta_montant,
      CASE 
        WHEN am.quantite_commandee > 0 
        THEN ROUND((am.quantite_receptionnee::numeric / am.quantite_commandee::numeric) * 100, 2)
        ELSE 0
      END as taux_reception_quantite,
      CASE 
        WHEN pd.montant_commande_ht > 0 
        THEN ROUND((pd.montant_receptionne_ht::numeric / pd.montant_commande_ht::numeric) * 100, 2)
        ELSE 0
      END as taux_reception_montant,
      COALESCE(am.nb_commandes, 0) as nb_commandes,
      COALESCE(pd.nb_lignes_commandes, 0) as nb_lignes_commandes,
      COALESCE(pd.nb_fournisseurs, 0) as nb_fournisseurs,
      COALESCE(am.nb_references_total, 0) as nb_references_total,
      COALESCE(am.nb_references_rupture, 0) as nb_references_rupture,
      CASE 
        WHEN am.nb_references_total > 0 
        THEN ROUND((am.nb_references_rupture::numeric / am.nb_references_total::numeric) * 100, 2)
        ELSE 0
      END as taux_references_rupture,
      NULL::numeric as delai_moyen_reception_jours,
      COALESCE(am.nb_ruptures_totales_courtes, 0) as nb_ruptures_totales_courtes,
      COALESCE(am.nb_ruptures_totales_longues, 0) as nb_ruptures_totales_longues,
      COALESCE(am.nb_ruptures_partielles_courtes, 0) as nb_ruptures_partielles_courtes,
      COALESCE(am.nb_ruptures_partielles_longues, 0) as nb_ruptures_partielles_longues,
      COALESCE(am.qte_rupture_totale, 0)::numeric as qte_rupture_totale,
      COALESCE(am.qte_rupture_partielle, 0)::numeric as qte_rupture_partielle,
      CASE 
        WHEN am.nb_commandes > 0
        THEN ROUND(
          (am.nb_ruptures_totales_courtes + am.nb_ruptures_totales_longues)::numeric 
          / am.nb_commandes::numeric * 100, 2
        )
        ELSE 0
      END as taux_rupture_totale_pct
    FROM aggregated_metrics am
    CROSS JOIN pricing_data pd;
  `;

  console.log('🔍 [API] Executing query with params:', params.length);

  try {
    const result = await db.query(query, params);

    if (result.length === 0) {
      return getDefaultMetrics();
    }

    return formatMetrics(result[0]);
  } catch (error) {
    console.error('❌ [API] Database query failed:', error);
    throw error;
  }
}

function getDefaultMetrics(): Omit<OrderReceptionMetricsResponse, 'comparison' | 'queryTime' | 'cached'> {
  return {
    quantite_commandee: 0,
    quantite_receptionnee: 0,
    montant_commande_ht: 0,
    montant_receptionne_ht: 0,
    delta_quantite: 0,
    delta_montant: 0,
    taux_reception_quantite: 0,
    taux_reception_montant: 0,
    nb_commandes: 0,
    nb_lignes_commandes: 0,
    nb_fournisseurs: 0,
    nb_references_total: 0,
    nb_references_rupture: 0,
    taux_references_rupture: 0,
    delai_moyen_reception_jours: null,
    nb_ruptures_totales_courtes: 0,
    nb_ruptures_totales_longues: 0,
    nb_ruptures_partielles_courtes: 0,
    nb_ruptures_partielles_longues: 0,
    qte_rupture_totale: 0,
    qte_rupture_partielle: 0,
    taux_rupture_totale_pct: 0
  };
}

function formatMetrics(row: any): Omit<OrderReceptionMetricsResponse, 'comparison' | 'queryTime' | 'cached'> {
  return {
    quantite_commandee: Number(row.quantite_commandee) || 0,
    quantite_receptionnee: Number(row.quantite_receptionnee) || 0,
    montant_commande_ht: Number(row.montant_commande_ht) || 0,
    montant_receptionne_ht: Number(row.montant_receptionne_ht) || 0,
    delta_quantite: Number(row.delta_quantite) || 0,
    delta_montant: Number(row.delta_montant) || 0,
    taux_reception_quantite: Number(row.taux_reception_quantite) || 0,
    taux_reception_montant: Number(row.taux_reception_montant) || 0,
    nb_commandes: Number(row.nb_commandes) || 0,
    nb_lignes_commandes: Number(row.nb_lignes_commandes) || 0,
    nb_fournisseurs: Number(row.nb_fournisseurs) || 0,
    nb_references_total: Number(row.nb_references_total) || 0,
    nb_references_rupture: Number(row.nb_references_rupture) || 0,
    taux_references_rupture: Number(row.taux_references_rupture) || 0,
    delai_moyen_reception_jours: null,
    nb_ruptures_totales_courtes: Number(row.nb_ruptures_totales_courtes) || 0,
    nb_ruptures_totales_longues: Number(row.nb_ruptures_totales_longues) || 0,
    nb_ruptures_partielles_courtes: Number(row.nb_ruptures_partielles_courtes) || 0,
    nb_ruptures_partielles_longues: Number(row.nb_ruptures_partielles_longues) || 0,
    qte_rupture_totale: Number(row.qte_rupture_totale) || 0,
    qte_rupture_partielle: Number(row.qte_rupture_partielle) || 0,
    taux_rupture_totale_pct: Number(row.taux_rupture_totale_pct) || 0
  };
}