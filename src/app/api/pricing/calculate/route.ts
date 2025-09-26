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
    
    // Fusion des codes comme dans products/list
    const allProductCodes = Array.from(new Set([
      ...(body.productCodes || []),
      ...(body.laboratoryCodes || []),
      ...(body.categoryCodes || [])
    ]));
    
    console.log('🔍 [API Pricing] Request:', {
      totalCodes: allProductCodes.length,
      productCodes: body.productCodes?.length || 0,
      laboratoryCodes: body.laboratoryCodes?.length || 0,
      categoryCodes: body.categoryCodes?.length || 0,
      pharmacyIds: body.pharmacyIds,
      userRole: context.userRole
    });
    
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

    let params: any[] = [body.dateRange.start, body.dateRange.end, allProductCodes];
    let pharmacyFilter = '';

    if (context.isAdmin && secureFilters.pharmacy?.length) {
      params.push(secureFilters.pharmacy);
      pharmacyFilter = 'AND ip.pharmacy_id = ANY($4::uuid[])';
    } else if (!context.isAdmin) {
      params.push(context.pharmacyId);
      pharmacyFilter = 'AND ip.pharmacy_id = $4::uuid';
    }

    // Même requête qu'avant mais avec allProductCodes
    const query = context.isAdmin
      ? `WITH product_data AS (
          SELECT 
            gp.name as product_name,
            gp.code_13_ref as code_ean,
            COUNT(DISTINCT ip.pharmacy_id) as pharmacy_count,
            AVG(CASE WHEN ins.weighted_average_price > 0 THEN ins.weighted_average_price END) as avg_buy_price_ht,
            COALESCE(SUM(po.qte), 0) as quantity_bought,
            COALESCE(SUM(s.quantity), 0) as quantity_sold,
            AVG(ins.price_with_tax) as avg_sell_price_ttc,
            AVG(ip."TVA") as tva_rate
          FROM data_globalproduct gp
          INNER JOIN data_internalproduct ip ON gp.code_13_ref = ip.code_13_ref_id
          LEFT JOIN data_inventorysnapshot ins ON ip.id = ins.product_id
          LEFT JOIN data_sales s ON ins.id = s.product_id
            AND s.date >= $1 AND s.date <= $2
          LEFT JOIN data_productorder po ON ip.id = po.product_id
          LEFT JOIN data_order o ON po.order_id = o.id
            AND o.created_at >= $1 AND o.created_at <= $2
          WHERE gp.code_13_ref = ANY($3::text[])
            ${pharmacyFilter}
          GROUP BY gp.name, gp.code_13_ref
        )`
      : `WITH product_data AS (
          SELECT 
            ip.name as product_name,
            ip.code_13_ref_id as code_ean,
            1 as pharmacy_count,
            AVG(CASE WHEN ins.weighted_average_price > 0 THEN ins.weighted_average_price END) as avg_buy_price_ht,
            COALESCE(SUM(po.qte), 0) as quantity_bought,
            COALESCE(SUM(s.quantity), 0) as quantity_sold,
            AVG(ins.price_with_tax) as avg_sell_price_ttc,
            AVG(ip."TVA") as tva_rate
          FROM data_internalproduct ip
          LEFT JOIN data_inventorysnapshot ins ON ip.id = ins.product_id
          LEFT JOIN data_sales s ON ins.id = s.product_id
            AND s.date >= $1 AND s.date <= $2
          LEFT JOIN data_productorder po ON ip.id = po.product_id
          LEFT JOIN data_order o ON po.order_id = o.id
            AND o.created_at >= $1 AND o.created_at <= $2
          WHERE ip.code_13_ref_id = ANY($3::text[])
            AND ip.pharmacy_id = $4::uuid
          GROUP BY ip.name, ip.code_13_ref_id
        )`;

    const fullQuery = query + `
      SELECT 
        product_name,
        code_ean,
        pharmacy_count::int,
        COALESCE(avg_buy_price_ht, 0)::float as avg_buy_price_ht,
        quantity_bought::int,
        quantity_sold::int,
        COALESCE(avg_sell_price_ttc, 0)::float as avg_sell_price_ttc,
        COALESCE(tva_rate, 5.5)::float as tva_rate,
        CASE WHEN avg_sell_price_ttc > 0 
          THEN avg_sell_price_ttc / (1 + COALESCE(tva_rate, 5.5)/100) 
          ELSE 0 
        END::float as avg_sell_price_ht,
        CASE 
          WHEN avg_sell_price_ttc > 0 AND avg_buy_price_ht > 0 THEN
            ((avg_sell_price_ttc / (1 + COALESCE(tva_rate, 5.5)/100) - avg_buy_price_ht) / 
             (avg_sell_price_ttc / (1 + COALESCE(tva_rate, 5.5)/100))) * 100
          ELSE 0
        END::float as current_margin_percent,
        CASE 
          WHEN avg_sell_price_ttc > 0 AND avg_buy_price_ht > 0 THEN
            avg_sell_price_ttc / (1 + COALESCE(tva_rate, 5.5)/100) - avg_buy_price_ht
          ELSE 0
        END::float as current_margin_ht,
        CASE 
          WHEN avg_buy_price_ht > 0 THEN avg_sell_price_ttc / avg_buy_price_ht
          ELSE 0
        END::float as current_coefficient,
        (COALESCE(avg_sell_price_ttc, 0) * quantity_sold)::float as total_ca_ttc,
        ((COALESCE(avg_sell_price_ttc, 0) / (1 + COALESCE(tva_rate, 5.5)/100)) * quantity_sold)::float as total_ca_ht
      FROM product_data
      ORDER BY quantity_sold DESC, product_name`;
    
    const result = await db.query(fullQuery, params);
    
    const products = result.map((row: any) => ({
      product_name: row.product_name,
      code_ean: row.code_ean,
      current_conditions: {
        avg_buy_price_ht: row.avg_buy_price_ht,
        pharmacy_count: row.pharmacy_count,
        quantity_bought: row.quantity_bought,
        quantity_sold: row.quantity_sold,
        avg_sell_price_ttc: row.avg_sell_price_ttc,
        avg_sell_price_ht: row.avg_sell_price_ht,
        tva_rate: row.tva_rate,
        current_margin_percent: row.current_margin_percent,
        current_margin_ht: row.current_margin_ht,
        current_coefficient: row.current_coefficient,
        total_ca_ttc: row.total_ca_ttc,
        total_ca_ht: row.total_ca_ht
      }
    }));

    return NextResponse.json({
      products,
      count: products.length,
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