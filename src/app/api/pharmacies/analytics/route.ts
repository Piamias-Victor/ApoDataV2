// src/app/api/pharmacies/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

interface PharmaciesAnalyticsRequest {
  readonly dateRange: {
    readonly start: string;
    readonly end: string;
  };
  readonly comparisonDateRange?: {
    readonly start: string;
    readonly end: string;
  };
  readonly productCodes?: string[];
  readonly laboratoryCodes?: string[];
  readonly categoryCodes?: string[];
  readonly pharmacyIds?: string[];
}

interface PharmacyMetrics {
  readonly pharmacy_id: string;
  readonly pharmacy_name: string;
  readonly ca_ttc: number;
  readonly montant_marge: number;
  readonly pourcentage_marge: number;
  readonly valeur_stock_ht: number;
  readonly quantite_vendue: number;
  readonly montant_achat_total: number;
  readonly part_marche_pct: number;
  readonly evolution_ca_pct?: number;
  readonly evolution_relative_pct?: number;
}

interface PharmaciesAnalyticsResponse {
  readonly pharmacies: PharmacyMetrics[];
  readonly count: number;
  readonly queryTime: number;
  readonly cached: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    console.log('🔥 [API] Pharmacies Analytics called');
    
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      console.log('❌ [API] Unauthorized - Admin only for pharmacies analytics');
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body: PharmaciesAnalyticsRequest = await request.json();
    console.log('📥 [API] Request body:', body);
    
    if (!body.dateRange?.start || !body.dateRange?.end) {
      return NextResponse.json({ error: 'Date range required' }, { status: 400 });
    }

    const allProductCodes = Array.from(new Set([
      ...(body.productCodes || []),
      ...(body.laboratoryCodes || []),
      ...(body.categoryCodes || [])
    ]));

    const hasProductFilter = allProductCodes.length > 0;
    const hasPharmacyFilter: boolean = !!(body.pharmacyIds && body.pharmacyIds.length > 0);

    console.log('📊 [API] Filters:', {
      productCodes: allProductCodes.length,
      pharmacyIds: body.pharmacyIds?.length || 0,
      hasComparison: !!body.comparisonDateRange
    });

    const cacheKey = generateCacheKey({
      dateRange: body.dateRange,
      ...(body.comparisonDateRange && { comparisonDateRange: body.comparisonDateRange }),
      productCodes: allProductCodes,
      pharmacyIds: body.pharmacyIds || [],
      hasProductFilter,
      hasPharmacyFilter: hasPharmacyFilter
    });

    if (CACHE_ENABLED) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log('✅ [API] Cache HIT');
          return NextResponse.json({
            ...(cached as any),
            cached: true,
            queryTime: Date.now() - startTime
          });
        }
      } catch (cacheError) {
        console.warn('⚠️ [API] Cache read error:', cacheError);
      }
    }

    const pharmacies = await executePharmaciesAnalyticsQuery(
      body.dateRange,
      allProductCodes,
      body.pharmacyIds,
      hasProductFilter,
      hasPharmacyFilter,
      body.comparisonDateRange
    );

    if (body.comparisonDateRange) {
      const evolutionsDebug = pharmacies
        .filter(p => p.evolution_ca_pct !== null && p.evolution_ca_pct !== undefined)
        .slice(0, 10)
        .map(p => ({
          nom: p.pharmacy_name,
          evolution_ca: p.evolution_ca_pct,
          evolution_relative: p.evolution_relative_pct
        }));

      console.log('🔍 [DEBUG] Échantillon évolutions:', {
        evolutionsDebug,
        totalAvecEvolution: pharmacies.filter(p => p.evolution_ca_pct !== null).length,
        totalAvecEvolutionRelative: pharmacies.filter(p => p.evolution_relative_pct !== null).length,
        rangeEvolutions: {
          min: Math.min(...pharmacies.filter(p => p.evolution_ca_pct !== null).map(p => p.evolution_ca_pct || 0)),
          max: Math.max(...pharmacies.filter(p => p.evolution_ca_pct !== null).map(p => p.evolution_ca_pct || 0))
        }
      });
    }

    const result: PharmaciesAnalyticsResponse = {
      pharmacies,
      count: pharmacies.length,
      queryTime: Date.now() - startTime,
      cached: false
    };

    if (CACHE_ENABLED) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
        console.log('💾 [API] Result cached');
      } catch (cacheError) {
        console.warn('⚠️ [API] Cache write error:', cacheError);
      }
    }

    console.log('✅ [API] Success:', {
      pharmaciesFound: pharmacies.length,
      queryTime: result.queryTime
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ [API] Pharmacies analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error', queryTime: Date.now() - startTime },
      { status: 500 }
    );
  }
}

async function executePharmaciesAnalyticsQuery(
  dateRange: { start: string; end: string },
  productCodes: string[],
  pharmacyIds?: string[],
  hasProductFilter: boolean = false,
  hasPharmacyFilter: boolean = false,
  comparisonDateRange?: { start: string; end: string }
): Promise<PharmacyMetrics[]> {
  
  const productFilter = hasProductFilter ? 'AND ip.code_13_ref_id = ANY($3::text[])' : '';
  const pharmacyFilterMain = hasPharmacyFilter ? 
    (hasProductFilter ? 'AND ip.pharmacy_id = ANY($4::uuid[])' : 'AND ip.pharmacy_id = ANY($3::uuid[])') : '';

  const params: any[] = [dateRange.start, dateRange.end];
  
  if (hasProductFilter) {
    params.push(productCodes);
  }
  
  if (hasPharmacyFilter) {
    params.push(pharmacyIds);
  }

  const query = `
    WITH 
    pharmacy_metrics AS (
      SELECT 
        dp.id as pharmacy_id,
        dp.name as pharmacy_name,
        
        COALESCE(SUM(s.quantity * s.unit_price_ttc), 0) as ca_ttc,
        COALESCE(SUM(s.quantity), 0) as quantite_vendue,
        
        COALESCE(SUM(s.quantity * (
          (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
        )), 0) as montant_marge,
        
        COALESCE(SUM(s.quantity * (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0))), 0) as ca_ht,
        
        COALESCE(SUM(latest_stock.stock * latest_stock.weighted_average_price), 0) as valeur_stock_ht
        
      FROM data_pharmacy dp
      LEFT JOIN data_internalproduct ip ON dp.id = ip.pharmacy_id
      LEFT JOIN data_inventorysnapshot ins ON ip.id = ins.product_id
      LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
      LEFT JOIN data_sales s ON ins.id = s.product_id 
        AND s.date >= $1::date AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        AND (gp.tva_percentage IS NOT NULL OR gp.bcb_tva_rate IS NOT NULL)
        AND COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) > 0
      LEFT JOIN LATERAL (
        SELECT DISTINCT ON (ins2.product_id)
          ins2.stock, ins2.weighted_average_price
        FROM data_inventorysnapshot ins2
        WHERE ins2.product_id = ip.id
        ORDER BY ins2.product_id, ins2.date DESC
      ) latest_stock ON true
      WHERE 1=1
        ${productFilter}
        ${pharmacyFilterMain}
      GROUP BY dp.id, dp.name
    ),
    
    pharmacy_purchases AS (
      SELECT 
        dp.id as pharmacy_id,
        COALESCE(SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)), 0) as montant_achat_total
      FROM data_pharmacy dp
      LEFT JOIN data_internalproduct ip ON dp.id = ip.pharmacy_id
      LEFT JOIN data_productorder po ON ip.id = po.product_id
      LEFT JOIN data_order o ON po.order_id = o.id 
        AND o.delivery_date >= $1::date 
        AND o.delivery_date <= $2::date
        AND o.delivery_date IS NOT NULL
        AND po.qte_r > 0
      LEFT JOIN LATERAL (
        SELECT weighted_average_price
        FROM data_inventorysnapshot ins2
        WHERE ins2.product_id = po.product_id
          AND ins2.weighted_average_price > 0
        ORDER BY ins2.date DESC
        LIMIT 1
      ) closest_snap ON true
      WHERE 1=1
        ${productFilter}
        ${pharmacyFilterMain}
      GROUP BY dp.id
    ),
    
    global_totals AS (
      SELECT 
        SUM(pm.ca_ttc) as ca_total_selection
      FROM pharmacy_metrics pm
      WHERE pm.ca_ttc > 0
    )${comparisonDateRange ? `,
    
    pharmacy_comparison AS (
      SELECT 
        dp.id as pharmacy_id,
        COALESCE(SUM(s.quantity * s.unit_price_ttc), 0) as ca_ttc_comparison
      FROM data_pharmacy dp
      LEFT JOIN data_internalproduct ip ON dp.id = ip.pharmacy_id
      LEFT JOIN data_inventorysnapshot ins ON ip.id = ins.product_id
      LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
      LEFT JOIN data_sales s ON ins.id = s.product_id 
        AND s.date >= '${comparisonDateRange.start}'::date 
        AND s.date <= '${comparisonDateRange.end}'::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        AND (gp.tva_percentage IS NOT NULL OR gp.bcb_tva_rate IS NOT NULL)
        AND COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) > 0
      WHERE 1=1
        ${productFilter}
        ${pharmacyFilterMain}
      GROUP BY dp.id
    ),
    
    evolution_stats AS (
      SELECT 
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY evolution_pct) as mediane_evolution,
        COUNT(*) as nb_pharmacies_mediane,
        MIN(evolution_pct) as min_evolution,
        MAX(evolution_pct) as max_evolution
      FROM (
        SELECT 
          CASE 
            WHEN pc.ca_ttc_comparison > 0 
            THEN ((pm.ca_ttc - pc.ca_ttc_comparison) * 100.0 / pc.ca_ttc_comparison)
            ELSE NULL 
          END as evolution_pct
        FROM pharmacy_metrics pm
        LEFT JOIN pharmacy_comparison pc ON pm.pharmacy_id = pc.pharmacy_id
        WHERE pc.ca_ttc_comparison > 0
      ) evolutions
      WHERE evolution_pct IS NOT NULL 
        AND evolution_pct BETWEEN -100 AND 100
    )` : ''}
    
    SELECT 
      pm.pharmacy_id,
      pm.pharmacy_name,
      pm.ca_ttc,
      pm.montant_marge,
      CASE 
        WHEN pm.ca_ht > 0 
        THEN ROUND((pm.montant_marge / pm.ca_ht * 100)::numeric, 2)
        ELSE 0 
      END as pourcentage_marge,
      pm.valeur_stock_ht,
      pm.quantite_vendue,
      COALESCE(pp.montant_achat_total, 0) as montant_achat_total,
      
      CASE 
        WHEN gt.ca_total_selection > 0 
        THEN ROUND((pm.ca_ttc * 100.0 / gt.ca_total_selection)::numeric, 2)
        ELSE 0 
      END as part_marche_pct${comparisonDateRange ? `,
      
      CASE 
        WHEN pc.ca_ttc_comparison > 0 
        THEN ROUND(((pm.ca_ttc - pc.ca_ttc_comparison) * 100.0 / pc.ca_ttc_comparison)::numeric, 2)
        ELSE NULL 
      END as evolution_ca_pct,
      
      CASE 
        WHEN pc.ca_ttc_comparison > 0 
             AND es.mediane_evolution IS NOT NULL
             AND ((pm.ca_ttc - pc.ca_ttc_comparison) * 100.0 / pc.ca_ttc_comparison) BETWEEN -100 AND 100
        THEN ROUND((
          ((pm.ca_ttc - pc.ca_ttc_comparison) * 100.0 / pc.ca_ttc_comparison) - es.mediane_evolution
        )::numeric, 2)
        ELSE NULL 
      END as evolution_relative_pct` : `,
      NULL as evolution_ca_pct,
      NULL as evolution_relative_pct`}
      
    FROM pharmacy_metrics pm
    LEFT JOIN pharmacy_purchases pp ON pm.pharmacy_id = pp.pharmacy_id
    CROSS JOIN global_totals gt${comparisonDateRange ? `
    LEFT JOIN pharmacy_comparison pc ON pm.pharmacy_id = pc.pharmacy_id
    CROSS JOIN evolution_stats es` : ''}
    ORDER BY pm.ca_ttc DESC
    LIMIT 1000;
  `;

  console.log('🗃️ [API] Executing pharmacies analytics query:', {
    dateRange,
    hasProductFilter,
    hasPharmacyFilter,
    hasComparison: !!comparisonDateRange,
    paramsLength: params.length
  });

  return await db.query(query, params);
}

function generateCacheKey(params: {
  dateRange: { start: string; end: string };
  comparisonDateRange?: { start: string; end: string };
  productCodes: string[];
  pharmacyIds: string[];
  hasProductFilter: boolean;
  hasPharmacyFilter: boolean;
}): string {
  const data = JSON.stringify({
    dateRange: params.dateRange,
    comparisonDateRange: params.comparisonDateRange,
    productCodes: params.hasProductFilter ? params.productCodes.sort() : [],
    pharmacyIds: params.hasPharmacyFilter ? params.pharmacyIds.sort() : [],
    hasProductFilter: params.hasProductFilter,
    hasPharmacyFilter: params.hasPharmacyFilter
  });
  
  const hash = crypto.createHash('md5').update(data).digest('hex');
  return `pharmacies:analytics:${hash}`;
}