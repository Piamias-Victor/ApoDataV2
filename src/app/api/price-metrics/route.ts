// src/app/api/price-metrics/route.ts
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

interface PriceMetricsRequest {
  dateRange: { start: string; end: string };
  productCodes?: string[];
  pharmacyId?: string;
}

interface PriceMetricsEntry {
  mois: string;
  quantite_vendue_mois: number;
  prix_vente_ttc_moyen: number;
  prix_achat_ht_moyen: number;
  taux_marge_moyen_pourcentage: number;
}

interface PriceMetricsResponse {
  data: PriceMetricsEntry[];
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  console.log('🔥 [API] Price Metrics Request started');

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

    let body: PriceMetricsRequest;
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

    const cacheKey = `price_metrics:${crypto
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
    console.log('📊 [API] Executing SQL query...');

    const params = [
      body.dateRange.start,
      body.dateRange.end,
      productCodes,
      targetPharmacyId
    ];

    const sqlQuery = `
      WITH monthly_calendar AS (
        SELECT 
          DATE_TRUNC('month', generate_series($1::date, $2::date, '1 month'::interval)) as mois
      ),
      monthly_sales AS (
        SELECT 
          DATE_TRUNC('month', s.date) as mois,
          SUM(s.quantity) as quantite_vendue_mois,
          AVG(s.unit_price_ttc) as prix_vente_moyen_ttc,
          AVG(ins.weighted_average_price) as prix_achat_moyen_ht,
          SUM(s.quantity * (
            (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
          )) as montant_marge_total,
          SUM(s.quantity * (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0))) as ca_ht_total
        FROM data_sales s
        JOIN data_inventorysnapshot ins ON s.product_id = ins.id
        JOIN data_internalproduct ip ON ins.product_id = ip.id
        LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
        WHERE 1=1
          AND ($3::text[] IS NULL OR ip.code_13_ref_id = ANY($3::text[]))
          AND ($4::uuid IS NULL OR ip.pharmacy_id = $4::uuid)
          AND s.date >= $1::date 
          AND s.date <= $2::date
          AND s.unit_price_ttc IS NOT NULL
          AND s.unit_price_ttc > 0
          AND ins.weighted_average_price > 0
          AND (gp.tva_percentage IS NOT NULL OR gp.bcb_tva_rate IS NOT NULL)
          AND COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) > 0
        GROUP BY DATE_TRUNC('month', s.date)
      )
      SELECT 
        mc.mois,
        COALESCE(ms.quantite_vendue_mois, 0) as quantite_vendue_mois,
        ROUND(COALESCE(ms.prix_vente_moyen_ttc, 0), 2) as prix_vente_ttc_moyen,
        ROUND(COALESCE(ms.prix_achat_moyen_ht, 0), 2) as prix_achat_ht_moyen,
        CASE 
          WHEN ms.ca_ht_total > 0 THEN
            ROUND((ms.montant_marge_total / ms.ca_ht_total) * 100, 2)
          ELSE 0
        END as taux_marge_moyen_pourcentage
      FROM monthly_calendar mc
      LEFT JOIN monthly_sales ms ON mc.mois = ms.mois
      ORDER BY mc.mois ASC;
    `;

    const rawResults = await db.query<any>(sqlQuery, params);
    const queryTime = Date.now() - queryStartTime;

    console.log('✅ [API] Query completed:', {
      resultsCount: rawResults.length,
      queryTimeMs: queryTime,
      firstEntry: rawResults[0] || null,
      lastEntry: rawResults[rawResults.length - 1] || null
    });

    const results: PriceMetricsEntry[] = rawResults.map((row: any) => {
      const entry: PriceMetricsEntry = {
        mois: row.mois instanceof Date 
          ? row.mois.toISOString().split('T')[0]
          : String(row.mois || '2025-01-01').split('T')[0],
        quantite_vendue_mois: Number(row.quantite_vendue_mois) || 0,
        prix_vente_ttc_moyen: Number(row.prix_vente_ttc_moyen) || 0,
        prix_achat_ht_moyen: Number(row.prix_achat_ht_moyen) || 0,
        taux_marge_moyen_pourcentage: Number(row.taux_marge_moyen_pourcentage) || 0
      };

      console.log('📊 [API] Formatted entry:', entry);
      return entry;
    });

    const response: PriceMetricsResponse = {
      data: results,
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

    console.log('🎉 [API] Success - Price metrics calculated');
    return NextResponse.json(response);

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('💥 [API] Price metrics error:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      queryTime: totalTime
    }, { status: 500 });
  }
}