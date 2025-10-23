// src/app/api/generic-groups/products-list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface GenericProductMetrics {
  readonly laboratory_name: string;
  readonly product_name: string;
  readonly code_ean: string;
  readonly avg_buy_price_ht: number;
  readonly quantity_bought: number;
  readonly ca_achats: number;
  readonly quantity_sold: number;
  readonly ca_ventes: number;
  readonly margin_rate_percent: number;
  readonly total: number;
}

interface RequestBody {
  readonly dateRange: { start: string; end: string };
  readonly productCodes?: string[];
  readonly page?: number;
  readonly pageSize?: number;
  readonly searchQuery?: string;
  readonly sortColumn?: string;
  readonly sortDirection?: 'asc' | 'desc';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { dateRange, productCodes = [], page = 1, pageSize = 50, searchQuery = '', sortColumn = 'ca_ventes', sortDirection = 'desc' } = body;

    if (!dateRange?.start || !dateRange?.end) {
      return NextResponse.json({ error: 'Date range required' }, { status: 400 });
    }

    const offset = (page - 1) * pageSize;
    const isAdmin = session.user.role === 'admin';

    // Construction filtres search
    const searchFilter = searchQuery 
      ? `AND (
          LOWER(dgp.name) LIKE LOWER($${isAdmin ? 5 : 6}) 
          OR dgp.code_13_ref LIKE $${isAdmin ? 5 : 6}
          OR LOWER(dgp.bcb_lab) LIKE LOWER($${isAdmin ? 5 : 6})
        )`
      : '';

    // Mapping colonnes tri
    const sortColumnMap: Record<string, string> = {
      'laboratory_name': 'laboratory_name',
      'product_name': 'product_name',
      'code_ean': 'code_ean',
      'avg_buy_price_ht': 'avg_buy_price_ht',
      'quantity_bought': 'quantity_bought',
      'ca_achats': 'ca_achats',
      'quantity_sold': 'quantity_sold',
      'ca_ventes': 'ca_ventes',
      'margin_rate_percent': 'margin_rate_percent'
    };

    const validSortColumn = sortColumnMap[sortColumn] || 'ca_ventes';
    const validSortDirection = sortDirection === 'asc' ? 'ASC' : 'DESC';

    let query: string;
    let params: any[];

    if (isAdmin) {
      // Mode ADMIN : multi-pharmacies
      query = `
        WITH product_sales AS (
          SELECT 
            dgp.bcb_lab,
            dgp.name,
            dgp.code_13_ref,
            SUM(s.quantity) as quantity_sold,
            SUM(s.quantity * s.unit_price_ttc) as ca_ventes_ttc,
            SUM(s.quantity * (
              (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
            )) as total_margin_ht,
            SUM(s.quantity * (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0))) as ca_ventes_ht
          FROM data_sales s
          JOIN data_inventorysnapshot ins ON s.product_id = ins.id
          JOIN data_internalproduct ip ON ins.product_id = ip.id
          JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
          WHERE s.date >= $1::date 
            AND s.date <= $2::date
            AND s.unit_price_ttc IS NOT NULL
            AND s.unit_price_ttc > 0
            AND ins.weighted_average_price > 0
            AND dgp.bcb_lab IS NOT NULL
            AND ip.code_13_ref_id = ANY($3::text[])
          GROUP BY dgp.bcb_lab, dgp.name, dgp.code_13_ref
        ),
        product_purchases AS (
          SELECT 
            dgp.bcb_lab,
            dgp.code_13_ref,
            SUM(po.qte_r) as quantity_bought,
            SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)) as ca_achats,
            AVG(COALESCE(closest_snap.weighted_average_price, 0)) as avg_buy_price_ht
          FROM data_productorder po
          JOIN data_order o ON po.order_id = o.id
          JOIN data_internalproduct ip ON po.product_id = ip.id
          JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
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
            AND dgp.bcb_lab IS NOT NULL
            AND ip.code_13_ref_id = ANY($3::text[])
          GROUP BY dgp.bcb_lab, dgp.code_13_ref
        ),
        product_metrics AS (
          SELECT 
            COALESCE(ps.bcb_lab, pp.bcb_lab) as laboratory_name,
            ps.name as product_name,
            COALESCE(ps.code_13_ref, pp.code_13_ref) as code_ean,
            COALESCE(pp.avg_buy_price_ht, 0) as avg_buy_price_ht,
            COALESCE(pp.quantity_bought, 0) as quantity_bought,
            COALESCE(pp.ca_achats, 0) as ca_achats,
            COALESCE(ps.quantity_sold, 0) as quantity_sold,
            COALESCE(ps.ca_ventes_ttc, 0) as ca_ventes,
            CASE 
              WHEN COALESCE(ps.ca_ventes_ht, 0) > 0 
              THEN (COALESCE(ps.total_margin_ht, 0) / ps.ca_ventes_ht) * 100
              ELSE 0
            END as margin_rate_percent
          FROM product_sales ps
          FULL OUTER JOIN product_purchases pp ON ps.code_13_ref = pp.code_13_ref
          WHERE COALESCE(ps.bcb_lab, pp.bcb_lab) IS NOT NULL
            ${searchFilter}
        ),
        total_count AS (
          SELECT COUNT(*) as total FROM product_metrics
        )
        SELECT 
          pm.laboratory_name,
          pm.product_name,
          pm.code_ean,
          pm.avg_buy_price_ht,
          pm.quantity_bought,
          pm.ca_achats,
          pm.quantity_sold,
          pm.ca_ventes,
          pm.margin_rate_percent,
          tc.total
        FROM product_metrics pm
        CROSS JOIN total_count tc
        ORDER BY pm.${validSortColumn} ${validSortDirection}
        LIMIT $4 OFFSET $5
      `;

      params = searchQuery
        ? [dateRange.start, dateRange.end, productCodes, pageSize, offset, `%${searchQuery}%`]
        : [dateRange.start, dateRange.end, productCodes, pageSize, offset];

    } else {
      // Mode USER : single pharmacy
      query = `
        WITH product_sales AS (
          SELECT 
            dgp.bcb_lab,
            dgp.name,
            dgp.code_13_ref,
            SUM(s.quantity) as quantity_sold,
            SUM(s.quantity * s.unit_price_ttc) as ca_ventes_ttc,
            SUM(s.quantity * (
              (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
            )) as total_margin_ht,
            SUM(s.quantity * (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0))) as ca_ventes_ht
          FROM data_sales s
          JOIN data_inventorysnapshot ins ON s.product_id = ins.id
          JOIN data_internalproduct ip ON ins.product_id = ip.id
          JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
          WHERE s.date >= $1::date 
            AND s.date <= $2::date
            AND s.unit_price_ttc IS NOT NULL
            AND s.unit_price_ttc > 0
            AND ins.weighted_average_price > 0
            AND dgp.bcb_lab IS NOT NULL
            AND ip.pharmacy_id = $3::uuid
            AND ip.code_13_ref_id = ANY($4::text[])
          GROUP BY dgp.bcb_lab, dgp.name, dgp.code_13_ref
        ),
        product_purchases AS (
          SELECT 
            dgp.bcb_lab,
            dgp.code_13_ref,
            SUM(po.qte_r) as quantity_bought,
            SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)) as ca_achats,
            AVG(COALESCE(closest_snap.weighted_average_price, 0)) as avg_buy_price_ht
          FROM data_productorder po
          JOIN data_order o ON po.order_id = o.id
          JOIN data_internalproduct ip ON po.product_id = ip.id
          JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
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
            AND dgp.bcb_lab IS NOT NULL
            AND ip.pharmacy_id = $3::uuid
            AND ip.code_13_ref_id = ANY($4::text[])
          GROUP BY dgp.bcb_lab, dgp.code_13_ref
        ),
        product_metrics AS (
          SELECT 
            COALESCE(ps.bcb_lab, pp.bcb_lab) as laboratory_name,
            ps.name as product_name,
            COALESCE(ps.code_13_ref, pp.code_13_ref) as code_ean,
            COALESCE(pp.avg_buy_price_ht, 0) as avg_buy_price_ht,
            COALESCE(pp.quantity_bought, 0) as quantity_bought,
            COALESCE(pp.ca_achats, 0) as ca_achats,
            COALESCE(ps.quantity_sold, 0) as quantity_sold,
            COALESCE(ps.ca_ventes_ttc, 0) as ca_ventes,
            CASE 
              WHEN COALESCE(ps.ca_ventes_ht, 0) > 0 
              THEN (COALESCE(ps.total_margin_ht, 0) / ps.ca_ventes_ht) * 100
              ELSE 0
            END as margin_rate_percent
          FROM product_sales ps
          FULL OUTER JOIN product_purchases pp ON ps.code_13_ref = pp.code_13_ref
          WHERE COALESCE(ps.bcb_lab, pp.bcb_lab) IS NOT NULL
            ${searchFilter}
        ),
        total_count AS (
          SELECT COUNT(*) as total FROM product_metrics
        )
        SELECT 
          pm.laboratory_name,
          pm.product_name,
          pm.code_ean,
          pm.avg_buy_price_ht,
          pm.quantity_bought,
          pm.ca_achats,
          pm.quantity_sold,
          pm.ca_ventes,
          pm.margin_rate_percent,
          tc.total
        FROM product_metrics pm
        CROSS JOIN total_count tc
        ORDER BY pm.${validSortColumn} ${validSortDirection}
        LIMIT $5 OFFSET $6
      `;

      params = searchQuery
        ? [dateRange.start, dateRange.end, session.user.pharmacyId, productCodes, pageSize, offset, `%${searchQuery}%`]
        : [dateRange.start, dateRange.end, session.user.pharmacyId, productCodes, pageSize, offset];
    }

    const result = await db.query<GenericProductMetrics>(query, params);

    const totalFromFirstRow = result[0]?.total || 0;
    const products = result.map(row => ({
      laboratory_name: row.laboratory_name,
      product_name: row.product_name,
      code_ean: row.code_ean,
      avg_buy_price_ht: Number(row.avg_buy_price_ht),
      quantity_bought: Number(row.quantity_bought),
      ca_achats: Number(row.ca_achats),
      quantity_sold: Number(row.quantity_sold),
      ca_ventes: Number(row.ca_ventes),
      margin_rate_percent: Number(row.margin_rate_percent)
    }));

    return NextResponse.json({
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFromFirstRow / pageSize),
        total: totalFromFirstRow
      }
    });

  } catch (error) {
    console.error('Generic products list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}