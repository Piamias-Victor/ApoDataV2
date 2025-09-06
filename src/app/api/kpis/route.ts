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
   readonly montant_achat_ht: number;
   readonly montant_marge: number;
   readonly quantite_vendue: number;
   readonly quantite_achetee: number;
 } | undefined;
 readonly queryTime: number;
 readonly cached: boolean;
 readonly usedMaterializedView?: boolean;
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
   
   let comparison: { ca_ttc: number; montant_achat_ht: number; montant_marge: number; quantite_vendue: number; quantite_achetee: number; } | undefined;
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
   
   console.log('✅ [API] KPI calculation completed', {
     ca_ttc: response.ca_ttc,
     queryTime: response.queryTime,
     hasComparison: !!comparison,
     usedMV: response.usedMaterializedView
   });

   return NextResponse.json(response);

 } catch (error) {
   console.error('❌ [API] KPI calculation failed:', error);
   return NextResponse.json({ 
     error: error instanceof Error ? error.message : 'Internal server error' 
   }, { status: 500 });
 }
}

// FONCTIONS DE DÉTECTION ET ROUTAGE MV
function detectMVEligibility(dateRange: { start: string; end: string }, hasProductFilter: boolean): boolean {
 const startDate = new Date(dateRange.start);
 const endDate = new Date(dateRange.end);
 
 // Critères d'éligibilité MV
 const isMonthlyAligned = startDate.getDate() === 1 && 
                         endDate.getDate() === new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
 const isWithinMVRange = startDate >= new Date('2024-01-01');
 const noProductFilters = !hasProductFilter;
 
 return isMonthlyAligned && isWithinMVRange && noProductFilters;
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
   nb_pharmacies: 0,
   usedMaterializedView: false
 };
}

function formatKpiResponse(row: any, usedMV: boolean): Omit<KpiMetricsResponse, 'queryTime' | 'cached' | 'comparison'> {
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
   nb_pharmacies: Number(row.nb_pharmacies) || 0,
   usedMaterializedView: usedMV
 };
}

// REQUÊTE OPTIMISÉE VIA MATERIALIZED VIEW
// src/app/api/kpis/route.ts - Correction ligne 194

async function fetchFromMaterializedView(request: KpiRequest): Promise<Omit<KpiMetricsResponse, 'queryTime' | 'cached' | 'comparison'>> {
  const { dateRange, pharmacyIds } = request;
  
  // Typage strict des paramètres
  const params: (string | string[])[] = [dateRange.start, dateRange.end];
  let pharmacyFilter = '';
  let pharmacyFilterForReferences = '';
  
  if (pharmacyIds && pharmacyIds.length > 0) {
    pharmacyFilter = 'AND pharmacy_id = ANY($3::uuid[])';
    pharmacyFilterForReferences = 'AND ip.pharmacy_id = ANY($3::uuid[])';
    params.push(pharmacyIds); // ✅ Maintenant OK avec le bon type
  }
  
  // Reste du code identique...
 const query = `
   WITH mv_aggregates AS (
     SELECT 
       SUM(ca_ttc_total) as ca_ttc,
       SUM(montant_achat_ht_total) as montant_achat_ht,
       SUM(montant_marge_reel) as montant_marge,
       CASE 
         WHEN SUM(ca_ttc_total) > 0 
         THEN (SUM(montant_marge_reel) / SUM(ca_ttc_total)) * 100
         ELSE 0
       END as pourcentage_marge,
       SUM(valeur_stock_ht_total) as valeur_stock_ht,
       SUM(quantite_stock_total) as quantite_stock,
       SUM(total_quantity_sold) as quantite_vendue,
       SUM(total_quantity_bought) as quantite_achetee,
       CASE 
         WHEN SUM(total_quantity_sold) > 0 AND SUM(quantite_stock_total) > 0
         THEN ROUND(SUM(quantite_stock_total) / (SUM(total_quantity_sold) / 365))
         ELSE NULL
       END as jours_de_stock,
       COUNT(DISTINCT pharmacy_id) as nb_pharmacies
     FROM mv_kpi_monthly
     WHERE periode >= DATE_TRUNC('month', $1::date)
       AND periode <= DATE_TRUNC('month', $2::date)
       ${pharmacyFilter}
   ),
   unique_references AS (
     SELECT COUNT(DISTINCT ip.code_13_ref_id) as nb_references_produits
     FROM data_internalproduct ip
     WHERE 1=1 ${pharmacyFilterForReferences}
   )
   SELECT 
     mv.*,
     ur.nb_references_produits
   FROM mv_aggregates mv, unique_references ur
 `;
 
 console.log('🚀 [API] Executing MV query:', { 
   dateRange, 
   hasPharmacyFilter: !!pharmacyFilter,
   paramsLength: params.length 
 });
 
 try {
   const result = await db.query(query, params);
   
   if (result.length === 0) {
     return { ...getDefaultKpiResponse(), usedMaterializedView: true };
   }
   
   return formatKpiResponse(result[0], true);
 } catch (error) {
   console.error('❌ [API] MV query failed:', error);
   throw error;
 }
}

// REQUÊTE CLASSIQUE VIA TABLES BRUTES
async function fetchFromRawTables(request: KpiRequest): Promise<Omit<KpiMetricsResponse, 'queryTime' | 'cached' | 'comparison'>> {
 const { dateRange, productCodes = [], laboratoryCodes = [], categoryCodes = [], pharmacyIds } = request;

 const allProductCodes = Array.from(new Set([
   ...productCodes,
   ...laboratoryCodes,
   ...categoryCodes
 ]));

 const hasProductFilter = allProductCodes.length > 0;
 const hasPharmacyFilter = pharmacyIds && pharmacyIds.length > 0;

 // Protection contre requêtes trop larges
 if (!hasProductFilter && !hasPharmacyFilter) {
   throw new Error('Des filtres sont requis pour éviter les requêtes trop larges');
 }

 const productFilter = hasProductFilter 
   ? 'AND ip.code_13_ref_id = ANY($3::text[])'
   : '';

 const pharmacyFilter = hasPharmacyFilter
   ? (hasProductFilter ? 'AND ip.pharmacy_id = ANY($4::uuid[])' : 'AND ip.pharmacy_id = ANY($3::uuid[])')
   : '';

 const params: any[] = [dateRange.start, dateRange.end];
 
 if (hasProductFilter) {
   params.push(allProductCodes);
 }
 
 if (hasPharmacyFilter) {
   params.push(pharmacyIds);
 }

 const query = `
   WITH period_sales AS (
     SELECT 
       COUNT(DISTINCT ip.code_13_ref_id) as nb_references_produits,
       COUNT(DISTINCT ip.pharmacy_id) as nb_pharmacies,
       SUM(s.quantity) as total_quantity_sold,
       SUM(s.quantity * ins.price_with_tax) as ca_ttc_total,
       SUM(s.quantity * (
         (ins.price_with_tax / (1 + COALESCE(ip."TVA", 0) / 100.0)) - ins.weighted_average_price
       )) as montant_marge_reel
     FROM data_sales s
     JOIN data_inventorysnapshot ins ON s.product_id = ins.id
     JOIN data_internalproduct ip ON ins.product_id = ip.id
     WHERE s.date >= $1::date AND s.date <= $2::date
       AND ins.weighted_average_price > 0
       ${productFilter}
       ${pharmacyFilter}
   ),
   period_purchases AS (
     SELECT 
       SUM(po.qte) as total_quantity_bought,
       SUM(po.qte * COALESCE(closest_snap.weighted_average_price, 0)) as montant_achat_ht_total
     FROM data_productorder po
     INNER JOIN data_order o ON po.order_id = o.id
     INNER JOIN data_internalproduct ip ON po.product_id = ip.id
     LEFT JOIN LATERAL (
       SELECT weighted_average_price
       FROM data_inventorysnapshot ins2
       WHERE ins2.product_id = po.product_id
         AND ins2.weighted_average_price > 0
       ORDER BY ins2.date DESC
       LIMIT 1
     ) closest_snap ON true
     WHERE o.created_at >= $1::date AND o.created_at < ($2::date + interval '1 day')
       ${productFilter}
       ${pharmacyFilter}
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
       ${productFilter}
       ${pharmacyFilter}
   )
   SELECT 
     COALESCE(ps.ca_ttc_total, 0) as ca_ttc,
     COALESCE(pp.montant_achat_ht_total, 0) as montant_achat_ht,
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

 console.log('🔍 [API] Executing Raw Tables query:', {
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
     return { ...getDefaultKpiResponse(), usedMaterializedView: false };
   }

   return formatKpiResponse(result[0], false);
 } catch (error) {
   console.error('❌ [API] Database query failed:', error);
   throw error;
 }
}

// FONCTION PRINCIPALE DE CALCUL AVEC ROUTAGE INTELLIGENT
async function calculateKpiMetrics(request: KpiRequest): Promise<Omit<KpiMetricsResponse, 'queryTime' | 'cached' | 'comparison'>> {
 const { dateRange, productCodes = [], laboratoryCodes = [], categoryCodes = [] } = request;

 const allProductCodes = Array.from(new Set([
   ...productCodes,
   ...laboratoryCodes,
   ...categoryCodes
 ]));

 const hasProductFilter = allProductCodes.length > 0;

 // DÉTECTION MV vs RAW TABLES
 const canUseMV = detectMVEligibility(dateRange, hasProductFilter);
 
 if (canUseMV) {
   console.log('🚀 [API] Using Materialized View - Fast path');
   return await fetchFromMaterializedView(request);
 } else {
   console.log('🔍 [API] Using Raw Tables - Flexible path');
   return await fetchFromRawTables(request);
 }
}