// src/app/api/pricing/calculate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSecurityContext, enforcePharmacySecurity } from '@/lib/api-security';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface PricingCalculateRequest {
  readonly dateRange: {
    readonly start: string;
    readonly end: string;
  };
  readonly productCodes: string[];
  readonly laboratoryCodes?: string[];
  readonly categoryCodes?: string[];
  readonly pharmacyIds?: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const context = await getSecurityContext();
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PricingCalculateRequest = await request.json();
    
    const allProductCodes = Array.from(new Set([
      ...(body.productCodes || []),
      ...(body.laboratoryCodes || []),
      ...(body.categoryCodes || [])
    ]));
    
    if (!allProductCodes || allProductCodes.length === 0) {
      return NextResponse.json({
        products: [],
        count: 0,
        queryTime: Date.now() - startTime
      });
    }

    const secureFilters = enforcePharmacySecurity({
      dateRange: body.dateRange,
      pharmacy: body.pharmacyIds || []
    }, context);

    // Utiliser exactement la même logique que products/list
    const products = context.isAdmin 
      ? await executeAdminQuery(body.dateRange, allProductCodes, secureFilters.pharmacy)
      : await executeUserQuery(body.dateRange, allProductCodes, context.pharmacyId!);

    const result = products.map((row: any) => ({
      product_name: row.product_name,
      code_ean: row.code_ean,
      current_conditions: {
        avg_buy_price_ht: row.avg_buy_price_ht,
        pharmacy_count: row.pharmacy_count || 1,
        quantity_bought: row.quantity_bought,
        quantity_sold: row.quantity_sold,
        avg_sell_price_ttc: row.avg_sell_price_ttc,
        avg_sell_price_ht: row.avg_sell_price_ht,
        tva_rate: row.tva_rate,
        current_margin_percent: row.margin_rate_percent,
        current_margin_ht: row.unit_margin_ht,
        current_coefficient: row.avg_buy_price_ht > 0 ? row.avg_sell_price_ttc / row.avg_buy_price_ht : 0,
        total_ca_ttc: row.ca_ttc,
        total_ca_ht: row.ca_ttc / (1 + row.tva_rate / 100),
        total_purchase_amount: row.purchase_amount
      }
    }));

    return NextResponse.json({
      products: result,
      count: result.length,
      queryTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('💥 [API] Pricing calculation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function executeAdminQuery(
  dateRange: { start: string; end: string },
  productCodes: string[],
  pharmacyIds?: string[]
) {
  const params: any[] = [dateRange.start, dateRange.end, productCodes];
  let pharmacyFilter = '';
  
  if (pharmacyIds && pharmacyIds.length > 0) {
    params.push(pharmacyIds);
    pharmacyFilter = 'AND ip.pharmacy_id = ANY($4::uuid[])';
  }

  const query = `
    WITH product_sales AS (
      SELECT 
        ip.code_13_ref_id,
        SUM(s.quantity) as total_quantity_sold,
        SUM(s.quantity * ins.price_with_tax) as total_ca_ttc,
        AVG(ins.price_with_tax) as avg_sell_price_ttc,
        AVG(ip."TVA") as avg_tva_rate
      FROM data_sales s
      INNER JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      INNER JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1 AND s.date <= $2
        AND ip.code_13_ref_id = ANY($3::text[])
        ${pharmacyFilter}
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
        AND ip.code_13_ref_id = ANY($3::text[])
        ${pharmacyFilter}
      GROUP BY ip.code_13_ref_id
    ),
    avg_buy_price AS (
      SELECT 
        ip.code_13_ref_id,
        AVG(ins.weighted_average_price) as avg_buy_price_ht
      FROM data_inventorysnapshot ins
      INNER JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE ins.weighted_average_price > 0
        AND ip.code_13_ref_id = ANY($3::text[])
        ${pharmacyFilter}
      GROUP BY ip.code_13_ref_id
    )
    SELECT 
      gp.name as product_name,
      gp.code_13_ref as code_ean,
      COALESCE(ps.avg_sell_price_ttc, 0) as avg_sell_price_ttc,
      COALESCE(abp.avg_buy_price_ht, 0) as avg_buy_price_ht,
      COALESCE(ps.avg_tva_rate, 0) as tva_rate,
      COALESCE(ps.avg_sell_price_ttc / (1 + ps.avg_tva_rate/100), 0) as avg_sell_price_ht,
      CASE 
        WHEN ps.avg_sell_price_ttc > 0 AND ps.avg_tva_rate IS NOT NULL THEN
          ((ps.avg_sell_price_ttc / (1 + ps.avg_tva_rate / 100)) - COALESCE(abp.avg_buy_price_ht, 0)) /
          (ps.avg_sell_price_ttc / (1 + ps.avg_tva_rate / 100)) * 100
        ELSE 0 
      END as margin_rate_percent,
      CASE 
        WHEN ps.avg_sell_price_ttc > 0 AND ps.avg_tva_rate IS NOT NULL THEN
          (ps.avg_sell_price_ttc / (1 + ps.avg_tva_rate / 100)) - COALESCE(abp.avg_buy_price_ht, 0)
        ELSE 0 
      END as unit_margin_ht,
      COALESCE(ps.total_quantity_sold, 0) as quantity_sold,
      COALESCE(ps.total_ca_ttc, 0) as ca_ttc,
      COALESCE(pp.total_quantity_bought, 0) as quantity_bought,
      COALESCE(pp.total_purchase_amount, 0) as purchase_amount
    FROM data_globalproduct gp
    LEFT JOIN product_sales ps ON gp.code_13_ref = ps.code_13_ref_id
    LEFT JOIN product_purchases pp ON gp.code_13_ref = pp.code_13_ref_id
    LEFT JOIN avg_buy_price abp ON gp.code_13_ref = abp.code_13_ref_id
    WHERE gp.code_13_ref = ANY($3::text[])
    ORDER BY ps.total_quantity_sold DESC NULLS LAST`;

  return await db.query(query, params);
}

async function executeUserQuery(
  dateRange: { start: string; end: string },
  productCodes: string[],
  pharmacyId: string
) {
  const query = `
    WITH product_sales AS (
      SELECT 
        ip.code_13_ref_id,
        SUM(s.quantity) as total_quantity_sold,
        SUM(s.quantity * ins.price_with_tax) as total_ca_ttc,
        AVG(ins.price_with_tax) as avg_sell_price_ttc,
        AVG(ip."TVA") as avg_tva_rate
      FROM data_sales s
      INNER JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      INNER JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE s.date >= $1 AND s.date <= $2
        AND ip.code_13_ref_id = ANY($3::text[])
        AND ip.pharmacy_id = $4::uuid
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
        AND ip.code_13_ref_id = ANY($3::text[])
        AND ip.pharmacy_id = $4::uuid
      GROUP BY ip.code_13_ref_id
    ),
    avg_buy_price AS (
      SELECT 
        ip.code_13_ref_id,
        AVG(ins.weighted_average_price) as avg_buy_price_ht
      FROM data_inventorysnapshot ins
      INNER JOIN data_internalproduct ip ON ins.product_id = ip.id
      WHERE ins.weighted_average_price > 0
        AND ip.pharmacy_id = $4::uuid
        AND ip.code_13_ref_id = ANY($3::text[])
      GROUP BY ip.code_13_ref_id
    )
    SELECT 
      ip.name as product_name,
      ip.code_13_ref_id as code_ean,
      COALESCE(ps.avg_sell_price_ttc, 0) as avg_sell_price_ttc,
      COALESCE(abp.avg_buy_price_ht, 0) as avg_buy_price_ht,
      COALESCE(ps.avg_tva_rate, 0) as tva_rate,
      COALESCE(ps.avg_sell_price_ttc / (1 + ps.avg_tva_rate/100), 0) as avg_sell_price_ht,
      CASE 
        WHEN ps.avg_sell_price_ttc > 0 AND ps.avg_tva_rate IS NOT NULL THEN
          ((ps.avg_sell_price_ttc / (1 + ps.avg_tva_rate / 100)) - COALESCE(abp.avg_buy_price_ht, 0)) /
          (ps.avg_sell_price_ttc / (1 + ps.avg_tva_rate / 100)) * 100
        ELSE 0 
      END as margin_rate_percent,
      CASE 
        WHEN ps.avg_sell_price_ttc > 0 AND ps.avg_tva_rate IS NOT NULL THEN
          (ps.avg_sell_price_ttc / (1 + ps.avg_tva_rate / 100)) - COALESCE(abp.avg_buy_price_ht, 0)
        ELSE 0 
      END as unit_margin_ht,
      COALESCE(ps.total_quantity_sold, 0) as quantity_sold,
      COALESCE(ps.total_ca_ttc, 0) as ca_ttc,
      COALESCE(pp.total_quantity_bought, 0) as quantity_bought,
      COALESCE(pp.total_purchase_amount, 0) as purchase_amount
    FROM data_internalproduct ip
    LEFT JOIN product_sales ps ON ip.code_13_ref_id = ps.code_13_ref_id
    LEFT JOIN product_purchases pp ON ip.code_13_ref_id = pp.code_13_ref_id
    LEFT JOIN avg_buy_price abp ON ip.code_13_ref_id = abp.code_13_ref_id
    WHERE ip.pharmacy_id = $4::uuid
      AND ip.code_13_ref_id = ANY($3::text[])
    ORDER BY ps.total_quantity_sold DESC NULLS LAST`;

  return await db.query(query, [
    dateRange.start,
    dateRange.end,
    productCodes,
    pharmacyId
  ]);
}