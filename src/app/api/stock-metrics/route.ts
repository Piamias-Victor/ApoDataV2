// src/app/api/stock-metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
interface StockMetricsRequest {
  dateRange: { start: string; end: string; };
  comparisonDateRange?: { start: string; end: string; };
  productCodes?: string[];
  laboratoryCodes?: string[];
  categoryCodes?: string[];
  pharmacyIds?: string[];
}

function validateStockMetricsRequest(body: any): StockMetricsRequest {
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

interface StockMetricsResponse {
  readonly quantite_stock_actuel_total: number;
  readonly montant_stock_actuel_total: number;
  readonly stock_moyen_12_mois: number;
  readonly jours_de_stock_actuels: number | null;
  readonly nb_references_produits: number;
  readonly nb_pharmacies: number;
  readonly comparison?: {
    readonly quantite_stock_actuel_total: number;
    readonly montant_stock_actuel_total: number;
    readonly stock_moyen_12_mois: number;
    readonly jours_de_stock_actuels: number | null;
  } | undefined;
  readonly queryTime: number;
  readonly cached: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse<StockMetricsResponse | { error: string }>> {
  const startTime = Date.now();
  console.log('🔥 [API] Stock Metrics Request started');

  try {
    const body = await request.json();
    console.log('📝 [API] Request body received:', JSON.stringify(body, null, 2));

    const validatedRequest = validateStockMetricsRequest(body);
    
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

    const stockMetrics = await calculateStockMetrics(validatedRequest);
    
    let comparison: { 
      quantite_stock_actuel_total: number; 
      montant_stock_actuel_total: number; 
      stock_moyen_12_mois: number; 
      jours_de_stock_actuels: number | null; 
    } | undefined;
    
    if (validatedRequest.comparisonDateRange) {
      console.log('📊 [API] Calculating comparison period stock metrics');
      const comparisonRequest: StockMetricsRequest = {
        dateRange: validatedRequest.comparisonDateRange,
        ...(validatedRequest.productCodes && { productCodes: validatedRequest.productCodes }),
        ...(validatedRequest.laboratoryCodes && { laboratoryCodes: validatedRequest.laboratoryCodes }),
        ...(validatedRequest.categoryCodes && { categoryCodes: validatedRequest.categoryCodes }),
        ...(validatedRequest.pharmacyIds && { pharmacyIds: validatedRequest.pharmacyIds })
      };
      const comparisonMetrics = await calculateStockMetrics(comparisonRequest);
      comparison = {
        quantite_stock_actuel_total: comparisonMetrics.quantite_stock_actuel_total,
        montant_stock_actuel_total: comparisonMetrics.montant_stock_actuel_total,
        stock_moyen_12_mois: comparisonMetrics.stock_moyen_12_mois,
        jours_de_stock_actuels: comparisonMetrics.jours_de_stock_actuels
      };
    }

    const response: StockMetricsResponse = {
      ...stockMetrics,
      comparison,
      queryTime: Date.now() - startTime,
      cached: false
    };
    
    console.log('✅ [API] Stock metrics calculation completed', {
      quantite_stock: response.quantite_stock_actuel_total,
      montant_stock: response.montant_stock_actuel_total,
      jours_stock: response.jours_de_stock_actuels,
      queryTime: response.queryTime,
      hasComparison: !!comparison
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [API] Stock metrics calculation failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

async function calculateStockMetrics(request: StockMetricsRequest): Promise<Omit<StockMetricsResponse, 'queryTime' | 'cached' | 'comparison'>> {
  const { dateRange, productCodes = [], laboratoryCodes = [], categoryCodes = [], pharmacyIds } = request;

  const allProductCodes = Array.from(new Set([
    ...productCodes,
    ...laboratoryCodes,
    ...categoryCodes
  ]));

  const hasProductFilter = allProductCodes.length > 0;
  const hasPharmacyFilter = pharmacyIds && pharmacyIds.length > 0;

  // Construction des filtres dynamiques avec numérotation correcte
  const productFilter = hasProductFilter 
    ? 'AND ip.code_13_ref_id = ANY($1::text[])'
    : '';

  const pharmacyFilter = hasPharmacyFilter
    ? (hasProductFilter ? 'AND ip.pharmacy_id = ANY($2::uuid[])' : 'AND ip.pharmacy_id = ANY($1::uuid[])')
    : '';

  // Construction des paramètres (pas de dates, juste les filtres)
  const params: any[] = [];
  
  if (hasProductFilter) {
    params.push(allProductCodes);
  }
  
  if (hasPharmacyFilter) {
    params.push(pharmacyIds);
  }

  // Requête simplifiée basée sur le pattern KPI existant
  const query = `
    WITH current_stock AS (
      SELECT DISTINCT ON (ip.code_13_ref_id)
        ip.code_13_ref_id,
        ins.stock as quantite_stock_actuel,
        ins.weighted_average_price as prix_stock_unitaire,
        ins.stock * ins.weighted_average_price as valeur_stock_produit
      FROM data_inventorysnapshot ins
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE ins.weighted_average_price > 0
        ${productFilter}
        ${pharmacyFilter}
      ORDER BY ip.code_13_ref_id, ins.date DESC
    ),
    average_monthly_sales AS (
      SELECT 
        ip.code_13_ref_id,
        SUM(COALESCE(sales_data.quantite_vendue, 0)) as ventes_12_mois_total
      FROM data_internalproduct ip
      LEFT JOIN (
        SELECT 
          ip2.code_13_ref_id,
          SUM(s.quantity) as quantite_vendue
        FROM data_sales s
        JOIN data_inventorysnapshot ins ON s.product_id = ins.id
        JOIN data_internalproduct ip2 ON ins.product_id = ip2.id
        WHERE s.date >= CURRENT_DATE - interval '12 months'
          AND s.date <= CURRENT_DATE
          ${productFilter.replace('ip.', 'ip2.')}
          ${pharmacyFilter.replace('ip.', 'ip2.')}
        GROUP BY ip2.code_13_ref_id
      ) sales_data ON ip.code_13_ref_id = sales_data.code_13_ref_id
      WHERE 1=1
        ${productFilter}
        ${pharmacyFilter}
      GROUP BY ip.code_13_ref_id
    )
    SELECT 
      -- Quantités stock
      COALESCE(SUM(cs.quantite_stock_actuel), 0) as quantite_stock_actuel_total,
      
      -- Valeur stock
      COALESCE(ROUND(SUM(cs.valeur_stock_produit), 2), 0) as montant_stock_actuel_total,
      
      -- Stock moyen (approximation avec stock actuel)
      COALESCE(ROUND(AVG(cs.quantite_stock_actuel), 0), 0) as stock_moyen_12_mois,
      
      -- Jours de stock corrigé : Stock ÷ (Ventes 12 mois ÷ 365)
      CASE 
        WHEN SUM(ams.ventes_12_mois_total) > 0 
        THEN ROUND(
          COALESCE(SUM(cs.quantite_stock_actuel), 0) / (SUM(ams.ventes_12_mois_total) / 365.0), 
          1
        )
        ELSE NULL
      END as jours_de_stock_actuels,
      
      -- Métadonnées
      COUNT(DISTINCT cs.code_13_ref_id) as nb_references_produits,
      COUNT(DISTINCT ip_meta.pharmacy_id) as nb_pharmacies,
      
      -- DEBUG : Total ventes 12 mois pour comprendre le calcul
      SUM(ams.ventes_12_mois_total) as debug_ventes_12_mois_total
    FROM current_stock cs
    LEFT JOIN average_monthly_sales ams ON cs.code_13_ref_id = ams.code_13_ref_id
    LEFT JOIN data_internalproduct ip_meta ON cs.code_13_ref_id = ip_meta.code_13_ref_id
    WHERE ip_meta.id IS NOT NULL
      ${productFilter.replace('ip.', 'ip_meta.')}
      ${pharmacyFilter.replace('ip.', 'ip_meta.')};
  `;

  console.log('🔍 [API] Executing Stock metrics query:', {
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
      console.log('⚠️ [API] No stock data found');
      return {
        quantite_stock_actuel_total: 0,
        montant_stock_actuel_total: 0,
        stock_moyen_12_mois: 0,
        jours_de_stock_actuels: null,
        nb_references_produits: 0,
        nb_pharmacies: 0
      };
    }

    const row = result[0];
    console.log('📊 [API] Stock metrics calculated:', {
      quantite_stock: Number(row.quantite_stock_actuel_total) || 0,
      montant_stock: Number(row.montant_stock_actuel_total) || 0,
      stock_moyen: Number(row.stock_moyen_12_mois) || 0,
      jours_stock: row.jours_de_stock_actuels ? Number(row.jours_de_stock_actuels) : null
    });

    return {
      quantite_stock_actuel_total: Number(row.quantite_stock_actuel_total) || 0,
      montant_stock_actuel_total: Number(row.montant_stock_actuel_total) || 0,
      stock_moyen_12_mois: Number(row.stock_moyen_12_mois) || 0,
      jours_de_stock_actuels: row.jours_de_stock_actuels ? Number(row.jours_de_stock_actuels) : null,
      nb_references_produits: Number(row.nb_references_produits) || 0,
      nb_pharmacies: Number(row.nb_pharmacies) || 0
    };

  } catch (error) {
    console.error('❌ [API] Database query failed:', error);
    throw error;
  }
}