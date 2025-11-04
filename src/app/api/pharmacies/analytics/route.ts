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
  
  // Rangs
  readonly rang_ventes_actuel: number;
  readonly rang_ventes_precedent: number | null;
  readonly gain_rang_ventes: number | null;
  
  // Achats
  readonly ca_achats: number;
  readonly ca_achats_comparison: number | null;
  readonly evol_achats_pct: number | null;
  readonly evol_relative_achats_pct: number | null;
  
  // Ventes
  readonly ca_ventes: number;
  readonly ca_ventes_comparison: number | null;
  readonly evol_ventes_pct: number | null;
  readonly evol_relative_ventes_pct: number | null;
  
  // Marge
  readonly pourcentage_marge: number;
  
  // Données complémentaires (optionnel pour export)
  readonly quantite_vendue: number;
  readonly valeur_stock_ht: number;
  readonly part_marche_pct: number;
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
      console.log('❌ [API] Unauthorized - Admin only');
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
    const hasPharmacyFilter = !!(body.pharmacyIds && body.pharmacyIds.length > 0);
    const hasComparison = !!(body.comparisonDateRange?.start && body.comparisonDateRange?.end);

    console.log('📊 [API] Filters:', {
      productCodes: allProductCodes.length,
      pharmacyIds: body.pharmacyIds?.length || 0,
      hasComparison
    });

    const cacheKey = generateCacheKey({
      dateRange: body.dateRange,
      ...(body.comparisonDateRange && { comparisonDateRange: body.comparisonDateRange }),
      productCodes: allProductCodes,
      pharmacyIds: body.pharmacyIds || [],
      hasProductFilter,
      hasPharmacyFilter
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
      hasComparison ? body.comparisonDateRange : undefined
    );

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
    -- ========== PÉRIODE ACTUELLE ==========
    pharmacy_achats AS (
      SELECT 
        dp.id as pharmacy_id,
        dp.name as pharmacy_name,
        COALESCE(SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)), 0) as ca_achats
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
        ORDER BY ABS(EXTRACT(EPOCH FROM (ins2.date::timestamp - o.delivery_date::timestamp)))
        LIMIT 1
      ) closest_snap ON true
      WHERE 1=1
        ${productFilter}
        ${pharmacyFilterMain}
      GROUP BY dp.id, dp.name
    ),
    
    pharmacy_ventes AS (
      SELECT 
        dp.id as pharmacy_id,
        COALESCE(SUM(s.quantity * s.unit_price_ttc), 0) as ca_ventes,
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
      GROUP BY dp.id
    ),
    
    global_totals AS (
      SELECT 
        SUM(pv.ca_ventes) as ca_ventes_total
      FROM pharmacy_ventes pv
      WHERE pv.ca_ventes > 0
    )${comparisonDateRange ? `,
    
    -- ========== PÉRIODE COMPARAISON ==========
    pharmacy_achats_comparison AS (
      SELECT 
        dp.id as pharmacy_id,
        COALESCE(SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)), 0) as ca_achats_comparison
      FROM data_pharmacy dp
      LEFT JOIN data_internalproduct ip ON dp.id = ip.pharmacy_id
      LEFT JOIN data_productorder po ON ip.id = po.product_id
      LEFT JOIN data_order o ON po.order_id = o.id 
        AND o.delivery_date >= '${comparisonDateRange.start}'::date 
        AND o.delivery_date <= '${comparisonDateRange.end}'::date
        AND o.delivery_date IS NOT NULL
        AND po.qte_r > 0
      LEFT JOIN LATERAL (
        SELECT weighted_average_price
        FROM data_inventorysnapshot ins2
        WHERE ins2.product_id = po.product_id
          AND ins2.weighted_average_price > 0
        ORDER BY ABS(EXTRACT(EPOCH FROM (ins2.date::timestamp - o.delivery_date::timestamp)))
        LIMIT 1
      ) closest_snap ON true
      WHERE 1=1
        ${productFilter}
        ${pharmacyFilterMain}
      GROUP BY dp.id
    ),
    
    pharmacy_ventes_comparison AS (
      SELECT 
        dp.id as pharmacy_id,
        COALESCE(SUM(s.quantity * s.unit_price_ttc), 0) as ca_ventes_comparison
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
    
    -- ========== MÉDIANES ÉVOLUTIONS ==========
    evolution_achats_stats AS (
      SELECT 
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY evolution_pct) as mediane_evolution_achats
      FROM (
        SELECT 
          CASE 
            WHEN pac.ca_achats_comparison > 0 
            THEN ((pa.ca_achats - pac.ca_achats_comparison) * 100.0 / pac.ca_achats_comparison)
            ELSE NULL 
          END as evolution_pct
        FROM pharmacy_achats pa
        LEFT JOIN pharmacy_achats_comparison pac ON pa.pharmacy_id = pac.pharmacy_id
        WHERE pac.ca_achats_comparison > 0
      ) evolutions
      WHERE evolution_pct IS NOT NULL 
        AND evolution_pct BETWEEN -100 AND 100
    ),
    
    evolution_ventes_stats AS (
      SELECT 
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY evolution_pct) as mediane_evolution_ventes
      FROM (
        SELECT 
          CASE 
            WHEN pvc.ca_ventes_comparison > 0 
            THEN ((pv.ca_ventes - pvc.ca_ventes_comparison) * 100.0 / pvc.ca_ventes_comparison)
            ELSE NULL 
          END as evolution_pct
        FROM pharmacy_ventes pv
        LEFT JOIN pharmacy_ventes_comparison pvc ON pv.pharmacy_id = pvc.pharmacy_id
        WHERE pvc.ca_ventes_comparison > 0
      ) evolutions
      WHERE evolution_pct IS NOT NULL 
        AND evolution_pct BETWEEN -100 AND 100
    ),
    
    -- ========== RANGS PÉRIODE ACTUELLE ==========
    pharmacy_rang_actuel AS (
      SELECT 
        pharmacy_id,
        ROW_NUMBER() OVER (ORDER BY ca_ventes DESC) as rang_ventes_actuel
      FROM pharmacy_ventes
      WHERE ca_ventes > 0
    ),
    
    -- ========== RANGS PÉRIODE COMPARAISON ==========
    pharmacy_rang_precedent AS (
      SELECT 
        pharmacy_id,
        ROW_NUMBER() OVER (ORDER BY ca_ventes_comparison DESC) as rang_ventes_precedent
      FROM pharmacy_ventes_comparison
      WHERE ca_ventes_comparison > 0
    )` : ''}
    
    -- ========== RÉSULTAT FINAL ==========
    SELECT 
      COALESCE(pv.pharmacy_id, pa.pharmacy_id) as pharmacy_id,
      COALESCE(pa.pharmacy_name, (SELECT name FROM data_pharmacy WHERE id = pv.pharmacy_id)) as pharmacy_name,
      
      -- Rangs
      ${comparisonDateRange ? `
      COALESCE(pra.rang_ventes_actuel, 999999) as rang_ventes_actuel,
      prp.rang_ventes_precedent,
      CASE 
        WHEN prp.rang_ventes_precedent IS NOT NULL AND pra.rang_ventes_actuel IS NOT NULL
        THEN prp.rang_ventes_precedent - pra.rang_ventes_actuel
        ELSE NULL
      END as gain_rang_ventes,
      ` : `
      999999 as rang_ventes_actuel,
      NULL::integer as rang_ventes_precedent,
      NULL::integer as gain_rang_ventes,
      `}
      
      -- Achats
      COALESCE(pa.ca_achats, 0) as ca_achats,
      ${comparisonDateRange ? `
      COALESCE(pac.ca_achats_comparison, 0) as ca_achats_comparison,
      CASE 
        WHEN COALESCE(pac.ca_achats_comparison, 0) > 0 
        THEN ROUND(((COALESCE(pa.ca_achats, 0) - COALESCE(pac.ca_achats_comparison, 0)) * 100.0 / COALESCE(pac.ca_achats_comparison, 0))::numeric, 2)
        ELSE NULL 
      END as evol_achats_pct,
      CASE 
        WHEN COALESCE(pac.ca_achats_comparison, 0) > 0 
             AND eas.mediane_evolution_achats IS NOT NULL
             AND ((COALESCE(pa.ca_achats, 0) - COALESCE(pac.ca_achats_comparison, 0)) * 100.0 / COALESCE(pac.ca_achats_comparison, 0)) BETWEEN -100 AND 100
        THEN ROUND((
          ((COALESCE(pa.ca_achats, 0) - COALESCE(pac.ca_achats_comparison, 0)) * 100.0 / COALESCE(pac.ca_achats_comparison, 0)) - eas.mediane_evolution_achats
        )::numeric, 2)
        ELSE NULL 
      END as evol_relative_achats_pct,
      ` : `
      NULL::numeric as ca_achats_comparison,
      NULL::numeric as evol_achats_pct,
      NULL::numeric as evol_relative_achats_pct,
      `}
      
      -- Ventes
      COALESCE(pv.ca_ventes, 0) as ca_ventes,
      ${comparisonDateRange ? `
      pvc.ca_ventes_comparison,
      CASE 
        WHEN pvc.ca_ventes_comparison > 0 
        THEN ROUND(((pv.ca_ventes - pvc.ca_ventes_comparison) * 100.0 / pvc.ca_ventes_comparison)::numeric, 2)
        ELSE NULL 
      END as evol_ventes_pct,
      CASE 
        WHEN pvc.ca_ventes_comparison > 0 
             AND evs.mediane_evolution_ventes IS NOT NULL
             AND ((pv.ca_ventes - pvc.ca_ventes_comparison) * 100.0 / pvc.ca_ventes_comparison) BETWEEN -100 AND 100
        THEN ROUND((
          ((pv.ca_ventes - pvc.ca_ventes_comparison) * 100.0 / pvc.ca_ventes_comparison) - evs.mediane_evolution_ventes
        )::numeric, 2)
        ELSE NULL 
      END as evol_relative_ventes_pct,
      ` : `
      NULL::numeric as ca_ventes_comparison,
      NULL::numeric as evol_ventes_pct,
      NULL::numeric as evol_relative_ventes_pct,
      `}
      
      -- Marge
      CASE 
        WHEN pv.ca_ht > 0 
        THEN ROUND((pv.montant_marge / pv.ca_ht * 100)::numeric, 2)
        ELSE 0 
      END as pourcentage_marge,
      
      -- Données complémentaires
      COALESCE(pv.quantite_vendue, 0) as quantite_vendue,
      COALESCE(pv.valeur_stock_ht, 0) as valeur_stock_ht,
      CASE 
        WHEN gt.ca_ventes_total > 0 
        THEN ROUND((pv.ca_ventes * 100.0 / gt.ca_ventes_total)::numeric, 2)
        ELSE 0 
      END as part_marche_pct
      
    FROM pharmacy_ventes pv
    FULL OUTER JOIN pharmacy_achats pa ON pv.pharmacy_id = pa.pharmacy_id
    CROSS JOIN global_totals gt${comparisonDateRange ? `
    LEFT JOIN pharmacy_achats_comparison pac ON COALESCE(pv.pharmacy_id, pa.pharmacy_id) = pac.pharmacy_id
    LEFT JOIN pharmacy_ventes_comparison pvc ON COALESCE(pv.pharmacy_id, pa.pharmacy_id) = pvc.pharmacy_id
    LEFT JOIN pharmacy_rang_actuel pra ON COALESCE(pv.pharmacy_id, pa.pharmacy_id) = pra.pharmacy_id
    LEFT JOIN pharmacy_rang_precedent prp ON COALESCE(pv.pharmacy_id, pa.pharmacy_id) = prp.pharmacy_id
    CROSS JOIN evolution_achats_stats eas
    CROSS JOIN evolution_ventes_stats evs` : ''}
    WHERE COALESCE(pv.pharmacy_id, pa.pharmacy_id) IS NOT NULL
    ORDER BY COALESCE(pv.ca_ventes, 0) DESC
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
  return `pharmacies:analytics:v2:${hash}`;
}