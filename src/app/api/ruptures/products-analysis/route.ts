// src/app/api/ruptures/products-analysis/route.ts
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
const CACHE_TTL = 3600;

interface RupturesProductsRequest {
  readonly dateRange: { start: string; end: string };
  readonly productCodes: string[];
  readonly laboratoryCodes: string[];
  readonly categoryCodes: string[];
  readonly pharmacyIds?: string[];
}

interface RuptureProductRow {
  readonly nom: string;
  readonly code_ean: string;
  readonly periode: string;
  readonly periode_libelle: string;
  readonly type_ligne: 'DETAIL' | 'SYNTHESE';
  readonly quantite_vendue: number;
  readonly quantite_commandee: number;
  readonly quantite_receptionnee: number;
  readonly quantite_stock: number;
  readonly delta_quantite: number;
  readonly taux_reception: number;
  readonly prix_achat_moyen: number;
  readonly montant_delta: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    console.log('🔥 [API] Ruptures products API called');
    
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

    let body: RupturesProductsRequest;
    try {
      const contentType = request.headers.get('content-type');
      console.log('📝 [API] Content-Type:', contentType);
      
      const text = await request.text();
      console.log('📥 [API] Raw body length:', text.length);
      
      if (!text || text.length === 0) {
        console.log('⚠️ [API] Empty body received, using defaults');
        body = {
          dateRange: { start: '', end: '' },
          productCodes: [],
          laboratoryCodes: [],
          categoryCodes: [],
          pharmacyIds: []
        };
      } else {
        body = JSON.parse(text);
        console.log('📥 [API] Request body parsed:', body);
      }
    } catch (jsonError) {
      console.log('💥 [API] JSON parsing error:', jsonError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
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
    
    const rupturesData = context.isAdmin 
      ? await executeAdminQuery(body.dateRange, allProductCodes, secureFilters.pharmacy, hasProductFilter)
      : await executeUserQuery(body.dateRange, allProductCodes, context.pharmacyId!, hasProductFilter);

    console.log('📈 [API] Query completed:', {
      dataFound: rupturesData.length,
      dateRangeUsed: body.dateRange,
      queryTimeMs: Date.now() - startTime
    });

    const result = {
      rupturesData,
      count: rupturesData.length,
      dateRange: body.dateRange,
      queryTime: Date.now() - startTime,
      cached: false
    };

    if (CACHE_ENABLED && rupturesData.length > 0) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
        console.log('💾 [API] Result cached successfully');
      } catch (cacheError) {
        console.warn('⚠️ [API] Cache write error:', cacheError);
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('💥 [API] Ruptures products API error:', error);
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
  hasProductFilter: boolean = false
): Promise<RuptureProductRow[]> {
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
  const orderPharmacyFilter = finalPharmacyFilter;

  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const useMonthlyGrouping = diffDays > 62;

  const periodGrouping = useMonthlyGrouping 
    ? "DATE_TRUNC('month', periode)"
    : "periode";
  
  const periodFormat = useMonthlyGrouping 
    ? "TO_CHAR(periode, 'YYYY-MM')"
    : "TO_CHAR(periode, 'YYYY-MM-DD')";

  const periodLabel = useMonthlyGrouping
    ? "TO_CHAR(periode, 'Month YYYY')"
    : "TO_CHAR(periode, 'DD/MM/YYYY')";

  const stockGrouping = useMonthlyGrouping ? 'month' : 'day';

  const query = `
    WITH sales_data AS (
      SELECT 
        ip.code_13_ref_id,
        SUM(s.quantity) as quantite_vendue,
        s.date as periode,
        AVG(ins.weighted_average_price) as prix_achat_moyen
      FROM data_sales s
      INNER JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      INNER JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1 AND s.date <= $2
        ${productFilter}
        ${finalPharmacyFilter}
      GROUP BY ip.code_13_ref_id, s.date
    ),
    stock_data AS (
      SELECT DISTINCT ON (ip.code_13_ref_id, DATE_TRUNC('${stockGrouping}', ins.date))
        ip.code_13_ref_id,
        DATE_TRUNC('${stockGrouping}', ins.date) as periode,
        ins.stock as quantite_stock
      FROM data_inventorysnapshot ins
      INNER JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE ins.date >= $1::date
        AND ins.date <= $2::date
        ${productFilter}
        ${finalPharmacyFilter}
      ORDER BY ip.code_13_ref_id, DATE_TRUNC('${stockGrouping}', ins.date), ins.date DESC
    ),
    orders_data AS (
      SELECT 
        ip.code_13_ref_id,
        o.delivery_date as periode,
        SUM(po.qte) as quantite_commandee,
        SUM(po.qte_r) as quantite_receptionnee
      FROM data_order o
      INNER JOIN data_productorder po ON po.order_id = o.id
      INNER JOIN data_internalproduct ip ON po.product_id = ip.id
      WHERE o.delivery_date >= $1::date 
        AND o.delivery_date <= $2::date
        AND o.delivery_date IS NOT NULL
        ${productFilter}
        ${orderPharmacyFilter}
      GROUP BY ip.code_13_ref_id, o.delivery_date
    ),
    combined_data AS (
      SELECT 
        COALESCE(s.code_13_ref_id, o.code_13_ref_id, st.code_13_ref_id) as code_13_ref_id,
        COALESCE(s.periode, o.periode, st.periode) as periode,
        COALESCE(s.quantite_vendue, 0) as quantite_vendue,
        COALESCE(o.quantite_commandee, 0) as quantite_commandee,
        COALESCE(o.quantite_receptionnee, 0) as quantite_receptionnee,
        COALESCE(st.quantite_stock, 0) as quantite_stock,
        COALESCE(s.prix_achat_moyen, 0) as prix_achat_moyen
      FROM sales_data s
      FULL OUTER JOIN orders_data o 
        ON s.code_13_ref_id = o.code_13_ref_id 
        AND s.periode = o.periode
      FULL OUTER JOIN stock_data st
        ON COALESCE(s.code_13_ref_id, o.code_13_ref_id) = st.code_13_ref_id
        AND DATE_TRUNC('${stockGrouping}', COALESCE(s.periode, o.periode)) = st.periode
    ),
    period_data AS (
      SELECT 
        code_13_ref_id,
        ${periodGrouping} as periode,
        SUM(quantite_vendue) as quantite_vendue,
        SUM(quantite_commandee) as quantite_commandee,
        SUM(quantite_receptionnee) as quantite_receptionnee,
        AVG(quantite_stock) as quantite_stock,
        AVG(NULLIF(prix_achat_moyen, 0)) as prix_achat_moyen
      FROM combined_data
      GROUP BY code_13_ref_id, ${periodGrouping}
    ),
    all_results AS (
      SELECT 
        gp.name as nom,
        gp.code_13_ref as code_ean,
        ${periodFormat} as periode,
        ${periodLabel} as periode_libelle,
        'DETAIL' as type_ligne,
        pd.quantite_vendue::numeric,
        pd.quantite_commandee::numeric,
        pd.quantite_receptionnee::numeric,
        ROUND(pd.quantite_stock::numeric, 0) as quantite_stock,
        (pd.quantite_commandee - pd.quantite_receptionnee)::numeric as delta_quantite,
        CASE 
          WHEN pd.quantite_commandee > 0 
          THEN ROUND((pd.quantite_receptionnee::numeric / pd.quantite_commandee::numeric) * 100, 2)
          ELSE 100
        END as taux_reception,
        ROUND(COALESCE(pd.prix_achat_moyen, 0), 2) as prix_achat_moyen,
        ROUND((pd.quantite_commandee - pd.quantite_receptionnee) * COALESCE(pd.prix_achat_moyen, 0), 2) as montant_delta,
        pd.periode as sort_periode,
        1 as sort_order
      FROM period_data pd
      INNER JOIN data_globalproduct gp ON pd.code_13_ref_id = gp.code_13_ref
      WHERE pd.quantite_vendue > 0 OR pd.quantite_commandee > 0 OR pd.quantite_receptionnee > 0
      
      UNION ALL
      
      SELECT 
        gp.name as nom,
        gp.code_13_ref as code_ean,
        'TOTAL' as periode,
        'SYNTHÈSE PÉRIODE' as periode_libelle,
        'SYNTHESE' as type_ligne,
        SUM(pd.quantite_vendue)::numeric as quantite_vendue,
        SUM(pd.quantite_commandee)::numeric as quantite_commandee,
        SUM(pd.quantite_receptionnee)::numeric as quantite_receptionnee,
        ROUND(AVG(pd.quantite_stock)::numeric, 0) as quantite_stock,
        (SUM(pd.quantite_commandee) - SUM(pd.quantite_receptionnee))::numeric as delta_quantite,
        CASE 
          WHEN SUM(pd.quantite_commandee) > 0 
          THEN ROUND((SUM(pd.quantite_receptionnee)::numeric / SUM(pd.quantite_commandee)::numeric) * 100, 2)
          ELSE 100
        END as taux_reception,
        ROUND(AVG(NULLIF(pd.prix_achat_moyen, 0)), 2) as prix_achat_moyen,
        ROUND((SUM(pd.quantite_commandee) - SUM(pd.quantite_receptionnee)) * AVG(NULLIF(pd.prix_achat_moyen, 0)), 2) as montant_delta,
        NULL as sort_periode,
        0 as sort_order
      FROM period_data pd
      INNER JOIN data_globalproduct gp ON pd.code_13_ref_id = gp.code_13_ref
      GROUP BY gp.name, gp.code_13_ref
      HAVING SUM(pd.quantite_vendue) > 0 OR SUM(pd.quantite_commandee) > 0 OR SUM(pd.quantite_receptionnee) > 0
    )
    SELECT 
      nom,
      code_ean,
      periode,
      periode_libelle,
      type_ligne,
      quantite_vendue,
      quantite_commandee,
      quantite_receptionnee,
      quantite_stock,
      delta_quantite,
      taux_reception,
      prix_achat_moyen,
      montant_delta
    FROM all_results
    ORDER BY nom, sort_order, sort_periode ASC;
  `;

  console.log('🔍 [API] Executing admin query with params:', params);
  return await db.query(query, params);
}

async function executeUserQuery(
  dateRange: { start: string; end: string },
  productCodes: string[],
  pharmacyId: string,
  hasProductFilter: boolean = false
): Promise<RuptureProductRow[]> {
  return executeAdminQuery(dateRange, productCodes, [pharmacyId], hasProductFilter);
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
  return `ruptures:products:${hash}`;
}