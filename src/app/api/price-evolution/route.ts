// src/app/api/price-evolution/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSecurityContext, enforcePharmacySecurity } from '@/lib/api-security';
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

interface PriceEvolutionRequest {
  readonly dateRange: {
    readonly start: string;
    readonly end: string;
  };
  readonly productCodes: string[];
  readonly laboratoryCodes: string[];
  readonly categoryCodes: string[];
  readonly pharmacyIds?: string[];
}

interface PriceEvolutionMetrics {
  readonly evolution_prix_vente_pct: number;
  readonly evolution_prix_achat_pct: number;
  readonly evolution_marge_pct: number;
  readonly ecart_prix_vs_marche_pct: number;
  readonly nb_produits_analyses: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    console.log('🔥 [API] Price evolution API called');
    
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

    let body: PriceEvolutionRequest;
    try {
      const requestText = await request.text();
      
      if (!requestText || requestText.trim() === '') {
        console.log('❌ [API] Empty request body');
        return NextResponse.json({ error: 'Request body required' }, { status: 400 });
      }

      body = JSON.parse(requestText);
      
      if (!body || typeof body !== 'object') {
        console.log('❌ [API] Invalid request body structure');
        return NextResponse.json({ error: 'Invalid request body structure' }, { status: 400 });
      }
      
      console.log('📥 [API] Request body received:', body);
    } catch (jsonError) {
      console.log('💥 [API] JSON parsing error:', jsonError);
      return NextResponse.json({ 
        error: 'Invalid JSON body - malformed request' 
      }, { status: 400 });
    }
    
    if (!body.dateRange?.start || !body.dateRange?.end) {
      console.log('❌ [API] Missing date range');
      return NextResponse.json({ error: 'Date range required' }, { status: 400 });
    }

    const allProductCodes = Array.from(new Set([
      ...(body.productCodes || []),
      ...(body.laboratoryCodes || []),
      ...(body.categoryCodes || [])
    ]));

    console.log('📦 [API] Product codes merged:', {
      totalCodes: allProductCodes.length,
      productCodes: body.productCodes?.length || 0,
      laboratoryCodes: body.laboratoryCodes?.length || 0,
      categoryCodes: body.categoryCodes?.length || 0
    });

    const hasProductFilter = allProductCodes.length > 0;

    const secureFilters = enforcePharmacySecurity({
      dateRange: body.dateRange,
      pharmacy: body.pharmacyIds || []
    }, context);

    console.log('🛡️ [API] Secure filters applied:', secureFilters);

    const cacheKey = generateCacheKey({
      dateRange: body.dateRange,
      productCodes: allProductCodes,
      pharmacyIds: secureFilters.pharmacy || [],
      role: context.userRole,
      hasProductFilter
    });

    if (CACHE_ENABLED) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log('✅ [API] Cache HIT - returning cached data');
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

    console.log('🗃️ [API] Executing database query...');
    
    const metrics = context.isAdmin 
      ? await executeAdminQuery(body.dateRange, allProductCodes, secureFilters.pharmacy, hasProductFilter)
      : await executeUserQuery(body.dateRange, allProductCodes, context.pharmacyId!, hasProductFilter);

    console.log('📈 [API] Query completed:', {
      evolution_prix_vente: metrics.evolution_prix_vente_pct,
      nb_produits_analyses: metrics.nb_produits_analyses,
      queryTimeMs: Date.now() - startTime
    });

    const result = {
      metrics,
      queryTime: Date.now() - startTime,
      cached: false
    };

    if (CACHE_ENABLED) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
        console.log('💾 [API] Result cached successfully');
      } catch (cacheError) {
        console.warn('⚠️ [API] Cache write error:', cacheError);
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('💥 [API] Price evolution API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', queryTime: Date.now() - startTime },
      { status: 500 }
    );
  }
}

async function executeAdminQuery(
  dateRange: { start: string; end: string },
  productCodes: string[],
  pharmacyIds?: string[],
  hasProductFilter: boolean = true
): Promise<PriceEvolutionMetrics> {

  const isNoPharmacySelected = !pharmacyIds || pharmacyIds.length === 0;
  
  if (isNoPharmacySelected) {
    console.log('🔍 [API] Admin mode WITHOUT pharmacy - market evolution');
    return await executeMarketEvolutionQuery(dateRange, productCodes, hasProductFilter);
  }

  console.log('🔍 [API] Admin mode WITH pharmacy - selection vs market evolution');
  
  const productFilter = hasProductFilter 
    ? 'AND ip.code_13_ref_id = ANY($3::text[])'
    : '';

  const params = [];
  let paramIndex = 1;
  
  params.push(dateRange.start);
  params.push(dateRange.end);
  
  if (hasProductFilter) {
    params.push(productCodes);
    paramIndex = 4;
  } else {
    paramIndex = 3;
  }
  
  params.push(pharmacyIds);

  const pharmacyParam = `$${paramIndex}::uuid[]`;

  const query = `
    WITH prix_debut AS (
      SELECT DISTINCT ON (ip.code_13_ref_id)
        ip.code_13_ref_id,
        s.unit_price_ttc as prix_vente_debut,
        ins.weighted_average_price as prix_achat_debut,
        CASE 
          WHEN s.unit_price_ttc > 0 AND ip."TVA" IS NOT NULL 
          THEN ((s.unit_price_ttc / (1 + ip."TVA" / 100.0)) - ins.weighted_average_price) / 
               (s.unit_price_ttc / (1 + ip."TVA" / 100.0)) * 100
          ELSE 0 
        END as marge_pct_debut,
        s.date
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        AND ip.pharmacy_id = ANY(${pharmacyParam})
        ${productFilter}
      ORDER BY ip.code_13_ref_id, s.date ASC
    ),
    prix_fin AS (
      SELECT DISTINCT ON (ip.code_13_ref_id)
        ip.code_13_ref_id,
        s.unit_price_ttc as prix_vente_fin,
        ins.weighted_average_price as prix_achat_fin,
        CASE 
          WHEN s.unit_price_ttc > 0 AND ip."TVA" IS NOT NULL 
          THEN ((s.unit_price_ttc / (1 + ip."TVA" / 100.0)) - ins.weighted_average_price) / 
               (s.unit_price_ttc / (1 + ip."TVA" / 100.0)) * 100
          ELSE 0 
        END as marge_pct_fin,
        s.date
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        AND ip.pharmacy_id = ANY(${pharmacyParam})
        ${productFilter}
      ORDER BY ip.code_13_ref_id, s.date DESC
    ),
    marche_concurrent AS (
      SELECT 
        AVG(s.unit_price_ttc) as prix_vente_marche
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ip.pharmacy_id != ALL(${pharmacyParam})
        ${productFilter}
    ),
    mes_prix_actuels AS (
      SELECT 
        AVG(s.unit_price_ttc) as prix_vente_selection
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ip.pharmacy_id = ANY(${pharmacyParam})
        ${productFilter}
    ),
    product_evolutions AS (
      SELECT 
        d.code_13_ref_id,
        CASE 
          WHEN d.prix_vente_debut > 0 
          THEN ((f.prix_vente_fin - d.prix_vente_debut) / d.prix_vente_debut) * 100
          ELSE 0
        END as evolution_prix_vente_pct,
        CASE 
          WHEN d.prix_achat_debut > 0 
          THEN ((f.prix_achat_fin - d.prix_achat_debut) / d.prix_achat_debut) * 100
          ELSE 0
        END as evolution_prix_achat_pct,
        (f.marge_pct_fin - d.marge_pct_debut) as evolution_marge_pct
      FROM prix_debut d
      INNER JOIN prix_fin f ON d.code_13_ref_id = f.code_13_ref_id
    )
    SELECT 
      ROUND(AVG(pe.evolution_prix_vente_pct), 2) as evolution_prix_vente_pct,
      ROUND(AVG(pe.evolution_prix_achat_pct), 2) as evolution_prix_achat_pct,
      ROUND(AVG(pe.evolution_marge_pct), 2) as evolution_marge_pct,
      CASE 
        WHEN AVG(mc.prix_vente_marche) > 0 
        THEN ROUND(
          ((AVG(mpa.prix_vente_selection) - AVG(mc.prix_vente_marche)) / AVG(mc.prix_vente_marche)) * 100, 
          2
        )
        ELSE 0
      END as ecart_prix_vs_marche_pct,
      COUNT(pe.code_13_ref_id)::int as nb_produits_analyses
    FROM product_evolutions pe
    CROSS JOIN marche_concurrent mc
    CROSS JOIN mes_prix_actuels mpa;
  `;

  const result = await db.query(query, params);
  const rawResult = result[0];

  console.log('🔍 [DEBUG] Raw admin query result:', rawResult);

  if (!rawResult) {
    return {
      evolution_prix_vente_pct: 0,
      evolution_prix_achat_pct: 0,
      evolution_marge_pct: 0,
      ecart_prix_vs_marche_pct: 0,
      nb_produits_analyses: 0
    };
  }

  return {
    evolution_prix_vente_pct: Number(rawResult.evolution_prix_vente_pct) || 0,
    evolution_prix_achat_pct: Number(rawResult.evolution_prix_achat_pct) || 0,
    evolution_marge_pct: Number(rawResult.evolution_marge_pct) || 0,
    ecart_prix_vs_marche_pct: Number(rawResult.ecart_prix_vs_marche_pct) || 0,
    nb_produits_analyses: Number(rawResult.nb_produits_analyses) || 0
  };
}

async function executeUserQuery(
  dateRange: { start: string; end: string },
  productCodes: string[],
  pharmacyId: string,
  hasProductFilter: boolean = true
): Promise<PriceEvolutionMetrics> {

  console.log('🔍 [API] User mode - my pharmacy vs market evolution');
  
  const productFilter = hasProductFilter 
    ? 'AND ip.code_13_ref_id = ANY($3::text[])'
    : '';

  const params = hasProductFilter
    ? [dateRange.start, dateRange.end, productCodes, pharmacyId]
    : [dateRange.start, dateRange.end, pharmacyId];

  const pharmacyParam = hasProductFilter ? '$4::uuid' : '$3::uuid';

  const query = `
    WITH prix_debut AS (
      SELECT DISTINCT ON (ip.code_13_ref_id)
        ip.code_13_ref_id,
        s.unit_price_ttc as prix_vente_debut,
        ins.weighted_average_price as prix_achat_debut,
        CASE 
          WHEN s.unit_price_ttc > 0 AND ip."TVA" IS NOT NULL 
          THEN ((s.unit_price_ttc / (1 + ip."TVA" / 100.0)) - ins.weighted_average_price) / 
               (s.unit_price_ttc / (1 + ip."TVA" / 100.0)) * 100
          ELSE 0 
        END as marge_pct_debut,
        s.date
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        AND ip.pharmacy_id = ${pharmacyParam}
        ${productFilter}
      ORDER BY ip.code_13_ref_id, s.date ASC
    ),
    prix_fin AS (
      SELECT DISTINCT ON (ip.code_13_ref_id)
        ip.code_13_ref_id,
        s.unit_price_ttc as prix_vente_fin,
        ins.weighted_average_price as prix_achat_fin,
        CASE 
          WHEN s.unit_price_ttc > 0 AND ip."TVA" IS NOT NULL 
          THEN ((s.unit_price_ttc / (1 + ip."TVA" / 100.0)) - ins.weighted_average_price) / 
               (s.unit_price_ttc / (1 + ip."TVA" / 100.0)) * 100
          ELSE 0 
        END as marge_pct_fin,
        s.date
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        AND ip.pharmacy_id = ${pharmacyParam}
        ${productFilter}
      ORDER BY ip.code_13_ref_id, s.date DESC
    ),
    marche_concurrent AS (
      SELECT 
        AVG(s.unit_price_ttc) as prix_vente_marche
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ip.pharmacy_id != ${pharmacyParam}
        ${productFilter}
    ),
    mes_prix_actuels AS (
      SELECT 
        AVG(s.unit_price_ttc) as prix_vente_selection
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ip.pharmacy_id = ${pharmacyParam}
        ${productFilter}
    ),
    product_evolutions AS (
      SELECT 
        d.code_13_ref_id,
        CASE 
          WHEN d.prix_vente_debut > 0 
          THEN ((f.prix_vente_fin - d.prix_vente_debut) / d.prix_vente_debut) * 100
          ELSE 0
        END as evolution_prix_vente_pct,
        CASE 
          WHEN d.prix_achat_debut > 0 
          THEN ((f.prix_achat_fin - d.prix_achat_debut) / d.prix_achat_debut) * 100
          ELSE 0
        END as evolution_prix_achat_pct,
        (f.marge_pct_fin - d.marge_pct_debut) as evolution_marge_pct
      FROM prix_debut d
      INNER JOIN prix_fin f ON d.code_13_ref_id = f.code_13_ref_id
    )
    SELECT 
      ROUND(AVG(pe.evolution_prix_vente_pct), 2) as evolution_prix_vente_pct,
      ROUND(AVG(pe.evolution_prix_achat_pct), 2) as evolution_prix_achat_pct,
      ROUND(AVG(pe.evolution_marge_pct), 2) as evolution_marge_pct,
      CASE 
        WHEN AVG(mc.prix_vente_marche) > 0 
        THEN ROUND(
          ((AVG(mpa.prix_vente_selection) - AVG(mc.prix_vente_marche)) / AVG(mc.prix_vente_marche)) * 100, 
          2
        )
        ELSE 0
      END as ecart_prix_vs_marche_pct,
      COUNT(pe.code_13_ref_id)::int as nb_produits_analyses
    FROM product_evolutions pe
    CROSS JOIN marche_concurrent mc
    CROSS JOIN mes_prix_actuels mpa;
  `;

  const result = await db.query(query, params);
  const rawResult = result[0];

  console.log('🔍 [DEBUG] Raw user query result:', rawResult);

  if (!rawResult) {
    return {
      evolution_prix_vente_pct: 0,
      evolution_prix_achat_pct: 0,
      evolution_marge_pct: 0,
      ecart_prix_vs_marche_pct: 0,
      nb_produits_analyses: 0
    };
  }

  return {
    evolution_prix_vente_pct: Number(rawResult.evolution_prix_vente_pct) || 0,
    evolution_prix_achat_pct: Number(rawResult.evolution_prix_achat_pct) || 0,
    evolution_marge_pct: Number(rawResult.evolution_marge_pct) || 0,
    ecart_prix_vs_marche_pct: Number(rawResult.ecart_prix_vs_marche_pct) || 0,
    nb_produits_analyses: Number(rawResult.nb_produits_analyses) || 0
  };
}

async function executeMarketEvolutionQuery(
  dateRange: { start: string; end: string },
  productCodes: string[],
  hasProductFilter: boolean = true
): Promise<PriceEvolutionMetrics> {

  console.log('🔍 [API] Market-only evolution - global market trends');
  
  const productFilter = hasProductFilter 
    ? 'AND ip.code_13_ref_id = ANY($3::text[])'
    : '';

  const params = hasProductFilter
    ? [dateRange.start, dateRange.end, productCodes]
    : [dateRange.start, dateRange.end];

  const query = `
    WITH prix_debut AS (
      SELECT DISTINCT ON (ip.code_13_ref_id)
        ip.code_13_ref_id,
        s.unit_price_ttc as prix_vente_debut,
        ins.weighted_average_price as prix_achat_debut,
        CASE 
          WHEN s.unit_price_ttc > 0 AND ip."TVA" IS NOT NULL 
          THEN ((s.unit_price_ttc / (1 + ip."TVA" / 100.0)) - ins.weighted_average_price) / 
               (s.unit_price_ttc / (1 + ip."TVA" / 100.0)) * 100
          ELSE 0 
        END as marge_pct_debut,
        s.date
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        ${productFilter}
      ORDER BY ip.code_13_ref_id, s.date ASC
    ),
    prix_fin AS (
      SELECT DISTINCT ON (ip.code_13_ref_id)
        ip.code_13_ref_id,
        s.unit_price_ttc as prix_vente_fin,
        ins.weighted_average_price as prix_achat_fin,
        CASE 
          WHEN s.unit_price_ttc > 0 AND ip."TVA" IS NOT NULL 
          THEN ((s.unit_price_ttc / (1 + ip."TVA" / 100.0)) - ins.weighted_average_price) / 
               (s.unit_price_ttc / (1 + ip."TVA" / 100.0)) * 100
          ELSE 0 
        END as marge_pct_fin,
        s.date
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        ${productFilter}
      ORDER BY ip.code_13_ref_id, s.date DESC
    ),
    product_evolutions AS (
      SELECT 
        d.code_13_ref_id,
        CASE 
          WHEN d.prix_vente_debut > 0 
          THEN ((f.prix_vente_fin - d.prix_vente_debut) / d.prix_vente_debut) * 100
          ELSE 0
        END as evolution_prix_vente_pct,
        CASE 
          WHEN d.prix_achat_debut > 0 
          THEN ((f.prix_achat_fin - d.prix_achat_debut) / d.prix_achat_debut) * 100
          ELSE 0
        END as evolution_prix_achat_pct,
        (f.marge_pct_fin - d.marge_pct_debut) as evolution_marge_pct
      FROM prix_debut d
      INNER JOIN prix_fin f ON d.code_13_ref_id = f.code_13_ref_id
    )
    SELECT 
      ROUND(AVG(pe.evolution_prix_vente_pct), 2) as evolution_prix_vente_pct,
      ROUND(AVG(pe.evolution_prix_achat_pct), 2) as evolution_prix_achat_pct,
      ROUND(AVG(pe.evolution_marge_pct), 2) as evolution_marge_pct,
      0.00 as ecart_prix_vs_marche_pct,
      COUNT(pe.code_13_ref_id)::int as nb_produits_analyses
    FROM product_evolutions pe;
  `;

  const result = await db.query(query, params);
  const rawResult = result[0];

  console.log('🔍 [DEBUG] Raw market query result:', rawResult);

  if (!rawResult) {
    return {
      evolution_prix_vente_pct: 0,
      evolution_prix_achat_pct: 0,
      evolution_marge_pct: 0,
      ecart_prix_vs_marche_pct: 0,
      nb_produits_analyses: 0
    };
  }

  return {
    evolution_prix_vente_pct: Number(rawResult.evolution_prix_vente_pct) || 0,
    evolution_prix_achat_pct: Number(rawResult.evolution_prix_achat_pct) || 0,
    evolution_marge_pct: Number(rawResult.evolution_marge_pct) || 0,
    ecart_prix_vs_marche_pct: Number(rawResult.ecart_prix_vs_marche_pct) || 0,
    nb_produits_analyses: Number(rawResult.nb_produits_analyses) || 0
  };
}

function generateCacheKey(params: {
  dateRange: { start: string; end: string };
  productCodes: string[];
  pharmacyIds: string[];
  role: string;
  hasProductFilter: boolean;
}): string {
  const data = JSON.stringify({
    dateRange: params.dateRange,
    productCodes: params.hasProductFilter ? params.productCodes.sort() : [],
    pharmacyIds: params.pharmacyIds.sort(),
    role: params.role,
    hasProductFilter: params.hasProductFilter
  });
  
  const hash = crypto.createHash('md5').update(data).digest('hex');
  return `price:evolution:${hash}`;
}