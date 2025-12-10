// src/app/api/pharmacies/kpis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PharmaciesKpiRequest {
  dateRange: { start: string; end: string; };
  comparisonDateRange?: { start: string; end: string; };
  productCodes?: string[];
  laboratoryCodes?: string[];
  categoryCodes?: string[];
  pharmacyIds?: string[];
}

interface PharmaciesKpiMetricsResponse {
  readonly nb_pharmacies_vendeuses: number;
  readonly pct_pharmacies_vendeuses_selection: number;
  readonly nb_pharmacies_80pct_ca: number;
  readonly pct_pharmacies_80pct_ca: number;
  readonly ca_moyen_pharmacie: number;
  readonly ca_median_pharmacie: number;
  readonly quantite_moyenne_pharmacie: number;
  readonly quantite_mediane_pharmacie: number;
  readonly taux_penetration_produit_pct: number;
  readonly pharmacies_avec_produit: number;
  readonly total_pharmacies_reseau: number;
  readonly ca_total: number;
  readonly quantite_totale: number;
  readonly nb_pharmacies_vendeuses_total: number;
  readonly comparison?: {
    readonly nb_pharmacies_vendeuses: number;
    readonly pct_pharmacies_vendeuses_selection: number;
    readonly nb_pharmacies_80pct_ca: number;
    readonly pct_pharmacies_80pct_ca: number;
    readonly ca_moyen_pharmacie: number;
    readonly ca_median_pharmacie: number;
    readonly quantite_moyenne_pharmacie: number;
    readonly quantite_mediane_pharmacie: number;
    readonly taux_penetration_produit_pct: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

function validatePharmaciesKpiRequest(body: any): PharmaciesKpiRequest {
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

export async function POST(request: NextRequest): Promise<NextResponse<PharmaciesKpiMetricsResponse | { error: string }>> {
  const startTime = Date.now();
  console.log('🔥 [API] Pharmacies KPI Request started');

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      console.log('❌ [API] Unauthorized access attempt to pharmacies KPIs');
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('📝 [API] Request body received:', JSON.stringify(body, null, 2));

    const validatedRequest = validatePharmaciesKpiRequest(body);
    
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

    const pharmaciesMetrics = await calculatePharmaciesKpiMetrics(validatedRequest);
    
    let comparison: {
      readonly nb_pharmacies_vendeuses: number;
      readonly pct_pharmacies_vendeuses_selection: number;
      readonly nb_pharmacies_80pct_ca: number;
      readonly pct_pharmacies_80pct_ca: number;
      readonly ca_moyen_pharmacie: number;
      readonly ca_median_pharmacie: number;
      readonly quantite_moyenne_pharmacie: number;
      readonly quantite_mediane_pharmacie: number;
      readonly taux_penetration_produit_pct: number;
    } | undefined;
    
    if (validatedRequest.comparisonDateRange) {
      console.log('📊 [API] Calculating comparison period metrics');
      const comparisonRequest: PharmaciesKpiRequest = {
        dateRange: validatedRequest.comparisonDateRange,
        ...(validatedRequest.productCodes && { productCodes: validatedRequest.productCodes }),
        ...(validatedRequest.laboratoryCodes && { laboratoryCodes: validatedRequest.laboratoryCodes }),
        ...(validatedRequest.categoryCodes && { categoryCodes: validatedRequest.categoryCodes }),
        ...(validatedRequest.pharmacyIds && { pharmacyIds: validatedRequest.pharmacyIds })
      };
      const comparisonMetrics = await calculatePharmaciesKpiMetrics(comparisonRequest);
      comparison = {
        nb_pharmacies_vendeuses: comparisonMetrics.nb_pharmacies_vendeuses,
        pct_pharmacies_vendeuses_selection: comparisonMetrics.pct_pharmacies_vendeuses_selection,
        nb_pharmacies_80pct_ca: comparisonMetrics.nb_pharmacies_80pct_ca,
        pct_pharmacies_80pct_ca: comparisonMetrics.pct_pharmacies_80pct_ca,
        ca_moyen_pharmacie: comparisonMetrics.ca_moyen_pharmacie,
        ca_median_pharmacie: comparisonMetrics.ca_median_pharmacie,
        quantite_moyenne_pharmacie: comparisonMetrics.quantite_moyenne_pharmacie,
        quantite_mediane_pharmacie: comparisonMetrics.quantite_mediane_pharmacie,
        taux_penetration_produit_pct: comparisonMetrics.taux_penetration_produit_pct
      };
    }

    const response: PharmaciesKpiMetricsResponse = {
      ...pharmaciesMetrics,
      queryTime: Date.now() - startTime,
      cached: false,
      ...(comparison && { comparison })
    };
    
    console.log('✅ [API] Pharmacies KPI calculation completed', {
      nb_pharmacies_vendeuses: response.nb_pharmacies_vendeuses,
      ca_median_pharmacie: response.ca_median_pharmacie,
      queryTime: response.queryTime,
      hasComparison: !!comparison
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [API] Pharmacies KPI calculation failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

async function calculatePharmaciesKpiMetrics(request: PharmaciesKpiRequest): Promise<Omit<PharmaciesKpiMetricsResponse, 'queryTime' | 'cached' | 'comparison'>> {
  const { dateRange, productCodes = [], laboratoryCodes = [], categoryCodes = [], pharmacyIds } = request;

  const allProductCodes = Array.from(new Set([
    ...productCodes,
    ...laboratoryCodes,
    ...categoryCodes
  ]));

  const hasProductFilter = allProductCodes.length > 0;
  const hasPharmacyFilter = pharmacyIds && pharmacyIds.length > 0;

  console.log('🎯 [API] Pharmacies analysis scope:', {
    hasProductFilter,
    hasPharmacyFilter,
    productScope: hasProductFilter ? 'Produits filtrés' : 'Tous les produits',
    pharmacyScope: hasPharmacyFilter ? 'Pharmacies filtrées' : 'Toutes les pharmacies'
  });

  const buildFilters = (prefix: string, paramIndex: number) => {
    let filters = '';
    let paramCount = paramIndex;
    
    if (hasProductFilter) {
      filters += ` AND ${prefix}.code_13_ref_id = ANY($${paramCount}::text[])`;
      paramCount++;
    }
    
    if (hasPharmacyFilter) {
      filters += ` AND ${prefix}.pharmacy_id = ANY($${paramCount}::uuid[])`;
    }
    
    return filters;
  };

  const productFilterSales = buildFilters('ip', 3);
  const productFilterStock = hasProductFilter ? 'AND ip.code_13_ref_id = ANY($3::text[])' : '';
  const pharmacyFilterStock = hasPharmacyFilter ? 
    (hasProductFilter ? 'AND ip.pharmacy_id = ANY($4::uuid[])' : 'AND ip.pharmacy_id = ANY($3::uuid[])') : '';

  const params: any[] = [dateRange.start, dateRange.end];
  
  if (hasProductFilter) {
    params.push(allProductCodes);
  }
  
  if (hasPharmacyFilter) {
    params.push(pharmacyIds);
  }

  const query = `
    WITH 
    pharmacies_base AS (
      SELECT DISTINCT ip.pharmacy_id
      FROM data_internalproduct ip
      WHERE 1=1 ${productFilterStock} ${pharmacyFilterStock}
    ),

    pharmacies_vendeuses AS (
      SELECT 
        COUNT(DISTINCT ip.pharmacy_id) as nb_pharmacies_vendeuses
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND s.quantity > 0
        ${productFilterSales}
    ),

    total_pharmacies_produits AS (
      SELECT COUNT(*) as total_pharmacies
      FROM pharmacies_base
    ),

    pharmacies_ca_detail AS (
      SELECT 
        ip.pharmacy_id,
        dp.name as pharmacy_name,
        SUM(s.quantity * s.unit_price_ttc) as ca_ttc_pharmacie,
        SUM(s.quantity) as quantite_vendue_pharmacie
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      JOIN data_pharmacy dp ON ip.pharmacy_id = dp.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND s.quantity > 0
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        ${productFilterSales}
      GROUP BY ip.pharmacy_id, dp.name
      HAVING SUM(s.quantity * s.unit_price_ttc) > 0
    ),

    concentration_80pct AS (
      SELECT 
        COUNT(*) as nb_pharmacies_80pct_ca
      FROM (
        SELECT 
          pharmacy_id,
          ca_ttc_pharmacie,
          SUM(ca_ttc_pharmacie) OVER (
            ORDER BY ca_ttc_pharmacie DESC 
            ROWS UNBOUNDED PRECEDING
          ) as ca_cumule
        FROM pharmacies_ca_detail
      ) cumul
      WHERE ca_cumule <= (
        SELECT SUM(ca_ttc_pharmacie) * 0.8 
        FROM pharmacies_ca_detail
      )
    ),

    metriques_centrales AS (
      SELECT 
        AVG(ca_ttc_pharmacie) as ca_moyen_pharmacie,
        AVG(quantite_vendue_pharmacie) as quantite_moyenne_pharmacie,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ca_ttc_pharmacie) as ca_median_pharmacie,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY quantite_vendue_pharmacie) as quantite_mediane_pharmacie,
        SUM(ca_ttc_pharmacie) as ca_total,
        SUM(quantite_vendue_pharmacie) as quantite_totale,
        COUNT(*) as nb_pharmacies_total
      FROM pharmacies_ca_detail
    ),

    taux_penetration AS (
      SELECT 
        (SELECT COUNT(*) FROM pharmacies_base) as pharmacies_avec_produit,
        (SELECT COUNT(*) FROM data_pharmacy) as total_pharmacies_reseau
    )

    SELECT 
      COALESCE(pv.nb_pharmacies_vendeuses, 0) as nb_pharmacies_vendeuses,
      ROUND(
        COALESCE(pv.nb_pharmacies_vendeuses, 0) * 100.0 / 
        NULLIF(COALESCE(tpp.total_pharmacies, 1), 0), 1
      ) as pct_pharmacies_vendeuses_selection,
      
      COALESCE(c80.nb_pharmacies_80pct_ca, 0) as nb_pharmacies_80pct_ca,
      ROUND(
        COALESCE(c80.nb_pharmacies_80pct_ca, 0) * 100.0 / 
        NULLIF(COALESCE(mc.nb_pharmacies_total, 1), 0), 1
      ) as pct_pharmacies_80pct_ca,
      
      ROUND(COALESCE(mc.ca_moyen_pharmacie, 0)::numeric, 2) as ca_moyen_pharmacie,
      ROUND(COALESCE(mc.ca_median_pharmacie, 0)::numeric, 2) as ca_median_pharmacie,
      
      ROUND(COALESCE(mc.quantite_moyenne_pharmacie, 0)::numeric, 0) as quantite_moyenne_pharmacie,
      ROUND(COALESCE(mc.quantite_mediane_pharmacie, 0)::numeric, 0) as quantite_mediane_pharmacie,
      
      ROUND(
        COALESCE(tp.pharmacies_avec_produit, 0) * 100.0 / 
        NULLIF(COALESCE(tp.total_pharmacies_reseau, 1), 0), 1
      ) as taux_penetration_produit_pct,
      COALESCE(tp.pharmacies_avec_produit, 0) as pharmacies_avec_produit,
      COALESCE(tp.total_pharmacies_reseau, 0) as total_pharmacies_reseau,
      
      ROUND(COALESCE(mc.ca_total, 0), 2) as ca_total,
      COALESCE(mc.quantite_totale, 0) as quantite_totale,
      COALESCE(mc.nb_pharmacies_total, 0) as nb_pharmacies_vendeuses_total

    FROM pharmacies_vendeuses pv
    CROSS JOIN total_pharmacies_produits tpp
    FULL OUTER JOIN concentration_80pct c80 ON true
    FULL OUTER JOIN metriques_centrales mc ON true
    FULL OUTER JOIN taux_penetration tp ON true;
  `;

  console.log('🔍 [API] Executing Pharmacies KPI query:', {
    dateRange,
    productCodesLength: allProductCodes.length,
    pharmacyIdsLength: pharmacyIds?.length || 0,
    paramsLength: params.length,
    hasProductFilter,
    hasPharmacyFilter
  });

  try {
    const result = await db.query(query, params);

    if (result.length === 0) {
      return getDefaultPharmaciesKpiResponse();
    }

    return formatPharmaciesKpiResponse(result[0]);
  } catch (error) {
    console.error('❌ [API] Database query failed:', error);
    throw error;
  }
}

function getDefaultPharmaciesKpiResponse(): Omit<PharmaciesKpiMetricsResponse, 'queryTime' | 'cached' | 'comparison'> {
  return {
    nb_pharmacies_vendeuses: 0,
    pct_pharmacies_vendeuses_selection: 0,
    nb_pharmacies_80pct_ca: 0,
    pct_pharmacies_80pct_ca: 0,
    ca_moyen_pharmacie: 0,
    ca_median_pharmacie: 0,
    quantite_moyenne_pharmacie: 0,
    quantite_mediane_pharmacie: 0,
    taux_penetration_produit_pct: 0,
    pharmacies_avec_produit: 0,
    total_pharmacies_reseau: 0,
    ca_total: 0,
    quantite_totale: 0,
    nb_pharmacies_vendeuses_total: 0
  };
}

function formatPharmaciesKpiResponse(row: any): Omit<PharmaciesKpiMetricsResponse, 'queryTime' | 'cached' | 'comparison'> {
  return {
    nb_pharmacies_vendeuses: Number(row.nb_pharmacies_vendeuses) || 0,
    pct_pharmacies_vendeuses_selection: Number(row.pct_pharmacies_vendeuses_selection) || 0,
    nb_pharmacies_80pct_ca: Number(row.nb_pharmacies_80pct_ca) || 0,
    pct_pharmacies_80pct_ca: Number(row.pct_pharmacies_80pct_ca) || 0,
    ca_moyen_pharmacie: Number(row.ca_moyen_pharmacie) || 0,
    ca_median_pharmacie: Number(row.ca_median_pharmacie) || 0,
    quantite_moyenne_pharmacie: Number(row.quantite_moyenne_pharmacie) || 0,
    quantite_mediane_pharmacie: Number(row.quantite_mediane_pharmacie) || 0,
    taux_penetration_produit_pct: Number(row.taux_penetration_produit_pct) || 0,
    pharmacies_avec_produit: Number(row.pharmacies_avec_produit) || 0,
    total_pharmacies_reseau: Number(row.total_pharmacies_reseau) || 0,
    ca_total: Number(row.ca_total) || 0,
    quantite_totale: Number(row.quantite_totale) || 0,
    nb_pharmacies_vendeuses_total: Number(row.nb_pharmacies_vendeuses_total) || 0
  };
}