// src/app/api/competitive-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSecurityContext, enforcePharmacySecurity } from '@/lib/api-security';
import { db } from '@/lib/db';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true' && 
                     process.env.UPSTASH_REDIS_REST_URL && 
                     process.env.UPSTASH_REDIS_REST_TOKEN;
const CACHE_TTL = 43200; // 12 heures

interface CompetitiveAnalysisRequest {
  readonly dateRange: {
    readonly start: string;
    readonly end: string;
  };
  readonly productCodes: string[];
  readonly laboratoryCodes: string[];
  readonly categoryCodes: string[];
  readonly pharmacyIds?: string[];
}

interface CompetitiveMetrics {
  readonly product_name: string;
  readonly code_ean: string;
  readonly prix_vente_min_global: number;
  readonly prix_vente_max_global: number;
  readonly prix_vente_moyen_global: number;
  readonly nb_pharmacies_vendant: number;
  readonly prix_vente_moyen_selection: number;
  readonly prix_achat_moyen_ht: number;
  readonly quantite_vendue_selection: number;
  readonly taux_marge_moyen_selection: number;
  readonly ecart_prix_vs_marche_pct: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    console.log('🔥 [API] Competitive analysis API called');
    
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

    let body: CompetitiveAnalysisRequest;
    try {
      body = await request.json();
      console.log('📥 [API] Request body received:', body);
    } catch (jsonError) {
      console.log('💥 [API] JSON parsing error:', jsonError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    // Validation des dates
    if (!body.dateRange?.start || !body.dateRange?.end) {
      console.log('❌ [API] Missing date range');
      return NextResponse.json({ error: 'Date range required' }, { status: 400 });
    }

    // 2. Fusion des codes EAN
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

    // 3. Application sécurité pharmacie
    const secureFilters = enforcePharmacySecurity({
      dateRange: body.dateRange,
      pharmacy: body.pharmacyIds || []
    }, context);

    console.log('🛡️ [API] Secure filters applied:', secureFilters);

    // 4. Cache
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

    // 5. Exécution requête selon rôle
    console.log('🗃️ [API] Executing database query...');
    
    const products = context.isAdmin 
      ? await executeAdminQuery(body.dateRange, allProductCodes, secureFilters.pharmacy, hasProductFilter, context)
      : await executeUserQuery(body.dateRange, allProductCodes, context.pharmacyId!, hasProductFilter);

    console.log('📈 [API] Query completed:', {
      productsFound: products.length,
      queryTimeMs: Date.now() - startTime
    });

    const result = {
      products,
      count: products.length,
      queryTime: Date.now() - startTime,
      cached: false
    };

    // 6. Cache
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
    console.error('💥 [API] Competitive analysis API error:', error);
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
  hasProductFilter: boolean = true,
  context: any
): Promise<CompetitiveMetrics[]> {

  const isNoPharmacySelected = !pharmacyIds || pharmacyIds.length === 0;
  
  // Si admin SANS pharmacie sélectionnée → mes prix = prix marché global
  if (isNoPharmacySelected) {
    console.log('🔍 [API] Admin mode WITHOUT pharmacy selection - market = selection');
    return await executeMarketOnlyQuery(dateRange, productCodes, hasProductFilter);
  }

  // Si admin AVEC pharmacie(s) → marché = toutes SAUF sélectionnées
  console.log('🔍 [API] Admin mode WITH pharmacy selection - market excludes selected');
  
  const productFilter = hasProductFilter 
    ? 'AND ip.code_13_ref_id = ANY($3::text[])'
    : '';

  const params = [];
  let paramIndex = 1;
  
  params.push(dateRange.start); // $1
  params.push(dateRange.end);   // $2
  
  if (hasProductFilter) {
    params.push(productCodes);  // $3
    paramIndex = 4;
  } else {
    paramIndex = 3;
  }
  
  params.push(pharmacyIds);   // $4 ou $3

  const pharmacyParam = `$${paramIndex}::uuid[]`;

  const query = `
    WITH global_price_stats AS (
      -- Prix marché concurrent (SANS les pharmacies sélectionnées)
      SELECT 
        ip.code_13_ref_id,
        MIN(ins.price_with_tax) as prix_vente_min_global,
        MAX(ins.price_with_tax) as prix_vente_max_global,
        AVG(ins.price_with_tax) as prix_vente_moyen_global,
        COUNT(DISTINCT ip.pharmacy_id) as nb_pharmacies_vendant
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND ins.price_with_tax > 0
        AND ip.pharmacy_id != ALL(${pharmacyParam})  -- EXCLUT les pharmacies sélectionnées
        ${productFilter}
      GROUP BY ip.code_13_ref_id
    ),
    selection_stats AS (
      -- Stats des pharmacies sélectionnées uniquement
      SELECT 
        ip.code_13_ref_id,
        AVG(ins.price_with_tax) as prix_vente_moyen_selection,
        AVG(ins.weighted_average_price) as prix_achat_moyen_ht,
        SUM(s.quantity) as quantite_vendue_selection,
        AVG(
          CASE 
            WHEN ins.price_with_tax > 0 AND ip."TVA" IS NOT NULL 
            THEN ((ins.price_with_tax / (1 + ip."TVA" / 100.0)) - ins.weighted_average_price) / 
                 (ins.price_with_tax / (1 + ip."TVA" / 100.0)) * 100
            ELSE 0 
          END
        ) as taux_marge_moyen_selection
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND ins.price_with_tax > 0
        AND ins.weighted_average_price > 0
        AND ip.pharmacy_id = ANY(${pharmacyParam})  -- LES pharmacies sélectionnées
        ${productFilter}
      GROUP BY ip.code_13_ref_id
    ),
    product_info AS (
      -- Infos produit de base
      SELECT DISTINCT
        gp.code_13_ref,
        gp.name as product_name
      FROM data_globalproduct gp
      INNER JOIN data_internalproduct ip ON gp.code_13_ref = ip.code_13_ref_id
      WHERE 1=1
        ${hasProductFilter ? 'AND gp.code_13_ref = ANY($3::text[])' : ''}
    )
    SELECT 
      pi.product_name,
      pi.code_13_ref as code_ean,
      ROUND(COALESCE(gps.prix_vente_min_global, 0), 2) as prix_vente_min_global,
      ROUND(COALESCE(gps.prix_vente_max_global, 0), 2) as prix_vente_max_global, 
      ROUND(COALESCE(gps.prix_vente_moyen_global, 0), 2) as prix_vente_moyen_global,
      COALESCE(gps.nb_pharmacies_vendant, 0) as nb_pharmacies_vendant,
      ROUND(COALESCE(ss.prix_vente_moyen_selection, 0), 2) as prix_vente_moyen_selection,
      ROUND(COALESCE(ss.prix_achat_moyen_ht, 0), 2) as prix_achat_moyen_ht,
      COALESCE(ss.quantite_vendue_selection, 0) as quantite_vendue_selection,
      ROUND(COALESCE(ss.taux_marge_moyen_selection, 0), 2) as taux_marge_moyen_selection,
      CASE 
        WHEN gps.prix_vente_moyen_global > 0 
        THEN ROUND(
          ((ss.prix_vente_moyen_selection - gps.prix_vente_moyen_global) / gps.prix_vente_moyen_global) * 100, 
          2
        )
        ELSE 0
      END as ecart_prix_vs_marche_pct
    FROM product_info pi
    LEFT JOIN global_price_stats gps ON pi.code_13_ref = gps.code_13_ref_id
    LEFT JOIN selection_stats ss ON pi.code_13_ref = ss.code_13_ref_id
    WHERE (gps.code_13_ref_id IS NOT NULL OR ss.code_13_ref_id IS NOT NULL)
    ORDER BY pi.product_name
    LIMIT 1000;
  `;

  return await db.query(query, params);
}

async function executeUserQuery(
  dateRange: { start: string; end: string },
  productCodes: string[],
  pharmacyId: string,
  hasProductFilter: boolean = true
): Promise<CompetitiveMetrics[]> {

  console.log('🔍 [API] User mode - market excludes user pharmacy');
  
  const productFilter = hasProductFilter 
    ? 'AND ip.code_13_ref_id = ANY($3::text[])'
    : '';

  const params = hasProductFilter
    ? [dateRange.start, dateRange.end, productCodes, pharmacyId]
    : [dateRange.start, dateRange.end, pharmacyId];

  const pharmacyParam = hasProductFilter ? '$4::uuid' : '$3::uuid';

  const query = `
    WITH global_price_stats AS (
      -- Prix marché concurrent (SANS ma pharmacie)
      SELECT 
        ip.code_13_ref_id,
        MIN(ins.price_with_tax) as prix_vente_min_global,
        MAX(ins.price_with_tax) as prix_vente_max_global,
        AVG(ins.price_with_tax) as prix_vente_moyen_global,
        COUNT(DISTINCT ip.pharmacy_id) as nb_pharmacies_vendant
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND ins.price_with_tax > 0
        AND ip.pharmacy_id != ${pharmacyParam}  -- EXCLUT ma pharmacie
        ${productFilter}
      GROUP BY ip.code_13_ref_id
    ),
    my_pharmacy_stats AS (
      -- Stats de MA pharmacie uniquement
      SELECT 
        ip.code_13_ref_id,
        AVG(ins.price_with_tax) as prix_vente_moyen_selection,
        AVG(ins.weighted_average_price) as prix_achat_moyen_ht,
        SUM(s.quantity) as quantite_vendue_selection,
        AVG(
          CASE 
            WHEN ins.price_with_tax > 0 AND ip."TVA" IS NOT NULL 
            THEN ((ins.price_with_tax / (1 + ip."TVA" / 100.0)) - ins.weighted_average_price) / 
                 (ins.price_with_tax / (1 + ip."TVA" / 100.0)) * 100
            ELSE 0 
          END
        ) as taux_marge_moyen_selection
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND ins.price_with_tax > 0
        AND ins.weighted_average_price > 0
        AND ip.pharmacy_id = ${pharmacyParam}  -- MA pharmacie
        ${productFilter}
      GROUP BY ip.code_13_ref_id
    ),
    product_info AS (
      -- Infos produit de base
      SELECT DISTINCT
        ip.name as product_name,
        ip.code_13_ref_id as code_13_ref
      FROM data_internalproduct ip
      WHERE ip.pharmacy_id = ${pharmacyParam}
        ${hasProductFilter ? 'AND ip.code_13_ref_id = ANY($3::text[])' : ''}
    )
    SELECT 
      pi.product_name,
      pi.code_13_ref as code_ean,
      ROUND(COALESCE(gps.prix_vente_min_global, 0), 2) as prix_vente_min_global,
      ROUND(COALESCE(gps.prix_vente_max_global, 0), 2) as prix_vente_max_global, 
      ROUND(COALESCE(gps.prix_vente_moyen_global, 0), 2) as prix_vente_moyen_global,
      COALESCE(gps.nb_pharmacies_vendant, 0) as nb_pharmacies_vendant,
      ROUND(COALESCE(mps.prix_vente_moyen_selection, 0), 2) as prix_vente_moyen_selection,
      ROUND(COALESCE(mps.prix_achat_moyen_ht, 0), 2) as prix_achat_moyen_ht,
      COALESCE(mps.quantite_vendue_selection, 0) as quantite_vendue_selection,
      ROUND(COALESCE(mps.taux_marge_moyen_selection, 0), 2) as taux_marge_moyen_selection,
      CASE 
        WHEN gps.prix_vente_moyen_global > 0 
        THEN ROUND(
          ((mps.prix_vente_moyen_selection - gps.prix_vente_moyen_global) / gps.prix_vente_moyen_global) * 100, 
          2
        )
        ELSE 0
      END as ecart_prix_vs_marche_pct
    FROM product_info pi
    LEFT JOIN global_price_stats gps ON pi.code_13_ref = gps.code_13_ref_id
    LEFT JOIN my_pharmacy_stats mps ON pi.code_13_ref = mps.code_13_ref_id
    WHERE (gps.code_13_ref_id IS NOT NULL OR mps.code_13_ref_id IS NOT NULL)
    ORDER BY pi.product_name
    LIMIT 1000;
  `;

  return await db.query(query, params);
}

async function executeMarketOnlyQuery(
  dateRange: { start: string; end: string },
  productCodes: string[],
  hasProductFilter: boolean = true
): Promise<CompetitiveMetrics[]> {

  console.log('🔍 [API] Market-only mode - same prices for market and selection');
  
  const productFilter = hasProductFilter 
    ? 'AND ip.code_13_ref_id = ANY($3::text[])'
    : '';

  const params = hasProductFilter
    ? [dateRange.start, dateRange.end, productCodes]
    : [dateRange.start, dateRange.end];

  const query = `
    WITH global_price_stats AS (
      -- Prix marché global (toutes pharmacies)
      SELECT 
        ip.code_13_ref_id,
        MIN(ins.price_with_tax) as prix_vente_min_global,
        MAX(ins.price_with_tax) as prix_vente_max_global,
        AVG(ins.price_with_tax) as prix_vente_moyen_global,
        AVG(ins.weighted_average_price) as prix_achat_moyen_ht,
        SUM(s.quantity) as quantite_vendue_selection,
        COUNT(DISTINCT ip.pharmacy_id) as nb_pharmacies_vendant,
        AVG(
          CASE 
            WHEN ins.price_with_tax > 0 AND ip."TVA" IS NOT NULL 
            THEN ((ins.price_with_tax / (1 + ip."TVA" / 100.0)) - ins.weighted_average_price) / 
                 (ins.price_with_tax / (1 + ip."TVA" / 100.0)) * 100
            ELSE 0 
          END
        ) as taux_marge_moyen_selection
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND ins.price_with_tax > 0
        AND ins.weighted_average_price > 0
        ${productFilter}
      GROUP BY ip.code_13_ref_id
    ),
    product_info AS (
      -- Infos produit de base
      SELECT DISTINCT
        gp.code_13_ref,
        gp.name as product_name
      FROM data_globalproduct gp
      WHERE 1=1
        ${hasProductFilter ? 'AND gp.code_13_ref = ANY($3::text[])' : ''}
    )
    SELECT 
      pi.product_name,
      pi.code_13_ref as code_ean,
      ROUND(COALESCE(gps.prix_vente_min_global, 0), 2) as prix_vente_min_global,
      ROUND(COALESCE(gps.prix_vente_max_global, 0), 2) as prix_vente_max_global, 
      ROUND(COALESCE(gps.prix_vente_moyen_global, 0), 2) as prix_vente_moyen_global,
      COALESCE(gps.nb_pharmacies_vendant, 0) as nb_pharmacies_vendant,
      -- Mes prix = prix marché (même valeurs)
      ROUND(COALESCE(gps.prix_vente_moyen_global, 0), 2) as prix_vente_moyen_selection,
      ROUND(COALESCE(gps.prix_achat_moyen_ht, 0), 2) as prix_achat_moyen_ht,
      COALESCE(gps.quantite_vendue_selection, 0) as quantite_vendue_selection,
      ROUND(COALESCE(gps.taux_marge_moyen_selection, 0), 2) as taux_marge_moyen_selection,
      0.00 as ecart_prix_vs_marche_pct  -- Aucun écart car mêmes prix
    FROM product_info pi
    LEFT JOIN global_price_stats gps ON pi.code_13_ref = gps.code_13_ref_id
    WHERE gps.code_13_ref_id IS NOT NULL
    ORDER BY pi.product_name
    LIMIT 1000;
  `;

  return await db.query(query, params);
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
  return `competitive:analysis:${hash}`;
}