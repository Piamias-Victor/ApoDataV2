// src/app/api/ventes/kpis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SalesKpiRequest {
  dateRange: { start: string; end: string; };
  comparisonDateRange?: { start: string; end: string; };
  productCodes?: string[];
  laboratoryCodes?: string[];
  categoryCodes?: string[];
  pharmacyIds?: string[];
}

function validateSalesKpiRequest(body: any): SalesKpiRequest {
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

interface SalesKpiMetricsResponse {
  readonly quantite_vendue: number;
  readonly ca_ttc: number;
  readonly part_marche_ca_pct: number;
  readonly part_marche_marge_pct: number;
  readonly nb_references_selection: number;
  readonly nb_references_80pct_ca: number;
  readonly montant_marge: number;
  readonly taux_marge_pct: number;
  readonly comparison?: {
    readonly quantite_vendue: number;
    readonly ca_ttc: number;
    readonly part_marche_ca_pct: number;
    readonly part_marche_marge_pct: number;
    readonly nb_references_selection: number;
    readonly nb_references_80pct_ca: number;
    readonly montant_marge: number;
    readonly taux_marge_pct: number;
  } | undefined;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly usedMaterializedView?: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse<SalesKpiMetricsResponse | { error: string }>> {
  const startTime = Date.now();
  console.log('🔥 [API] Sales KPI Request started');

  try {
    const body = await request.json();
    console.log('📝 [API] Request body received:', JSON.stringify(body, null, 2));

    const validatedRequest = validateSalesKpiRequest(body);
    
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

    const salesMetrics = await calculateSalesKpiMetrics(validatedRequest);
    
    let comparison: {
      quantite_vendue: number;
      ca_ttc: number;
      part_marche_ca_pct: number;
      part_marche_marge_pct: number;
      nb_references_selection: number;
      nb_references_80pct_ca: number;
      montant_marge: number;
      taux_marge_pct: number;
    } | undefined;
    
    if (validatedRequest.comparisonDateRange) {
      console.log('📊 [API] Calculating comparison period metrics');
      const comparisonRequest: SalesKpiRequest = {
        dateRange: validatedRequest.comparisonDateRange,
        ...(validatedRequest.productCodes && { productCodes: validatedRequest.productCodes }),
        ...(validatedRequest.laboratoryCodes && { laboratoryCodes: validatedRequest.laboratoryCodes }),
        ...(validatedRequest.categoryCodes && { categoryCodes: validatedRequest.categoryCodes }),
        ...(validatedRequest.pharmacyIds && { pharmacyIds: validatedRequest.pharmacyIds })
      };
      const comparisonMetrics = await calculateSalesKpiMetrics(comparisonRequest);
      comparison = {
        quantite_vendue: comparisonMetrics.quantite_vendue,
        ca_ttc: comparisonMetrics.ca_ttc,
        part_marche_ca_pct: comparisonMetrics.part_marche_ca_pct,
        part_marche_marge_pct: comparisonMetrics.part_marche_marge_pct,
        nb_references_selection: comparisonMetrics.nb_references_selection,
        nb_references_80pct_ca: comparisonMetrics.nb_references_80pct_ca,
        montant_marge: comparisonMetrics.montant_marge,
        taux_marge_pct: comparisonMetrics.taux_marge_pct
      };
    }

    const response: SalesKpiMetricsResponse = {
      ...salesMetrics,
      comparison,
      queryTime: Date.now() - startTime,
      cached: false
    };
    
    console.log('✅ [API] Sales KPI calculation completed', {
      quantite_vendue: response.quantite_vendue,
      ca_ttc: response.ca_ttc,
      part_marche_ca_pct: response.part_marche_ca_pct,
      queryTime: response.queryTime,
      hasComparison: !!comparison,
      usedMV: response.usedMaterializedView
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [API] Sales KPI calculation failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

// DÉTECTION ÉLIGIBILITÉ MATERIALIZED VIEW
function canUseMaterializedView(dateRange: { start: string; end: string }, hasProductFilter: boolean): boolean {
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  
  // Vérifier si les dates sont alignées sur des mois complets
  const isStartOfMonth = startDate.getDate() === 1;
  const lastDayOfEndMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
  const isEndOfMonth = endDate.getDate() === lastDayOfEndMonth;
  
  // Vérifier si dans la plage de données MV
  const isWithinMVRange = startDate >= new Date('2024-01-01');
  
  // Pas de filtres produits
  const noProductFilters = !hasProductFilter;
  
  const eligible = isStartOfMonth && isEndOfMonth && isWithinMVRange && noProductFilters;
  
  console.log('🤔 [API] MV Eligibility Check:', {
    isStartOfMonth,
    isEndOfMonth,
    isWithinMVRange,
    noProductFilters,
    eligible
  });
  
  return eligible;
}

// REQUÊTE VIA MATERIALIZED VIEW
async function fetchFromMaterializedView(request: SalesKpiRequest): Promise<Omit<SalesKpiMetricsResponse, 'queryTime' | 'cached' | 'comparison'>> {
  const { dateRange, pharmacyIds } = request;
  
  const params: any[] = [
    dateRange.start, 
    dateRange.end
  ];
  
  let pharmacyFilter = '';
  if (pharmacyIds && pharmacyIds.length > 0) {
    pharmacyFilter = 'AND pharmacy_id = ANY($3::uuid[])';
    params.push(pharmacyIds);
  }
  
  const query = `
    SELECT 
      SUM(quantite_vendue) as quantite_vendue,
      SUM(ca_ttc) as ca_ttc,
      100.0 as part_marche_ca_pct,
      100.0 as part_marche_marge_pct,
      SUM(nb_references_selection) as nb_references_selection,
      0 as nb_references_80pct_ca,
      SUM(montant_marge) as montant_marge,
      CASE 
        WHEN SUM(ca_ttc) > 0 
        THEN (SUM(montant_marge) / SUM(ca_ttc)) * 100
        ELSE 0
      END as taux_marge_pct
    FROM mv_sales_kpi_monthly
    WHERE periode >= DATE_TRUNC('month', $1::date)
      AND periode <= DATE_TRUNC('month', $2::date)
      ${pharmacyFilter};
  `;
  
  console.log('🚀 [API] Using Materialized View - Fast path');
  
  try {
    const result = await db.query(query, params);
    
    if (result.length === 0) {
      return getDefaultSalesKpiResponse(true);
    }
    
    return formatSalesKpiResponse(result[0], true);
  } catch (error) {
    console.error('❌ [API] MV query failed:', error);
    throw error;
  }
}

// REQUÊTE VIA TABLES BRUTES (CODE ORIGINAL)
async function fetchFromRawTables(request: SalesKpiRequest): Promise<Omit<SalesKpiMetricsResponse, 'queryTime' | 'cached' | 'comparison'>> {
  const { dateRange, productCodes = [], laboratoryCodes = [], categoryCodes = [], pharmacyIds } = request;

  const allProductCodes = Array.from(new Set([
    ...productCodes,
    ...laboratoryCodes,
    ...categoryCodes
  ]));

  const hasProductFilter = allProductCodes.length > 0;
  const hasPharmacyFilter = pharmacyIds && pharmacyIds.length > 0;

  // Construction des filtres pour sélection
  const productFilterSelection = hasProductFilter 
    ? 'AND ip.code_13_ref_id = ANY($3::text[])'
    : '';

  const pharmacyFilterSelection = hasPharmacyFilter
    ? (hasProductFilter ? 'AND ip.pharmacy_id = ANY($4::uuid[])' : 'AND ip.pharmacy_id = ANY($3::uuid[])')
    : '';

  // Construction des filtres pour global (pas de filtres produits)
  const pharmacyFilterGlobal = hasPharmacyFilter
    ? 'AND ip.pharmacy_id = ANY($' + (hasProductFilter ? '4' : '3') + '::uuid[])'
    : '';

  // Construction des paramètres
  const params: any[] = [dateRange.start, dateRange.end];
  
  if (hasProductFilter) {
    params.push(allProductCodes);
  }
  
  if (hasPharmacyFilter) {
    params.push(pharmacyIds);
  }

  const query = `
    WITH selection_metrics AS (
      SELECT 
        COUNT(DISTINCT ip.code_13_ref_id) as nb_references_selection,
        SUM(s.quantity) as quantite_vendue_selection,
        SUM(s.quantity * ins.price_with_tax) as ca_ttc_selection,
        SUM(s.quantity * (
          (ins.price_with_tax / (1 + COALESCE(ip."TVA", 0) / 100.0)) - ins.weighted_average_price
        )) as montant_marge_selection
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date AND s.date <= $2::date
        AND ins.weighted_average_price > 0
        ${productFilterSelection}
        ${pharmacyFilterSelection}
    ),
    global_metrics AS (
      SELECT 
        SUM(s.quantity * ins.price_with_tax) as ca_ttc_global,
        SUM(s.quantity * (
          (ins.price_with_tax / (1 + COALESCE(ip."TVA", 0) / 100.0)) - ins.weighted_average_price
        )) as montant_marge_global
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date AND s.date <= $2::date
        AND ins.weighted_average_price > 0
        ${pharmacyFilterGlobal}
    ),
    products_ca_ranking AS (
      SELECT 
        ip.code_13_ref_id,
        SUM(s.quantity * ins.price_with_tax) as ca_ttc_produit,
        ROW_NUMBER() OVER (ORDER BY SUM(s.quantity * ins.price_with_tax) DESC) as rang
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date AND s.date <= $2::date
        AND ins.weighted_average_price > 0
        ${productFilterSelection}
        ${pharmacyFilterSelection}
      GROUP BY ip.code_13_ref_id
      HAVING SUM(s.quantity * ins.price_with_tax) > 0
    ),
    pareto_80_analysis AS (
      SELECT 
        COUNT(*) as nb_references_80pct_ca
      FROM (
        SELECT 
          code_13_ref_id,
          ca_ttc_produit,
          SUM(ca_ttc_produit) OVER (ORDER BY ca_ttc_produit DESC ROWS UNBOUNDED PRECEDING) as ca_cumule,
          (SELECT SUM(ca_ttc_produit) FROM products_ca_ranking) as ca_total
        FROM products_ca_ranking
      ) cumul
      WHERE ca_cumule <= (ca_total * 0.8)
    )
    SELECT 
      COALESCE(sm.quantite_vendue_selection, 0) as quantite_vendue,
      COALESCE(sm.ca_ttc_selection, 0) as ca_ttc,
      CASE 
        WHEN COALESCE(gm.ca_ttc_global, 0) > 0 
        THEN (COALESCE(sm.ca_ttc_selection, 0) / COALESCE(gm.ca_ttc_global, 0)) * 100
        ELSE 0
      END as part_marche_ca_pct,
      CASE 
        WHEN COALESCE(gm.montant_marge_global, 0) > 0 
        THEN (COALESCE(sm.montant_marge_selection, 0) / COALESCE(gm.montant_marge_global, 0)) * 100
        ELSE 0
      END as part_marche_marge_pct,
      COALESCE(sm.nb_references_selection, 0) as nb_references_selection,
      COALESCE(p80.nb_references_80pct_ca, 0) as nb_references_80pct_ca,
      COALESCE(sm.montant_marge_selection, 0) as montant_marge,
      CASE 
        WHEN COALESCE(sm.ca_ttc_selection, 0) > 0 
        THEN (COALESCE(sm.montant_marge_selection, 0) / COALESCE(sm.ca_ttc_selection, 0)) * 100
        ELSE 0
      END as taux_marge_pct
    FROM selection_metrics sm
    LEFT JOIN global_metrics gm ON true
    LEFT JOIN pareto_80_analysis p80 ON true;
  `;

  console.log('🔍 [API] Using Raw Tables - Flexible path');

  try {
    const result = await db.query(query, params);

    if (result.length === 0) {
      return getDefaultSalesKpiResponse(false);
    }

    return formatSalesKpiResponse(result[0], false);
  } catch (error) {
    console.error('❌ [API] Database query failed:', error);
    throw error;
  }
}

// FONCTION PRINCIPALE AVEC ROUTAGE INTELLIGENT
async function calculateSalesKpiMetrics(request: SalesKpiRequest): Promise<Omit<SalesKpiMetricsResponse, 'queryTime' | 'cached' | 'comparison'>> {
  const { productCodes = [], laboratoryCodes = [], categoryCodes = [] } = request;

  const allProductCodes = Array.from(new Set([
    ...productCodes,
    ...laboratoryCodes,
    ...categoryCodes
  ]));

  const hasProductFilter = allProductCodes.length > 0;

  // DÉTECTION MV vs RAW TABLES
  const canUseMV = canUseMaterializedView(request.dateRange, hasProductFilter);
  
  if (canUseMV) {
    return await fetchFromMaterializedView(request);
  } else {
    return await fetchFromRawTables(request);
  }
}

// FONCTIONS UTILITAIRES
function getDefaultSalesKpiResponse(usedMV: boolean): Omit<SalesKpiMetricsResponse, 'queryTime' | 'cached' | 'comparison'> {
  return {
    quantite_vendue: 0,
    ca_ttc: 0,
    part_marche_ca_pct: 0,
    part_marche_marge_pct: 0,
    nb_references_selection: 0,
    nb_references_80pct_ca: 0,
    montant_marge: 0,
    taux_marge_pct: 0,
    usedMaterializedView: usedMV
  };
}

function formatSalesKpiResponse(row: any, usedMV: boolean): Omit<SalesKpiMetricsResponse, 'queryTime' | 'cached' | 'comparison'> {
  return {
    quantite_vendue: Number(row.quantite_vendue) || 0,
    ca_ttc: Number(row.ca_ttc) || 0,
    part_marche_ca_pct: Number(row.part_marche_ca_pct) || 0,
    part_marche_marge_pct: Number(row.part_marche_marge_pct) || 0,
    nb_references_selection: Number(row.nb_references_selection) || 0,
    nb_references_80pct_ca: Number(row.nb_references_80pct_ca) || 0,
    montant_marge: Number(row.montant_marge) || 0,
    taux_marge_pct: Number(row.taux_marge_pct) || 0,
    usedMaterializedView: usedMV
  };
}