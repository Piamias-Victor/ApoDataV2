// src/app/api/stock-charts/route.ts
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

interface StockChartsRequest {
  dateRange: { start: string; end: string };
  productCodes?: string[];
  pharmacyId?: string;
}

interface StockChartsEntry {
  periode: string;
  quantite_stock: number;
  jours_stock: number | null;
  quantite_vendue: number;
}

interface StockChartsResponse {
  data: StockChartsEntry[];
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
  console.log('🔥 [API] Stock Charts Request started');

  try {
    // 1. Sécurité et validation
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

    // 2. Parse et validation du body
    let body: StockChartsRequest;
    try {
      body = await request.json();
      console.log('📝 [API] Request body received:', JSON.stringify(body, null, 2));
    } catch (jsonError) {
      console.log('💥 [API] JSON parsing error:', jsonError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // 3. Validation des paramètres
    if (!body.dateRange?.start || !body.dateRange?.end) {
      console.log('❌ [API] Missing date range');
      return NextResponse.json({ error: 'Date range is required' }, { status: 400 });
    }

    const periodError = validatePeriod(body.dateRange.start, body.dateRange.end);
    if (periodError) {
      console.log('❌ [API] Period validation error:', periodError);
      return NextResponse.json({ error: periodError }, { status: 400 });
    }

    // 4. Déterminer pharmacyId selon sécurité
    let targetPharmacyId: string | null = null;
    if (context.isAdmin) {
      targetPharmacyId = body.pharmacyId || null;
      console.log('👑 [API] Admin mode - pharmacy filter:', targetPharmacyId);
    } else {
      targetPharmacyId = context.pharmacyId!;
      console.log('👤 [API] User mode - forced pharmacy:', targetPharmacyId);
    }

    // 5. Gestion productCodes
    const productCodes = (body.productCodes && body.productCodes.length > 0) 
      ? body.productCodes 
      : null;
    
    console.log('🔍 [API] Filters applied:', {
      dateRange: body.dateRange,
      productCodes: productCodes ? `${productCodes.length} codes` : 'ALL_PRODUCTS',
      pharmacyId: targetPharmacyId || 'ALL_PHARMACIES'
    });

    // 6. Cache key generation
    const cacheKey = `stock_charts:${crypto
      .createHash('md5')
      .update(JSON.stringify({
        ...body.dateRange,
        productCodes,
        pharmacyId: targetPharmacyId
      }))
      .digest('hex')}`;

    // 7. Vérification cache
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

    // 8. Exécution requête SQL
    const queryStartTime = Date.now();
    console.log('📊 [API] Executing SQL query...');

    const params = [
      body.dateRange.start,  // $1
      body.dateRange.end,    // $2
      productCodes,          // $3 (peut être null)
      targetPharmacyId       // $4 (peut être null)
    ];

    const sqlQuery = `
      WITH period_months AS (
        -- Génération de tous les mois de la période
        SELECT 
          DATE_TRUNC('month', generate_series($1::date, $2::date, '1 month'::interval)) as periode
      ),
      monthly_sales AS (
        -- Ventes mensuelles par produit
        SELECT 
          DATE_TRUNC('month', s.date) as periode,
          SUM(s.quantity) as quantite_vendue
        FROM data_sales s
        JOIN data_inventorysnapshot ins ON s.product_id = ins.id
        JOIN data_internalproduct ip ON ins.product_id = ip.id
        WHERE s.date >= $1::date 
          AND s.date <= $2::date
          AND ($3::text[] IS NULL OR ip.code_13_ref_id = ANY($3::text[]))
          AND ($4::uuid IS NULL OR ip.pharmacy_id = $4::uuid)
        GROUP BY DATE_TRUNC('month', s.date)
      ),
      monthly_stock AS (
        -- Stock fin de mois : dernière snapshot <= fin du mois, ou première disponible si période antérieure
        SELECT 
          pm.periode,
          SUM(
            CASE 
              WHEN latest_snap.stock IS NOT NULL THEN latest_snap.stock
              WHEN earliest_snap.stock IS NOT NULL AND pm.periode < earliest_snap.first_snapshot_month THEN 0
              ELSE COALESCE(earliest_snap.stock, 0)
            END
          ) as quantite_stock
        FROM period_months pm
        CROSS JOIN (
          SELECT DISTINCT ip.id as product_id, ip.code_13_ref_id, ip.pharmacy_id
          FROM data_internalproduct ip
          WHERE ($3::text[] IS NULL OR ip.code_13_ref_id = ANY($3::text[]))
            AND ($4::uuid IS NULL OR ip.pharmacy_id = $4::uuid)
        ) products
        -- Dernière snapshot <= fin du mois
        LEFT JOIN LATERAL (
          SELECT ins.stock
          FROM data_inventorysnapshot ins
          WHERE ins.product_id = products.product_id
            AND ins.date <= (pm.periode + interval '1 month - 1 day')
          ORDER BY ins.date DESC
          LIMIT 1
        ) latest_snap ON true
        -- Première snapshot du produit (fallback)
        LEFT JOIN LATERAL (
          SELECT 
            ins.stock,
            DATE_TRUNC('month', ins.date) as first_snapshot_month
          FROM data_inventorysnapshot ins
          WHERE ins.product_id = products.product_id
          ORDER BY ins.date ASC
          LIMIT 1
        ) earliest_snap ON true
        GROUP BY pm.periode
      )
      SELECT 
        TO_CHAR(pm.periode, 'YYYY-MM') as periode,
        COALESCE(mst.quantite_stock, 0) as quantite_stock,
        COALESCE(ms.quantite_vendue, 0) as quantite_vendue,
        -- Calcul jours de stock : stock / (ventes / 30 jours)
        CASE 
          WHEN COALESCE(ms.quantite_vendue, 0) > 0 
          THEN ROUND(
            COALESCE(mst.quantite_stock, 0) / (COALESCE(ms.quantite_vendue, 0) / 30.0), 
            1
          )
          ELSE NULL
        END as jours_stock
      FROM period_months pm
      LEFT JOIN monthly_stock mst ON pm.periode = mst.periode
      LEFT JOIN monthly_sales ms ON pm.periode = ms.periode
      ORDER BY pm.periode ASC;
    `;

    const rawResults = await db.query<any>(sqlQuery, params);
    const queryTime = Date.now() - queryStartTime;

    console.log('✅ [API] Query completed:', {
      resultsCount: rawResults.length,
      queryTimeMs: queryTime,
      firstEntry: rawResults[0] || null,
      lastEntry: rawResults[rawResults.length - 1] || null
    });

    // 9. Formatage des résultats
    const results: StockChartsEntry[] = rawResults.map((row: any) => {
      const entry: StockChartsEntry = {
        periode: String(row.periode || '2025-01'),
        quantite_stock: Number(row.quantite_stock) || 0,
        jours_stock: row.jours_stock ? Number(row.jours_stock) : null,
        quantite_vendue: Number(row.quantite_vendue) || 0
      };

      console.log('📊 [API] Formatted entry:', entry);
      return entry;
    });

    const response: StockChartsResponse = {
      data: results,
      queryTime: Date.now() - startTime,
      cached: false
    };

    // 10. Mise en cache
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

    console.log('🎉 [API] Success - Stock charts calculated');
    return NextResponse.json(response);

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('💥 [API] Stock charts error:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      queryTime: totalTime
    }, { status: 500 });
  }
}