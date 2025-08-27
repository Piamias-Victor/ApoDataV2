// src/app/api/kpis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface KpiRequest {
  dateRange: { start: string; end: string; };
  comparisonDateRange?: { start: string; end: string; };
  productCodes?: string[];
  laboratoryCodes?: string[];
  categoryCodes?: string[];
  pharmacyIds?: string[];
}

function validateKpiRequest(body: any): KpiRequest {
  if (!body.dateRange?.start || !body.dateRange?.end) {
    throw new Error('Date range is required');
  }
  
  const startDate = new Date(body.dateRange.start);
  const endDate = new Date(body.dateRange.end);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date format');
  }
  
  return {
    dateRange: {
      start: body.dateRange.start,
      end: body.dateRange.end
    },
    ...(body.comparisonDateRange?.start && body.comparisonDateRange?.end && {
      comparisonDateRange: {
        start: body.comparisonDateRange.start,
        end: body.comparisonDateRange.end
      }
    }),
    ...(body.productCodes && Array.isArray(body.productCodes) && { productCodes: body.productCodes }),
    ...(body.laboratoryCodes && Array.isArray(body.laboratoryCodes) && { laboratoryCodes: body.laboratoryCodes }),
    ...(body.categoryCodes && Array.isArray(body.categoryCodes) && { categoryCodes: body.categoryCodes }),
    ...(body.pharmacyIds && Array.isArray(body.pharmacyIds) && { pharmacyIds: body.pharmacyIds })
  };
}

interface KpiMetricsResponse {
  readonly ca_ttc: number;
  readonly montant_achat_ht: number;
  readonly montant_marge: number;
  readonly pourcentage_marge: number;
  readonly valeur_stock_ht: number;
  readonly quantite_stock: number;
  readonly quantite_vendue: number;
  readonly quantite_achetee: number;
  readonly jours_de_stock: number | null;
  readonly nb_references_produits: number;
  readonly nb_pharmacies: number;
  readonly comparison?: {
    readonly ca_ttc: number;
    readonly montant_marge: number;
    readonly quantite_vendue: number;
  } | undefined;
  readonly queryTime: number;
  readonly cached: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse<KpiMetricsResponse | { error: string }>> {
  const startTime = Date.now();
  console.log('🔥 [API] KPI Request started');

  try {
    const body = await request.json();
    console.log('📝 [API] Request body received:', JSON.stringify(body, null, 2));

    const validatedRequest = validateKpiRequest(body);
    
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

    const kpiMetrics = await calculateKpiMetrics(validatedRequest);
    
    let comparison: { ca_ttc: number; montant_marge: number; quantite_vendue: number; } | undefined;
    if (validatedRequest.comparisonDateRange) {
      console.log('📊 [API] Calculating comparison period metrics');
      const comparisonRequest: KpiRequest = {
        dateRange: validatedRequest.comparisonDateRange,
        ...(validatedRequest.productCodes && { productCodes: validatedRequest.productCodes }),
        ...(validatedRequest.laboratoryCodes && { laboratoryCodes: validatedRequest.laboratoryCodes }),
        ...(validatedRequest.categoryCodes && { categoryCodes: validatedRequest.categoryCodes }),
        ...(validatedRequest.pharmacyIds && { pharmacyIds: validatedRequest.pharmacyIds })
      };
      const comparisonMetrics = await calculateKpiMetrics(comparisonRequest);
      comparison = {
        ca_ttc: comparisonMetrics.ca_ttc,
        montant_marge: comparisonMetrics.montant_marge,
        quantite_vendue: comparisonMetrics.quantite_vendue
      };
    }

    const response: KpiMetricsResponse = {
      ...kpiMetrics,
      comparison,
      queryTime: Date.now() - startTime,
      cached: false
    };
    
    console.log('✅ [API] KPI calculation completed', {
      ca_ttc: response.ca_ttc,
      queryTime: response.queryTime,
      hasComparison: !!comparison
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [API] KPI calculation failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

async function calculateKpiMetrics(request: KpiRequest): Promise<Omit<KpiMetricsResponse, 'queryTime' | 'cached' | 'comparison'>> {
  const { dateRange, productCodes = [], laboratoryCodes = [], categoryCodes = [], pharmacyIds } = request;

  const allProductCodes = Array.from(new Set([
    ...productCodes,
    ...laboratoryCodes,
    ...categoryCodes
  ]));

  // Approche simplifiée sans paramètres dynamiques
  const query = `
    WITH period_sales AS (
      SELECT 
        COUNT(DISTINCT ip.code_13_ref_id) as nb_references_produits,
        COUNT(DISTINCT ip.pharmacy_id) as nb_pharmacies,
        SUM(s.quantity) as total_quantity_sold,
        SUM(s.quantity * ins.price_with_tax) as ca_ttc_total,
        SUM(s.quantity * (
          (ins.price_with_tax / (1 + COALESCE(ip."TVA", 0) / 100.0)) - ins.weighted_average_price
        )) as montant_marge_reel,
        SUM(s.quantity * ins.weighted_average_price) as montant_achat_ht_total
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date AND s.date <= $2::date
        AND ins.weighted_average_price > 0
        ${allProductCodes.length > 0 ? 'AND ip.code_13_ref_id = ANY($3::text[])' : ''}
        ${pharmacyIds && pharmacyIds.length > 0 ? (allProductCodes.length > 0 ? 'AND ip.pharmacy_id = ANY($4::uuid[])' : 'AND ip.pharmacy_id = ANY($3::uuid[])') : ''}
    ),
    period_purchases AS (
      SELECT SUM(po.qte) as total_quantity_bought
      FROM data_productorder po
      JOIN data_order o ON po.order_id = o.id
      JOIN data_internalproduct ip ON po.product_id = ip.id
      WHERE o.created_at >= $1::date AND o.created_at <= $2::date
        ${allProductCodes.length > 0 ? 'AND ip.code_13_ref_id = ANY($3::text[])' : ''}
        ${pharmacyIds && pharmacyIds.length > 0 ? (allProductCodes.length > 0 ? 'AND o.pharmacy_id = ANY($4::uuid[])' : 'AND o.pharmacy_id = ANY($3::uuid[])') : ''}
    ),
    current_stock AS (
      SELECT 
        SUM(latest_stock.stock) as quantite_stock_total,
        SUM(latest_stock.stock * latest_stock.weighted_average_price) as valeur_stock_ht_total
      FROM data_internalproduct ip
      JOIN LATERAL (
        SELECT DISTINCT ON (ins.product_id)
          ins.stock, ins.weighted_average_price
        FROM data_inventorysnapshot ins
        WHERE ins.product_id = ip.id
        ORDER BY ins.product_id, ins.date DESC
      ) latest_stock ON true
      WHERE 1=1 
        ${allProductCodes.length > 0 ? 'AND ip.code_13_ref_id = ANY($3::text[])' : ''}
        ${pharmacyIds && pharmacyIds.length > 0 ? (allProductCodes.length > 0 ? 'AND ip.pharmacy_id = ANY($4::uuid[])' : 'AND ip.pharmacy_id = ANY($3::uuid[])') : ''}
    )
    SELECT 
      COALESCE(ps.ca_ttc_total, 0) as ca_ttc,
      COALESCE(ps.montant_achat_ht_total, 0) as montant_achat_ht,
      COALESCE(ps.montant_marge_reel, 0) as montant_marge,
      CASE 
        WHEN COALESCE(ps.ca_ttc_total, 0) > 0 
        THEN (COALESCE(ps.montant_marge_reel, 0) / COALESCE(ps.ca_ttc_total, 0)) * 100
        ELSE 0
      END as pourcentage_marge,
      COALESCE(cs.valeur_stock_ht_total, 0) as valeur_stock_ht,
      COALESCE(cs.quantite_stock_total, 0) as quantite_stock,
      COALESCE(ps.total_quantity_sold, 0) as quantite_vendue,
      COALESCE(pp.total_quantity_bought, 0) as quantite_achetee,
      CASE 
        WHEN COALESCE(ps.total_quantity_sold, 0) > 0 AND COALESCE(cs.quantite_stock_total, 0) > 0
        THEN ROUND(COALESCE(cs.quantite_stock_total, 0)::numeric / (COALESCE(ps.total_quantity_sold, 0)::numeric / 365))
        ELSE NULL
      END as jours_de_stock,
      COALESCE(ps.nb_references_produits, 0) as nb_references_produits,
      COALESCE(ps.nb_pharmacies, 0) as nb_pharmacies
    FROM period_sales ps
    LEFT JOIN period_purchases pp ON true
    LEFT JOIN current_stock cs ON true;
  `;

  // Construction simple des paramètres
  const params: any[] = [dateRange.start, dateRange.end];
  
  if (allProductCodes.length > 0) {
    params.push(allProductCodes);
  }
  
  if (pharmacyIds && pharmacyIds.length > 0) {
    params.push(pharmacyIds);
  }

  console.log('🔍 [API] Executing KPI query with fixed params:', {
    dateRange,
    productCodesLength: allProductCodes.length,
    pharmacyIdsLength: pharmacyIds?.length || 0,
    paramsLength: params.length
  });

  try {
    const result = await db.query(query, params);

    if (result.length === 0) {
      console.log('⚠️ [API] No KPI data found');
      return {
        ca_ttc: 0,
        montant_achat_ht: 0,
        montant_marge: 0,
        pourcentage_marge: 0,
        valeur_stock_ht: 0,
        quantite_stock: 0,
        quantite_vendue: 0,
        quantite_achetee: 0,
        jours_de_stock: null,
        nb_references_produits: 0,
        nb_pharmacies: 0
      };
    }

    const row = result[0];
    return {
      ca_ttc: Number(row.ca_ttc) || 0,
      montant_achat_ht: Number(row.montant_achat_ht) || 0,
      montant_marge: Number(row.montant_marge) || 0,
      pourcentage_marge: Number(row.pourcentage_marge) || 0,
      valeur_stock_ht: Number(row.valeur_stock_ht) || 0,
      quantite_stock: Number(row.quantite_stock) || 0,
      quantite_vendue: Number(row.quantite_vendue) || 0,
      quantite_achetee: Number(row.quantite_achetee) || 0,
      jours_de_stock: row.jours_de_stock ? Number(row.jours_de_stock) : null,
      nb_references_produits: Number(row.nb_references_produits) || 0,
      nb_pharmacies: Number(row.nb_pharmacies) || 0
    };

  } catch (error) {
    console.error('❌ [API] Database query failed:', error);
    throw error;
  }
}