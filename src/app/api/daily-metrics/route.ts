// src/app/api/daily-metrics/route.ts - VERSION OPTIMISÉE AVEC MV
import { NextRequest, NextResponse } from 'next/server';
import { getSecurityContext } from '@/lib/api-security';
import { db } from '@/lib/db';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true' && 
                     process.env.UPSTASH_REDIS_REST_URL && 
                     process.env.UPSTASH_REDIS_REST_TOKEN;
const CACHE_TTL = 43200; // 12 heures

interface DailyMetricsRequest {
  dateRange: { start: string; end: string };
  productCodes?: string[];
  pharmacyId?: string;
}

interface DailyMetricsEntry {
  date: string;
  quantite_vendue_jour: number;
  ca_ttc_jour: number;
  marge_jour: number;
  quantite_achat_jour: number;
  montant_achat_jour: number;
  stock_jour: number;
  cumul_quantite_vendue: number;
  cumul_quantite_achetee: number;
  cumul_ca_ttc: number;
  cumul_montant_achat: number;
  cumul_marge: number;
}

interface DailyMetricsResponse {
  data: DailyMetricsEntry[];
  queryTime: number;
  cached: boolean;
  usedMaterializedView?: boolean;
}

// ===================================================================
// FONCTIONS DE DÉTECTION MV ELIGIBILITY
// ===================================================================

function detectDailyMVEligibility(
  dateRange: { start: string; end: string },
  hasProductFilters: boolean,
  hasSpecificPharmacy: boolean
): boolean {
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  
  // Critères d'éligibilité MV quotidienne
  const isWithinMVRange = startDate >= new Date('2024-01-01') && endDate <= new Date();
  const noProductFilters = !hasProductFilters;
  const hasSinglePharmacy = hasSpecificPharmacy;
  
  console.log('🔍 [API] MV Eligibility Check:', {
    isWithinMVRange,
    noProductFilters,
    hasSinglePharmacy,
    eligible: isWithinMVRange && noProductFilters && hasSinglePharmacy
  });
  
  return isWithinMVRange && noProductFilters && hasSinglePharmacy;
}

// ===================================================================
// REQUÊTE OPTIMISÉE VIA MATERIALIZED VIEW QUOTIDIENNE
// ===================================================================

async function fetchFromDailyMaterializedView(
  dateRange: { start: string; end: string },
  pharmacyId: string
): Promise<{ data: DailyMetricsEntry[]; usedMV: boolean }> {
  
  const query = `
    SELECT 
      date_jour as date,
      quantite_vendue_jour,
      ca_ttc_jour,
      marge_jour,
      quantite_achat_jour,
      montant_achat_jour,
      stock_jour,
      cumul_quantite_vendue,
      cumul_quantite_achetee,
      cumul_ca_ttc,
      cumul_montant_achat,
      cumul_marge
    FROM mv_kpi_daily
    WHERE pharmacy_id = $1::uuid
      AND date_jour >= $2::date 
      AND date_jour <= $3::date
    ORDER BY date_jour ASC;
  `;
  
  const params = [pharmacyId, dateRange.start, dateRange.end];
  
  console.log('🚀 [API] Executing Daily MV query:', { 
    dateRange, 
    pharmacyId,
    paramsLength: params.length 
  });
  
  try {
    const rawResults = await db.query<any>(query, params);
    
    const results: DailyMetricsEntry[] = rawResults.map(row => ({
      date: typeof row.date === 'string' 
        ? row.date 
        : row.date instanceof Date 
          ? row.date.toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0],
      quantite_vendue_jour: Number(row.quantite_vendue_jour || 0),
      ca_ttc_jour: Number(row.ca_ttc_jour || 0),
      marge_jour: Number(row.marge_jour || 0),
      quantite_achat_jour: Number(row.quantite_achat_jour || 0),
      montant_achat_jour: Number(row.montant_achat_jour || 0),
      stock_jour: Number(row.stock_jour || 0),
      cumul_quantite_vendue: Number(row.cumul_quantite_vendue || 0),
      cumul_quantite_achetee: Number(row.cumul_quantite_achetee || 0),
      cumul_ca_ttc: Number(row.cumul_ca_ttc || 0),
      cumul_montant_achat: Number(row.cumul_montant_achat || 0),
      cumul_marge: Number(row.cumul_marge || 0)
    }));
    
    console.log('✅ [API] Daily MV query success:', {
      resultsCount: results.length,
      firstDate: results[0]?.date,
      lastDate: results[results.length - 1]?.date
    });
    
    return { data: results, usedMV: true };
    
  } catch (error) {
    console.error('❌ [API] Daily MV query failed:', error);
    throw error;
  }
}

// ===================================================================
// REQUÊTE CLASSIQUE VIA TABLES BRUTES (fallback)
// ===================================================================

async function fetchFromRawTablesDaily(
  dateRange: { start: string; end: string },
  productCodes: string[] | null,
  pharmacyId: string | null
): Promise<{ data: DailyMetricsEntry[]; usedMV: boolean }> {
  
  const params = [
    dateRange.start,  // $1
    dateRange.end,    // $2
    productCodes,     // $3 (peut être null)
    pharmacyId        // $4 (peut être null)
  ];

  const sqlQuery = `
    WITH calendar_period AS (
      SELECT generate_series($1::date, $2::date, '1 day'::interval)::date as date_jour
    ),
    daily_sales AS (
      SELECT 
        s.date,
        SUM(s.quantity) as quantite_vendue_jour,
        SUM(s.quantity * ins.price_with_tax) as ca_ttc_jour,
        SUM(s.quantity * (
          (ins.price_with_tax / (1 + ip."TVA" / 100.0)) - ins.weighted_average_price
        )) as montant_marge_jour
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE 1=1
        AND ($3::text[] IS NULL OR ip.code_13_ref_id = ANY($3::text[]))
        AND ($4::uuid IS NULL OR ip.pharmacy_id = $4::uuid)
        AND s.date >= $1::date AND s.date <= $2::date
        AND ins.weighted_average_price > 0
      GROUP BY s.date
    ),
    daily_purchases AS (
      SELECT 
        o.delivery_date as date_achat,
        SUM(po.qte_r) as quantite_achetee_jour,
        SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)) as montant_achat_ht_jour
      FROM data_productorder po
      JOIN data_order o ON po.order_id = o.id
      JOIN data_internalproduct ip ON po.product_id = ip.id
      LEFT JOIN LATERAL (
        SELECT weighted_average_price
        FROM data_inventorysnapshot ins2
        WHERE ins2.product_id = po.product_id
          AND ins2.weighted_average_price > 0
        ORDER BY ins2.date DESC
        LIMIT 1
      ) closest_snap ON true
      WHERE 1=1
        AND ($3::text[] IS NULL OR ip.code_13_ref_id = ANY($3::text[]))
        AND ($4::uuid IS NULL OR ip.pharmacy_id = $4::uuid)
        AND o.delivery_date >= $1::date 
        AND o.delivery_date <= $2::date
        AND o.delivery_date IS NOT NULL
        AND po.qte_r > 0
      GROUP BY o.delivery_date
    ),
    daily_stock AS (
      SELECT 
        cal.date_jour,
        SUM(latest_stock.stock) as stock_jour
      FROM calendar_period cal
      LEFT JOIN data_internalproduct ip ON ($3::text[] IS NULL OR ip.code_13_ref_id = ANY($3::text[]))
        AND ($4::uuid IS NULL OR ip.pharmacy_id = $4::uuid)
      LEFT JOIN LATERAL (
        SELECT DISTINCT ON (ins.product_id)
          ins.stock
        FROM data_inventorysnapshot ins
        WHERE ins.product_id = ip.id 
          AND ins.date <= cal.date_jour
        ORDER BY ins.product_id, ins.date DESC
      ) latest_stock ON ip.id IS NOT NULL
      WHERE ip.id IS NOT NULL
      GROUP BY cal.date_jour
    )
    SELECT 
      cal.date_jour as date,
      COALESCE(ds.quantite_vendue_jour, 0) as quantite_vendue_jour,
      COALESCE(ds.ca_ttc_jour, 0) as ca_ttc_jour,
      COALESCE(ds.montant_marge_jour, 0) as marge_jour,
      COALESCE(dp.quantite_achetee_jour, 0) as quantite_achat_jour,
      COALESCE(dp.montant_achat_ht_jour, 0) as montant_achat_jour,
      COALESCE(dst.stock_jour, 0) as stock_jour,
      SUM(COALESCE(ds.quantite_vendue_jour, 0)) 
        OVER (ORDER BY cal.date_jour) as cumul_quantite_vendue,
      SUM(COALESCE(dp.quantite_achetee_jour, 0)) 
        OVER (ORDER BY cal.date_jour) as cumul_quantite_achetee,
      SUM(COALESCE(ds.ca_ttc_jour, 0)) 
        OVER (ORDER BY cal.date_jour) as cumul_ca_ttc,
      SUM(COALESCE(dp.montant_achat_ht_jour, 0)) 
        OVER (ORDER BY cal.date_jour) as cumul_montant_achat,
      SUM(COALESCE(ds.montant_marge_jour, 0)) 
        OVER (ORDER BY cal.date_jour) as cumul_marge
    FROM calendar_period cal
    LEFT JOIN daily_sales ds ON cal.date_jour = ds.date
    LEFT JOIN daily_purchases dp ON cal.date_jour = dp.date_achat
    LEFT JOIN daily_stock dst ON cal.date_jour = dst.date_jour
    ORDER BY cal.date_jour ASC;
  `;

  console.log('🔍 [API] Executing Raw Tables query (fallback):', {
    dateRange,
    productCodesLength: productCodes?.length || 0,
    pharmacyId: pharmacyId || 'ALL_PHARMACIES',
    paramsLength: params.length
  });

  try {
    const rawResults = await db.query<any>(sqlQuery, params);
    
    const results: DailyMetricsEntry[] = rawResults.map(row => ({
      date: typeof row.date === 'string' 
        ? row.date 
        : row.date instanceof Date 
          ? row.date.toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0],
      quantite_vendue_jour: Number(row.quantite_vendue_jour || 0),
      ca_ttc_jour: Number(row.ca_ttc_jour || 0),
      marge_jour: Number(row.marge_jour || 0),
      quantite_achat_jour: Number(row.quantite_achat_jour || 0),
      montant_achat_jour: Number(row.montant_achat_jour || 0),
      stock_jour: Number(row.stock_jour || 0),
      cumul_quantite_vendue: Number(row.cumul_quantite_vendue || 0),
      cumul_quantite_achetee: Number(row.cumul_quantite_achetee || 0),
      cumul_ca_ttc: Number(row.cumul_ca_ttc || 0),
      cumul_montant_achat: Number(row.cumul_montant_achat || 0),
      cumul_marge: Number(row.cumul_marge || 0)
    }));
    
    return { data: results, usedMV: false };
    
  } catch (error) {
    console.error('❌ [API] Raw Tables query failed:', error);
    throw error;
  }
}

// ===================================================================
// VALIDATION EXISTANTE
// ===================================================================

function validatePeriod(start: string, end: string): string | null {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 'Format de date invalide';
  }
  
  if (startDate > endDate) {
    return 'La date de début doit être antérieure à la date de fin';
  }
  
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 365) {
    return 'La période ne peut pas dépasser 365 jours';
  }
  
  return null;
}

// ===================================================================
// ENDPOINT PRINCIPAL OPTIMISÉ
// ===================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  console.log('🔥 [API] Daily Metrics Request started');

  try {
    // 1. Sécurité et validation (IDENTIQUE)
    const context = await getSecurityContext();
    if (!context) {
      console.log('❌ [API] Unauthorized - no security context');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse et validation du body (IDENTIQUE)
    let body: DailyMetricsRequest;
    try {
      body = await request.json();
      console.log('📝 [API] Request body received:', JSON.stringify(body, null, 2));
    } catch (jsonError) {
      console.log('💥 [API] JSON parsing error:', jsonError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // 3. Validation des paramètres (IDENTIQUE)
    if (!body.dateRange?.start || !body.dateRange?.end) {
      console.log('❌ [API] Missing date range');
      return NextResponse.json({ error: 'Date range is required' }, { status: 400 });
    }

    const periodError = validatePeriod(body.dateRange.start, body.dateRange.end);
    if (periodError) {
      console.log('❌ [API] Period validation error:', periodError);
      return NextResponse.json({ error: periodError }, { status: 400 });
    }

    // 4. Déterminer pharmacyId selon sécurité (IDENTIQUE)
    let targetPharmacyId: string | null = null;
    if (context.isAdmin) {
      targetPharmacyId = body.pharmacyId || null;
      console.log('👑 [API] Admin mode - pharmacy filter:', targetPharmacyId);
    } else {
      targetPharmacyId = context.pharmacyId!;
      console.log('👤 [API] User mode - forced pharmacy:', targetPharmacyId);
    }

    // 5. Gestion productCodes (IDENTIQUE)
    const productCodes = (body.productCodes && body.productCodes.length > 0) 
      ? body.productCodes 
      : null;
    
    console.log('🔍 [API] Filters applied:', {
      dateRange: body.dateRange,
      productCodes: productCodes ? `${productCodes.length} codes` : 'ALL_PRODUCTS',
      pharmacyId: targetPharmacyId || 'ALL_PHARMACIES'
    });

    // 6. Cache key generation (IDENTIQUE)
    const cacheKey = `daily_metrics:${crypto
      .createHash('md5')
      .update(JSON.stringify({
        ...body.dateRange,
        productCodes,
        pharmacyId: targetPharmacyId
      }))
      .digest('hex')}`;

    // 7. Vérification cache (IDENTIQUE)
    if (CACHE_ENABLED) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached && typeof cached === 'string') {
          const cachedData = JSON.parse(cached);
          console.log('🎯 [API] Cache hit - returning cached data');
          return NextResponse.json({
            ...cachedData,
            cached: true
          });
        }
      } catch (cacheError) {
        console.warn('⚠️ [API] Cache read error:', cacheError);
      }
    }

    // 8. NOUVEAU : DÉTECTION ET ROUTAGE MV vs RAW TABLES
    const queryStartTime = Date.now();
    console.log('📊 [API] Starting query execution...');

    const hasProductFilters = productCodes !== null;
    const hasSpecificPharmacy = targetPharmacyId !== null;
    
    // DÉTECTION MV ELIGIBILITY
    const canUseDailyMV = detectDailyMVEligibility(
      body.dateRange, 
      hasProductFilters, 
      hasSpecificPharmacy
    );
    
    let queryResult: { data: DailyMetricsEntry[]; usedMV: boolean };
    
    if (canUseDailyMV) {
      console.log('🚀 [API] Using Daily Materialized View - Fast path');
      queryResult = await fetchFromDailyMaterializedView(body.dateRange, targetPharmacyId!);
    } else {
      console.log('🔍 [API] Using Raw Tables - Flexible path');
      queryResult = await fetchFromRawTablesDaily(body.dateRange, productCodes, targetPharmacyId);
    }

    const queryTime = Date.now() - queryStartTime;

    console.log('✅ [API] Query completed:', {
      resultsCount: queryResult.data.length,
      queryTimeMs: queryTime,
      usedMV: queryResult.usedMV,
      firstEntry: queryResult.data[0] || null,
      lastEntry: queryResult.data[queryResult.data.length - 1] || null
    });

    // 9. Construction réponse finale
    const response: DailyMetricsResponse = {
      data: queryResult.data,
      queryTime: Date.now() - startTime,
      cached: false,
      usedMaterializedView: queryResult.usedMV
    };

    // 10. Mise en cache (IDENTIQUE)
    if (CACHE_ENABLED) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify({
          data: response.data,
          queryTime: response.queryTime,
          usedMaterializedView: response.usedMaterializedView
        }));
        console.log('💾 [API] Result cached successfully');
      } catch (cacheError) {
        console.warn('⚠️ [API] Cache write error:', cacheError);
      }
    }

    console.log('🎉 [API] Success - Daily metrics calculated');
    return NextResponse.json(response);

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('💥 [API] Daily metrics error:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      queryTime: totalTime
    }, { status: 500 });
  }
}