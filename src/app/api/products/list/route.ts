// src/app/api/products/list/route.ts
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

interface ProductListRequest {
  readonly dateRange: {
    readonly start: string;
    readonly end: string;
  };
  readonly productCodes: string[];
  readonly laboratoryCodes: string[];
  readonly categoryCodes: string[];
  readonly pharmacyIds?: string[];
}

interface ProductMetrics {
  readonly product_name: string;
  readonly code_ean: string;
  readonly avg_sell_price_ttc: number;
  readonly avg_buy_price_ht: number;
  readonly tva_rate: number;
  readonly avg_sell_price_ht: number;
  readonly margin_rate_percent: number;
  readonly unit_margin_ht: number;
  readonly total_margin_ht: number;
  readonly current_stock: number;
  readonly quantity_sold: number;
  readonly ca_ttc: number;
  readonly quantity_bought: number;
  readonly purchase_amount: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    console.log('🔥 [API] Products list API called');
    
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

    let body: ProductListRequest;
    try {
      body = await request.json();
      console.log('📥 [API] Request body received:', body);
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
    console.log('🎯 [API] Has product filter:', hasProductFilter);

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
    
    const products = context.isAdmin 
      ? await executeAdminQuery(body.dateRange, allProductCodes, secureFilters.pharmacy, hasProductFilter)
      : await executeUserQuery(body.dateRange, allProductCodes, context.pharmacyId!, hasProductFilter);

    console.log('📈 [API] Query completed:', {
      productsFound: products.length,
      queryTimeMs: Date.now() - startTime
    });

    if (products.length > 0) {
      console.log('🔍 [API] Sample product:', products[0]);
    }

    const result = {
      products,
      count: products.length,
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
    console.error('💥 [API] Products list API error:', error);
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
): Promise<ProductMetrics[]> {
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
    WITH product_sales AS (
      SELECT 
        ip.code_13_ref_id,
        SUM(s.quantity) as total_quantity_sold,
        SUM(s.quantity * s.unit_price_ttc) as total_ca_ttc,
        AVG(s.unit_price_ttc) as avg_sell_price_ttc,
        SUM(s.quantity * (
          (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
        )) as total_margin_real,
        SUM(s.quantity * (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0))) as total_ca_ht
      FROM data_sales s
      INNER JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      INNER JOIN data_internalproduct ip ON ins.product_id = ip.id
      LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
      WHERE s.date >= $1 AND s.date <= $2
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        ${productFilter}
        ${finalPharmacyFilter}
      GROUP BY ip.code_13_ref_id
    ),
    product_purchases AS (
      SELECT 
        ip.code_13_ref_id,
        SUM(po.qte_r) as total_quantity_bought,
        SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)) as total_purchase_amount,
        AVG(COALESCE(closest_snap.weighted_average_price, 0)) as avg_buy_price_ht
      FROM data_productorder po
      INNER JOIN data_order o ON po.order_id = o.id
      INNER JOIN data_internalproduct ip ON po.product_id = ip.id
      LEFT JOIN LATERAL (
        SELECT weighted_average_price
        FROM data_inventorysnapshot ins2
        WHERE ins2.product_id = po.product_id
          AND ins2.weighted_average_price > 0
        ORDER BY ins2.date DESC
        LIMIT 1
      ) closest_snap ON true
      WHERE o.delivery_date >= $1::date 
        AND o.delivery_date <= $2::date
        AND o.delivery_date IS NOT NULL
        AND po.qte_r > 0
        ${productFilter}
        ${finalPharmacyFilter}
      GROUP BY ip.code_13_ref_id
    ),
    current_stock AS (
      SELECT 
        code_13_ref_id,
        SUM(stock) as current_stock_qty
      FROM (
        SELECT DISTINCT ON (internal_prod.id)
          internal_prod.id,
          internal_prod.code_13_ref_id,
          ins.stock
        FROM data_inventorysnapshot ins
        INNER JOIN data_internalproduct internal_prod ON ins.product_id = internal_prod.id
        WHERE 1=1
          ${productFilter.replace('ip.', 'internal_prod.')}
          ${finalPharmacyFilter.replace('ip.', 'internal_prod.')}
        ORDER BY internal_prod.id, ins.date DESC
      ) latest_stocks
      GROUP BY code_13_ref_id
    ),
    avg_buy_price AS (
      SELECT 
        ip.code_13_ref_id,
        AVG(ins.weighted_average_price) as avg_buy_price_ht
      FROM data_inventorysnapshot ins
      INNER JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE ins.weighted_average_price > 0
        ${productFilter}
        ${finalPharmacyFilter}
      GROUP BY ip.code_13_ref_id
    )
    SELECT 
      gp.name as product_name,
      gp.code_13_ref as code_ean,
      COALESCE(ps.avg_sell_price_ttc, 0) as avg_sell_price_ttc,
      COALESCE(abp.avg_buy_price_ht, 0) as avg_buy_price_ht,
      COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) as tva_rate,
      COALESCE(ps.avg_sell_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0)/100), 0) as avg_sell_price_ht,
      CASE 
        WHEN COALESCE(ps.total_ca_ht, 0) > 0 THEN
          (COALESCE(ps.total_margin_real, 0) / COALESCE(ps.total_ca_ht, 0)) * 100
        ELSE 0 
      END as margin_rate_percent,
      CASE 
        WHEN ps.total_quantity_sold > 0 THEN
          COALESCE(ps.total_margin_real, 0) / ps.total_quantity_sold
        ELSE 0 
      END as unit_margin_ht,
      COALESCE(ps.total_margin_real, 0) as total_margin_ht,
      COALESCE(cs.current_stock_qty, 0) as current_stock,
      COALESCE(ps.total_quantity_sold, 0) as quantity_sold,
      COALESCE(ps.total_ca_ttc, 0) as ca_ttc,
      COALESCE(pp.total_quantity_bought, 0) as quantity_bought,
      COALESCE(pp.total_purchase_amount, 0) as purchase_amount
    FROM data_globalproduct gp
    LEFT JOIN product_sales ps ON gp.code_13_ref = ps.code_13_ref_id
    LEFT JOIN product_purchases pp ON gp.code_13_ref = pp.code_13_ref_id
    LEFT JOIN current_stock cs ON gp.code_13_ref = cs.code_13_ref_id
    LEFT JOIN avg_buy_price abp ON gp.code_13_ref = abp.code_13_ref_id
    WHERE (gp.tva_percentage IS NOT NULL OR gp.bcb_tva_rate IS NOT NULL)
      AND COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) > 0
      ${hasProductFilter ? 'AND gp.code_13_ref = ANY($3::text[])' : ''}
    ORDER BY ps.total_quantity_sold DESC NULLS LAST
    LIMIT 1000;
  `;

  return await db.query(query, params);
}

async function executeUserQuery(
  dateRange: { start: string; end: string },
  productCodes: string[],
  pharmacyId: string,
  hasProductFilter: boolean = true
): Promise<ProductMetrics[]> {
  
  const productFilter = hasProductFilter 
    ? 'AND ip.code_13_ref_id = ANY($3::text[])'
    : '';

  const params = hasProductFilter
    ? [dateRange.start, dateRange.end, productCodes, pharmacyId]
    : [dateRange.start, dateRange.end, pharmacyId];

  const pharmacyParam = hasProductFilter ? '$4::uuid' : '$3::uuid';

  const query = `
    WITH product_sales AS (
      SELECT 
        ip.code_13_ref_id,
        SUM(s.quantity) as total_quantity_sold,
        SUM(s.quantity * s.unit_price_ttc) as total_ca_ttc,
        AVG(s.unit_price_ttc) as avg_sell_price_ttc,
        SUM(s.quantity * (
          (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
        )) as total_margin_real,
        SUM(s.quantity * (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0))) as total_ca_ht
      FROM data_sales s
      INNER JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      INNER JOIN data_internalproduct ip ON ins.product_id = ip.id
      LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
      WHERE s.date >= $1 AND s.date <= $2
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        ${productFilter}
        AND ip.pharmacy_id = ${pharmacyParam}
      GROUP BY ip.code_13_ref_id
    ),
    product_purchases AS (
      SELECT 
        ip.code_13_ref_id,
        SUM(po.qte_r) as total_quantity_bought,
        SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)) as total_purchase_amount,
        AVG(COALESCE(closest_snap.weighted_average_price, 0)) as avg_buy_price_ht
      FROM data_productorder po
      INNER JOIN data_order o ON po.order_id = o.id
      INNER JOIN data_internalproduct ip ON po.product_id = ip.id
      LEFT JOIN LATERAL (
        SELECT weighted_average_price
        FROM data_inventorysnapshot ins2
        WHERE ins2.product_id = po.product_id
          AND ins2.weighted_average_price > 0
        ORDER BY ins2.date DESC
        LIMIT 1
      ) closest_snap ON true
      WHERE o.delivery_date >= $1::date 
        AND o.delivery_date <= $2::date
        AND o.delivery_date IS NOT NULL
        AND po.qte_r > 0
        ${productFilter}
        AND ip.pharmacy_id = ${pharmacyParam}
      GROUP BY ip.code_13_ref_id
    ),
    current_stock AS (
      SELECT 
        code_13_ref_id,
        SUM(stock) as current_stock_qty
      FROM (
        SELECT DISTINCT ON (internal_prod.id)
          internal_prod.id,
          internal_prod.code_13_ref_id,
          ins.stock
        FROM data_inventorysnapshot ins
        INNER JOIN data_internalproduct internal_prod ON ins.product_id = internal_prod.id
        WHERE internal_prod.pharmacy_id = ${pharmacyParam}
          ${productFilter.replace('ip.', 'internal_prod.')}
        ORDER BY internal_prod.id, ins.date DESC
      ) latest_stocks
      GROUP BY code_13_ref_id
    ),
    avg_buy_price AS (
      SELECT 
        ip.code_13_ref_id,
        AVG(ins.weighted_average_price) as avg_buy_price_ht
      FROM data_inventorysnapshot ins
      INNER JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE ins.weighted_average_price > 0
        AND ip.pharmacy_id = ${pharmacyParam}
        ${productFilter}
      GROUP BY ip.code_13_ref_id
    )
    SELECT 
      gp.name as product_name,
      gp.code_13_ref as code_ean,
      COALESCE(ps.avg_sell_price_ttc, 0) as avg_sell_price_ttc,
      COALESCE(abp.avg_buy_price_ht, 0) as avg_buy_price_ht,
      COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) as tva_rate,
      COALESCE(ps.avg_sell_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0)/100), 0) as avg_sell_price_ht,
      CASE 
        WHEN COALESCE(ps.total_ca_ht, 0) > 0 THEN
          (COALESCE(ps.total_margin_real, 0) / COALESCE(ps.total_ca_ht, 0)) * 100
        ELSE 0 
      END as margin_rate_percent,
      CASE 
        WHEN ps.total_quantity_sold > 0 THEN
          COALESCE(ps.total_margin_real, 0) / ps.total_quantity_sold
        ELSE 0 
      END as unit_margin_ht,
      COALESCE(ps.total_margin_real, 0) as total_margin_ht,
      COALESCE(cs.current_stock_qty, 0) as current_stock,
      COALESCE(ps.total_quantity_sold, 0) as quantity_sold,
      COALESCE(ps.total_ca_ttc, 0) as ca_ttc,
      COALESCE(pp.total_quantity_bought, 0) as quantity_bought,
      COALESCE(pp.total_purchase_amount, 0) as purchase_amount
    FROM data_globalproduct gp
    INNER JOIN data_internalproduct ip ON gp.code_13_ref = ip.code_13_ref_id
    LEFT JOIN product_sales ps ON gp.code_13_ref = ps.code_13_ref_id
    LEFT JOIN product_purchases pp ON gp.code_13_ref = pp.code_13_ref_id
    LEFT JOIN current_stock cs ON gp.code_13_ref = cs.code_13_ref_id
    LEFT JOIN avg_buy_price abp ON gp.code_13_ref = abp.code_13_ref_id
    WHERE ip.pharmacy_id = ${pharmacyParam}
      AND (gp.tva_percentage IS NOT NULL OR gp.bcb_tva_rate IS NOT NULL)
      AND COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) > 0
      ${hasProductFilter ? 'AND gp.code_13_ref = ANY($3::text[])' : ''}
    ORDER BY ps.total_quantity_sold DESC NULLS LAST
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
  return `products:list:${hash}`;
}