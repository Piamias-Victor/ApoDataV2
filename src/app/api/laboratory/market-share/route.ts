// src/app/api/daily-metrics/route.ts
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
}

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

async function fetchFromRawTablesDaily(
  dateRange: { start: string; end: string },
  productCodes: string[] | null,
  pharmacyId: string | null
): Promise<DailyMetricsEntry[]> {
  
  const params = [
    dateRange.start,
    dateRange.end,
    productCodes,
    pharmacyId
  ];

  const sqlQuery = `
    WITH calendar_period AS (
      SELECT generate_series($1::date, $2::date, '1 day'::interval)::date as date_jour
    ),
    daily_sales AS (
      SELECT 
        s.date,
        SUM(s.quantity) as quantite_vendue_jour,
        SUM(s.quantity * s.unit_price_ttc) as ca_ttc_jour,
        SUM(s.quantity * (
          (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
        )) as montant_marge_jour
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
      WHERE 1=1
        AND ($3::text[] IS NULL OR ip.code_13_ref_id = ANY($3::text[]))
        AND ($4::uuid IS NULL OR ip.pharmacy_id = $4::uuid)
        AND s.date >= $1::date AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        AND (gp.tva_percentage IS NOT NULL OR gp.bcb_tva_rate IS NOT NULL)
        AND COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) > 0
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

  console.log('🔍 [API] Executing Raw Tables query:', {
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
    
    return results;
    
  } catch (error) {
    console.error('❌ [API] Raw Tables query failed:', error);
    throw error;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  console.log('🔥 [API] Daily Metrics Request started');

  try {
    const context = await getSecurityContext();
    if (!context) {
      console.log('❌ [API] Unauthorized - no security context');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔐 [API] Security context:', {
      userId: context.userId,
      role: context.userRole,
      isAdmin: context.isAdmin,
      pharmacyId: context.pharmacyId
    });

    let body: DailyMetricsRequest;
    try {
      body = await request.json();
      console.log('📝 [API] Request body received:', JSON.stringify(body, null, 2));
    } catch (jsonError) {
      console.log('💥 [API] JSON parsing error:', jsonError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.dateRange?.start || !body.dateRange?.end) {
      console.log('❌ [API] Missing date range');
      return NextResponse.json({ error: 'Date range is required' }, { status: 400 });
    }

    const periodError = validatePeriod(body.dateRange.start, body.dateRange.end);
    if (periodError) {
      console.log('❌ [API] Period validation error:', periodError);
      return NextResponse.json({ error: periodError }, { status: 400 });
    }

    let targetPharmacyId: string | null = null;
    if (context.isAdmin) {
      targetPharmacyId = body.pharmacyId || null;
      console.log('👑 [API] Admin mode - pharmacy filter:', targetPharmacyId);
    } else {
      targetPharmacyId = context.pharmacyId!;
      console.log('👤 [API] User mode - forced pharmacy:', targetPharmacyId);
    }

    const productCodes = (body.productCodes && body.productCodes.length > 0) 
      ? body.productCodes 
      : null;
    
    console.log('🔍 [API] Filters applied:', {
      dateRange: body.dateRange,
      productCodes: productCodes ? `${productCodes.length} codes` : 'ALL_PRODUCTS',
      pharmacyId: targetPharmacyId || 'ALL_PHARMACIES'
    });

    const cacheKey = `daily_metrics:${crypto
      .createHash('md5')
      .update(JSON.stringify({
        ...body.dateRange,
        productCodes,
        pharmacyId: targetPharmacyId
      }))
      .digest('hex')}`;

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

    const queryStartTime = Date.now();
    console.log('📊 [API] Starting query execution...');

    const data = await fetchFromRawTablesDaily(body.dateRange, productCodes, targetPharmacyId);
    const queryTime = Date.now() - queryStartTime;

    console.log('✅ [API] Query completed:', {
      resultsCount: data.length,
      queryTimeMs: queryTime,
      firstEntry: data[0] || null,
      lastEntry: data[data.length - 1] || null
    });

    const response: DailyMetricsResponse = {
      data,
      queryTime: Date.now() - startTime,
      cached: false
    };

    if (CACHE_ENABLED) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify({
          data: response.data,
          queryTime: response.queryTime
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