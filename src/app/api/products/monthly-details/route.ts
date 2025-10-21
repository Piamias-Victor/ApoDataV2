// src/app/api/products/monthly-details/route.ts
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

interface MonthlyDetailsRequest {
  readonly productCodes: string[];
  readonly laboratoryCodes: string[];
  readonly categoryCodes: string[];
  readonly pharmacyIds?: string[];
}

interface MonthlyDetailsRow {
  readonly nom: string;
  readonly code_ean: string;
  readonly mois: string;
  readonly mois_libelle: string;
  readonly type_ligne: 'MENSUEL' | 'SYNTHESE' | 'STOCK_MOYEN';
  readonly quantite_vendue: number;
  readonly quantite_stock: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
}

function calculateLast12Months(): { start: string; end: string } {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const startString = startDate.toISOString().split('T')[0];
  const endString = endDate.toISOString().split('T')[0];
  
  if (!startString || !endString) {
    throw new Error('Date calculation failed');
  }
  
  return {
    start: startString,
    end: endString
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    console.log('🔥 [API] Monthly details API called');
    
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

    let body: MonthlyDetailsRequest;
    try {
      body = await request.json();
      console.log('📥 [API] Request body received:', body);
    } catch (jsonError) {
      console.log('💥 [API] JSON parsing error:', jsonError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    const dateRange = calculateLast12Months();
    console.log('📅 [API] Auto-calculated 12 months range:', dateRange);

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
    console.log('🎯 [API] Has product filter:', hasProductFilter);

    const secureFilters = enforcePharmacySecurity({
      dateRange,
      pharmacy: body.pharmacyIds || []
    }, context);

    console.log('🛡️ [API] Secure filters applied:', secureFilters);

    const cacheKey = generateCacheKey({
      dateRange,
      productCodes: allProductCodes,
      pharmacyIds: secureFilters.pharmacy || [],
      role: context.userRole,
      hasProductFilter
    });

    console.log('🔑 [API] Cache key generated:', cacheKey);

    if (CACHE_ENABLED) {
      console.log('💾 [API] Checking cache...');
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log('✅ [API] Cache HIT - returning cached data');
          return NextResponse.json({
            ...(cached as any),
            cached: true,
            queryTime: Date.now() - startTime
          });
        } else {
          console.log('❌ [API] Cache MISS - will query database');
        }
      } catch (cacheError) {
        console.warn('⚠️ [API] Cache read error:', cacheError);
      }
    } else {
      console.log('🚫 [API] Cache disabled');
    }

    console.log('🗃️ [API] Executing database query...');
    console.log(`📊 [API] Query type: ${context.isAdmin ? 'ADMIN' : 'USER'}`);
    
    const monthlyData = context.isAdmin 
      ? await executeAdminQuery(dateRange, allProductCodes, secureFilters.pharmacy, hasProductFilter)
      : await executeUserQuery(dateRange, allProductCodes, context.pharmacyId!, hasProductFilter);

    console.log('📈 [API] Query completed:', {
      dataFound: monthlyData.length,
      dateRangeUsed: dateRange,
      queryTimeMs: Date.now() - startTime
    });

    if (monthlyData.length > 0) {
      console.log('🔍 [API] Sample data:', monthlyData[0]);
    }

    const result = {
      monthlyData,
      count: monthlyData.length,
      dateRange,
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

    console.log('🎉 [API] Success - returning result');
    return NextResponse.json(result);

  } catch (error) {
    console.error('💥 [API] Monthly details API error:', error);
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
): Promise<MonthlyDetailsRow[]> {
  const pharmacyFilter = pharmacyIds && pharmacyIds.length > 0
    ? 'AND ip.pharmacy_id = ANY($4::uuid[])'
    : '';

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
  
  if (pharmacyIds && pharmacyIds.length > 0) {
    params.push(pharmacyIds);
  }

  const finalPharmacyFilter = pharmacyFilter.replace('$4', `$${paramIndex}`);

  const query = `
    WITH last_12_months AS (
      SELECT 
        DATE_TRUNC('month', $2::date - (n || ' months')::interval) as mois,
        n as mois_offset
      FROM generate_series(0, 11) n
    ),
    monthly_sales AS (
      SELECT 
        ip.code_13_ref_id,
        ip.name as product_name,
        DATE_TRUNC('month', s.date) as mois,
        SUM(s.quantity) as quantite_vendue_mois,
        AVG(s.unit_price_ttc) as prix_vente_moyen_mois,
        AVG(ins.weighted_average_price) as prix_achat_moyen_mois,
        AVG(
          CASE 
            WHEN s.unit_price_ttc > 0 AND (gp.tva_percentage IS NOT NULL OR gp.bcb_tva_rate IS NOT NULL)
            THEN (
              (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
            ) / (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)) * 100
            ELSE 0 
          END
        ) as taux_marge_moyen_mois
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
      WHERE s.date >= $1::date
        AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        AND (gp.tva_percentage IS NOT NULL OR gp.bcb_tva_rate IS NOT NULL)
        AND COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) > 0
        ${productFilter}
        ${finalPharmacyFilter}
      GROUP BY ip.code_13_ref_id, ip.name, DATE_TRUNC('month', s.date)
    ),
    monthly_stock AS (
      SELECT DISTINCT ON (ip.code_13_ref_id, DATE_TRUNC('month', ins.date))
        ip.code_13_ref_id,
        ip.name as product_name,
        DATE_TRUNC('month', ins.date) as mois,
        ins.stock as quantite_stock_fin_mois
      FROM data_inventorysnapshot ins
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE ins.date >= $1::date
        AND ins.date <= $2::date
        ${productFilter}
        ${finalPharmacyFilter}
      ORDER BY ip.code_13_ref_id, DATE_TRUNC('month', ins.date), ins.date DESC
    ),
    product_info AS (
      SELECT DISTINCT
        ip.code_13_ref_id,
        ip.name as product_name
      FROM data_internalproduct ip
      WHERE 1=1
        ${productFilter}
        ${finalPharmacyFilter}
    ),
    all_results AS (
      -- Résultats par mois
      SELECT 
        pi.product_name as nom,
        pi.code_13_ref_id as code_ean,
        TO_CHAR(lm.mois, 'YYYY-MM') as mois,
        TO_CHAR(lm.mois, 'Month YYYY') as mois_libelle,
        lm.mois_offset,
        'MENSUEL' as type_ligne,
        
        COALESCE(ms.quantite_vendue_mois, 0) as quantite_vendue,
        COALESCE(mst.quantite_stock_fin_mois, 0) as quantite_stock,
        ROUND(COALESCE(ms.prix_achat_moyen_mois, 0), 2) as prix_achat_moyen,
        ROUND(COALESCE(ms.prix_vente_moyen_mois, 0), 2) as prix_vente_moyen,
        ROUND(COALESCE(ms.taux_marge_moyen_mois, 0), 2) as taux_marge_moyen,
        1 as sort_order
        
      FROM product_info pi
      CROSS JOIN last_12_months lm
      LEFT JOIN monthly_sales ms ON pi.code_13_ref_id = ms.code_13_ref_id AND lm.mois = ms.mois
      LEFT JOIN monthly_stock mst ON pi.code_13_ref_id = mst.code_13_ref_id AND lm.mois = mst.mois
      
      UNION ALL
      
      -- Ligne de synthèse par produit
      SELECT 
        pi.product_name as nom,
        pi.code_13_ref_id as code_ean,
        'TOTAL' as mois,
        'SYNTHÈSE 12 MOIS' as mois_libelle,
        -1 as mois_offset,
        'SYNTHESE' as type_ligne,
        
        COALESCE(SUM(ms.quantite_vendue_mois), 0) as quantite_vendue,
        
        COALESCE(
          (SELECT mst.quantite_stock_fin_mois 
           FROM monthly_stock mst 
           WHERE mst.code_13_ref_id = pi.code_13_ref_id 
           ORDER BY mst.mois DESC 
           LIMIT 1), 0
        ) as quantite_stock,
        
        ROUND(COALESCE(AVG(ms.prix_achat_moyen_mois), 0), 2) as prix_achat_moyen,
        ROUND(COALESCE(AVG(ms.prix_vente_moyen_mois), 0), 2) as prix_vente_moyen,
        ROUND(COALESCE(AVG(ms.taux_marge_moyen_mois), 0), 2) as taux_marge_moyen,
        0 as sort_order
        
      FROM product_info pi
      LEFT JOIN monthly_sales ms ON pi.code_13_ref_id = ms.code_13_ref_id
      GROUP BY pi.product_name, pi.code_13_ref_id
      
      UNION ALL
      
      -- Ligne stock moyen 12 mois par produit
      SELECT 
        pi.product_name as nom,
        pi.code_13_ref_id as code_ean,
        'STOCK_MOYEN' as mois,
        'STOCK MOYEN 12 MOIS' as mois_libelle,
        -2 as mois_offset,
        'STOCK_MOYEN' as type_ligne,
        
        0 as quantite_vendue,
        ROUND(COALESCE(AVG(mst.quantite_stock_fin_mois), 0), 0) as quantite_stock,
        0 as prix_achat_moyen,
        0 as prix_vente_moyen,
        0 as taux_marge_moyen,
        0 as sort_order
        
      FROM product_info pi
      LEFT JOIN monthly_stock mst ON pi.code_13_ref_id = mst.code_13_ref_id
      GROUP BY pi.product_name, pi.code_13_ref_id
    )
    SELECT 
      nom,
      code_ean,
      mois,
      mois_libelle,
      type_ligne,
      quantite_vendue,
      quantite_stock,
      prix_achat_moyen,
      prix_vente_moyen,
      taux_marge_moyen
    FROM all_results
    ORDER BY nom, sort_order, mois_offset DESC;
  `;

  return await db.query(query, params);
}

async function executeUserQuery(
  dateRange: { start: string; end: string },
  productCodes: string[],
  pharmacyId: string,
  hasProductFilter: boolean = true
): Promise<MonthlyDetailsRow[]> {
  
  const productFilter = hasProductFilter 
    ? 'AND ip.code_13_ref_id = ANY($3::text[])'
    : '';

  const params = hasProductFilter
    ? [dateRange.start, dateRange.end, productCodes, pharmacyId]
    : [dateRange.start, dateRange.end, pharmacyId];

  const pharmacyParam = hasProductFilter ? '$4::uuid' : '$3::uuid';

  const query = `
    WITH last_12_months AS (
      SELECT 
        DATE_TRUNC('month', $2::date - (n || ' months')::interval) as mois,
        n as mois_offset
      FROM generate_series(0, 11) n
    ),
    monthly_sales AS (
      SELECT 
        ip.code_13_ref_id,
        ip.name as product_name,
        DATE_TRUNC('month', s.date) as mois,
        SUM(s.quantity) as quantite_vendue_mois,
        AVG(s.unit_price_ttc) as prix_vente_moyen_mois,
        AVG(ins.weighted_average_price) as prix_achat_moyen_mois,
        AVG(
          CASE 
            WHEN s.unit_price_ttc > 0 AND (gp.tva_percentage IS NOT NULL OR gp.bcb_tva_rate IS NOT NULL)
            THEN (
              (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
            ) / (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)) * 100
            ELSE 0 
          END
        ) as taux_marge_moyen_mois
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
      WHERE s.date >= $1::date
        AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        AND (gp.tva_percentage IS NOT NULL OR gp.bcb_tva_rate IS NOT NULL)
        AND COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) > 0
        AND ip.pharmacy_id = ${pharmacyParam}
        ${productFilter}
      GROUP BY ip.code_13_ref_id, ip.name, DATE_TRUNC('month', s.date)
    ),
    monthly_stock AS (
      SELECT DISTINCT ON (ip.code_13_ref_id, DATE_TRUNC('month', ins.date))
        ip.code_13_ref_id,
        ip.name as product_name,
        DATE_TRUNC('month', ins.date) as mois,
        ins.stock as quantite_stock_fin_mois
      FROM data_inventorysnapshot ins
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE ins.date >= $1::date
        AND ins.date <= $2::date
        AND ip.pharmacy_id = ${pharmacyParam}
        ${productFilter}
      ORDER BY ip.code_13_ref_id, DATE_TRUNC('month', ins.date), ins.date DESC
    ),
    product_info AS (
      SELECT DISTINCT
        ip.code_13_ref_id,
        ip.name as product_name
      FROM data_internalproduct ip
      WHERE ip.pharmacy_id = ${pharmacyParam}
        ${productFilter}
    ),
    all_results AS (
      -- Résultats par mois
      SELECT 
        pi.product_name as nom,
        pi.code_13_ref_id as code_ean,
        TO_CHAR(lm.mois, 'YYYY-MM') as mois,
        TO_CHAR(lm.mois, 'Month YYYY') as mois_libelle,
        lm.mois_offset,
        'MENSUEL' as type_ligne,
        
        COALESCE(ms.quantite_vendue_mois, 0) as quantite_vendue,
        COALESCE(mst.quantite_stock_fin_mois, 0) as quantite_stock,
        ROUND(COALESCE(ms.prix_achat_moyen_mois, 0), 2) as prix_achat_moyen,
        ROUND(COALESCE(ms.prix_vente_moyen_mois, 0), 2) as prix_vente_moyen,
        ROUND(COALESCE(ms.taux_marge_moyen_mois, 0), 2) as taux_marge_moyen,
        1 as sort_order
        
      FROM product_info pi
      CROSS JOIN last_12_months lm
      LEFT JOIN monthly_sales ms ON pi.code_13_ref_id = ms.code_13_ref_id AND lm.mois = ms.mois
      LEFT JOIN monthly_stock mst ON pi.code_13_ref_id = mst.code_13_ref_id AND lm.mois = mst.mois
      
      UNION ALL
      
      -- Ligne de synthèse par produit
      SELECT 
        pi.product_name as nom,
        pi.code_13_ref_id as code_ean,
        'TOTAL' as mois,
        'SYNTHÈSE 12 MOIS' as mois_libelle,
        -1 as mois_offset,
        'SYNTHESE' as type_ligne,
        
        COALESCE(SUM(ms.quantite_vendue_mois), 0) as quantite_vendue,
        
        COALESCE(
          (SELECT mst.quantite_stock_fin_mois 
           FROM monthly_stock mst 
           WHERE mst.code_13_ref_id = pi.code_13_ref_id 
           ORDER BY mst.mois DESC 
           LIMIT 1), 0
        ) as quantite_stock,
        
        ROUND(COALESCE(AVG(ms.prix_achat_moyen_mois), 0), 2) as prix_achat_moyen,
        ROUND(COALESCE(AVG(ms.prix_vente_moyen_mois), 0), 2) as prix_vente_moyen,
        ROUND(COALESCE(AVG(ms.taux_marge_moyen_mois), 0), 2) as taux_marge_moyen,
        0 as sort_order
        
      FROM product_info pi
      LEFT JOIN monthly_sales ms ON pi.code_13_ref_id = ms.code_13_ref_id
      GROUP BY pi.product_name, pi.code_13_ref_id
      
      UNION ALL
      
      -- Ligne stock moyen 12 mois par produit
      SELECT 
        pi.product_name as nom,
        pi.code_13_ref_id as code_ean,
        'STOCK_MOYEN' as mois,
        'STOCK MOYEN 12 MOIS' as mois_libelle,
        -2 as mois_offset,
        'STOCK_MOYEN' as type_ligne,
        
        0 as quantite_vendue,
        ROUND(COALESCE(AVG(mst.quantite_stock_fin_mois), 0), 0) as quantite_stock,
        0 as prix_achat_moyen,
        0 as prix_vente_moyen,
        0 as taux_marge_moyen,
        0 as sort_order
        
      FROM product_info pi
      LEFT JOIN monthly_stock mst ON pi.code_13_ref_id = mst.code_13_ref_id
      GROUP BY pi.product_name, pi.code_13_ref_id
    )
    SELECT 
      nom,
      code_ean,
      mois,
      mois_libelle,
      type_ligne,
      quantite_vendue,
      quantite_stock,
      prix_achat_moyen,
      prix_vente_moyen,
      taux_marge_moyen
    FROM all_results
    ORDER BY nom, sort_order, mois_offset DESC;
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
  return `products:monthly-details:${hash}`;
}