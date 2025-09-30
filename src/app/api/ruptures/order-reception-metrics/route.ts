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
  readonly delai_moyen_reception_jours: number | null;
  readonly comparison?: {
    readonly quantite_commandee: number;
    readonly quantite_receptionnee: number;
    readonly montant_commande_ht: number;
    readonly montant_receptionne_ht: number;
    readonly delta_quantite: number;
    readonly delta_montant: number;
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
        delta_montant: comparisonMetrics.delta_montant
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

  // Construction des filtres
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
        COUNT(DISTINCT o.id) as nb_commandes,
        COUNT(po.id) as nb_lignes_commandes,
        COUNT(DISTINCT o.supplier_id) as nb_fournisseurs,
        SUM(po.qte) as quantite_commandee,
        SUM(po.qte_r) as quantite_receptionnee,
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
      COALESCE(quantite_commandee, 0)::numeric as quantite_commandee,
      COALESCE(quantite_receptionnee, 0)::numeric as quantite_receptionnee,
      COALESCE(montant_commande_ht, 0)::numeric as montant_commande_ht,
      COALESCE(montant_receptionne_ht, 0)::numeric as montant_receptionne_ht,
      COALESCE(quantite_commandee - quantite_receptionnee, 0)::numeric as delta_quantite,
      COALESCE(montant_commande_ht - montant_receptionne_ht, 0)::numeric as delta_montant,
      CASE 
        WHEN quantite_commandee > 0 
        THEN ROUND((quantite_receptionnee::numeric / quantite_commandee::numeric) * 100, 2)
        ELSE 0
      END as taux_reception_quantite,
      CASE 
        WHEN montant_commande_ht > 0 
        THEN ROUND((montant_receptionne_ht::numeric / montant_commande_ht::numeric) * 100, 2)
        ELSE 0
      END as taux_reception_montant,
      COALESCE(nb_commandes, 0) as nb_commandes,
      COALESCE(nb_lignes_commandes, 0) as nb_lignes_commandes,
      COALESCE(nb_fournisseurs, 0) as nb_fournisseurs,
      NULL::numeric as delai_moyen_reception_jours
    FROM orders_data;
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
    delai_moyen_reception_jours: null
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
    delai_moyen_reception_jours: null
  };
}