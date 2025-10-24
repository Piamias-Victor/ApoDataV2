// src/app/api/kpis/generic-global/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface GlobalGenericKpiRequest {
  dateRange: { start: string; end: string; };
  comparisonDateRange?: { start: string; end: string; };
  pharmacyIds?: string[];
}

function validateRequest(body: any): GlobalGenericKpiRequest {
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
    readonly montant_achat_ht: number;
    readonly montant_marge: number;
    readonly quantite_vendue: number;
    readonly quantite_achetee: number;
  } | undefined;
  readonly queryTime: number;
  readonly cached: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse<KpiMetricsResponse | { error: string }>> {
  const startTime = Date.now();
  console.log('🌍 [API Global Generic] KPI Request started');

  try {
    const body = await request.json();
    console.log('📝 [API Global Generic] Request body received:', JSON.stringify(body, null, 2));

    const validatedRequest = validateRequest(body);
    
    console.log('✅ [API Global Generic] Request validated:', {
      dateRange: validatedRequest.dateRange,
      hasComparison: !!validatedRequest.comparisonDateRange,
      pharmaciesCount: validatedRequest.pharmacyIds?.length || 0
    });

    const kpiMetrics = await calculateGlobalGenericKpiMetrics(validatedRequest);
    
    let comparison: { ca_ttc: number; montant_achat_ht: number; montant_marge: number; quantite_vendue: number; quantite_achetee: number; } | undefined;
    if (validatedRequest.comparisonDateRange) {
      console.log('📊 [API Global Generic] Calculating comparison period metrics');
      const comparisonRequest: GlobalGenericKpiRequest = {
        dateRange: validatedRequest.comparisonDateRange,
        ...(validatedRequest.pharmacyIds && { pharmacyIds: validatedRequest.pharmacyIds })
      };
      const comparisonMetrics = await calculateGlobalGenericKpiMetrics(comparisonRequest);
      comparison = {
        ca_ttc: comparisonMetrics.ca_ttc,
        montant_achat_ht: comparisonMetrics.montant_achat_ht,
        montant_marge: comparisonMetrics.montant_marge,
        quantite_vendue: comparisonMetrics.quantite_vendue,
        quantite_achetee: comparisonMetrics.quantite_achetee
      };
    }

    const response: KpiMetricsResponse = {
      ...kpiMetrics,
      comparison,
      queryTime: Date.now() - startTime,
      cached: false
    };
    
    console.log('✅ [API Global Generic] KPI calculation completed', {
      ca_ttc: response.ca_ttc,
      queryTime: response.queryTime,
      hasComparison: !!comparison
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [API Global Generic] KPI calculation failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

function getDefaultKpiResponse(): Omit<KpiMetricsResponse, 'queryTime' | 'cached' | 'comparison'> {
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

function formatKpiResponse(row: any): Omit<KpiMetricsResponse, 'queryTime' | 'cached' | 'comparison'> {
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
}

async function calculateGlobalGenericKpiMetrics(
  request: GlobalGenericKpiRequest
): Promise<Omit<KpiMetricsResponse, 'queryTime' | 'cached' | 'comparison'>> {
  const { dateRange, pharmacyIds } = request;

  const hasPharmacyFilter = pharmacyIds && pharmacyIds.length > 0;

  const pharmacyFilter = hasPharmacyFilter
    ? 'AND ip.pharmacy_id = ANY($3::uuid[])'
    : '';

  const params: any[] = [dateRange.start, dateRange.end];
  
  if (hasPharmacyFilter) {
    params.push(pharmacyIds);
  }

  // Requête pour tous les produits génériques ET référents
  const query = `
    WITH generic_referent_products AS (
      SELECT DISTINCT gp.code_13_ref
      FROM data_globalproduct gp
      WHERE gp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
        AND gp.bcb_generic_group IS NOT NULL
    ),
    period_sales AS (
      SELECT 
        COUNT(DISTINCT ip.code_13_ref_id) as nb_references_produits,
        COUNT(DISTINCT ip.pharmacy_id) as nb_pharmacies,
        SUM(s.quantity) as total_quantity_sold,
        SUM(s.quantity * s.unit_price_ttc) as ca_ttc_total,
        SUM(s.quantity * (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0))) as ca_ht_total,
        SUM(s.quantity * (
          (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
        )) as montant_marge_reel
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      JOIN generic_referent_products grp ON ip.code_13_ref_id = grp.code_13_ref
      LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
      WHERE s.date >= $1::date AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        AND (gp.tva_percentage IS NOT NULL OR gp.bcb_tva_rate IS NOT NULL)
        AND COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) > 0
        ${pharmacyFilter}
    ),
    period_purchases AS (
      SELECT 
        SUM(po.qte_r) as total_quantity_bought,
        SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)) as montant_achat_ht_total
      FROM data_productorder po
      INNER JOIN data_order o ON po.order_id = o.id
      INNER JOIN data_internalproduct ip ON po.product_id = ip.id
      JOIN generic_referent_products grp ON ip.code_13_ref_id = grp.code_13_ref
      LEFT JOIN LATERAL (
        SELECT weighted_average_price
        FROM data_inventorysnapshot ins2
        WHERE ins2.product_id = po.product_id
          AND ins2.weighted_average_price > 0
        ORDER BY ins2.date DESC
        LIMIT 1
      ) closest_snap ON true
      WHERE o.delivery_date >= $1::date 
        AND o.delivery_date <= $2::date
        AND o.delivery_date IS NOT NULL
        AND po.qte_r > 0
        ${pharmacyFilter}
    ),
    current_stock AS (
      SELECT 
        SUM(latest_stock.stock) as quantite_stock_total,
        SUM(latest_stock.stock * latest_stock.weighted_average_price) as valeur_stock_ht_total
      FROM data_internalproduct ip
      JOIN generic_referent_products grp ON ip.code_13_ref_id = grp.code_13_ref
      JOIN LATERAL (
        SELECT DISTINCT ON (ins.product_id)
          ins.stock, ins.weighted_average_price
        FROM data_inventorysnapshot ins
        WHERE ins.product_id = ip.id
        ORDER BY ins.product_id, ins.date DESC
      ) latest_stock ON true
      WHERE 1=1 
        ${pharmacyFilter}
    )
    SELECT 
      COALESCE(ps.ca_ttc_total, 0) as ca_ttc,
      COALESCE(pp.montant_achat_ht_total, 0) as montant_achat_ht,
      COALESCE(ps.montant_marge_reel, 0) as montant_marge,
      CASE 
        WHEN COALESCE(ps.ca_ht_total, 0) > 0 
        THEN (COALESCE(ps.montant_marge_reel, 0) / COALESCE(ps.ca_ht_total, 0)) * 100
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

  console.log('🔍 [API Global Generic] Executing query:', {
    dateRange,
    pharmacyIdsLength: pharmacyIds?.length || 0,
    paramsLength: params.length,
    hasPharmacyFilter
  });

  try {
    const result = await db.query(query, params);

    if (result.length === 0) {
      return getDefaultKpiResponse();
    }

    return formatKpiResponse(result[0]);
  } catch (error) {
    console.error('❌ [API Global Generic] Database query failed:', error);
    throw error;
  }
}