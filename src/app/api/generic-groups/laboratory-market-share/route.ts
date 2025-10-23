// src/app/api/generic-groups/laboratory-market-share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LaboratoryMarketShareResult {
  readonly laboratory_name: string;
  readonly product_count: number;
  readonly quantity_bought: number;
  readonly ca_achats: number;
  readonly part_marche_achats_pct: number;
  readonly margin_rate_percent: number;
  readonly quantity_sold: number;
  readonly ca_selection: number;
  readonly part_marche_ca_pct: number;
  readonly is_referent: boolean;
  readonly total: number;
}

interface RequestBody {
  readonly dateRange: { start: string; end: string };
  readonly productCodes?: string[];
  readonly page?: number;
  readonly pageSize?: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { dateRange, productCodes = [], page = 1, pageSize = 10 } = body;
    
    const isAdmin = session.user.role === 'admin';
    const offset = (page - 1) * pageSize;
    const isGlobalMode = productCodes.length === 0;
    
    let query: string;
    let params: any[];

    if (isAdmin) {
      if (isGlobalMode) {
        query = `
          WITH generic_products AS (
            SELECT DISTINCT dgp.code_13_ref
            FROM data_globalproduct dgp
            WHERE dgp.bcb_generic_group IS NOT NULL
              AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
          ),
          lab_achats AS (
            SELECT 
              dgp.bcb_lab as laboratory_name,
              SUM(po.qte_r) as quantity_bought,
              SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)) as ca_achats
            FROM data_productorder po
            INNER JOIN data_order o ON po.order_id = o.id
            INNER JOIN data_internalproduct ip ON po.product_id = ip.id
            INNER JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
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
              AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
              AND ip.code_13_ref_id IN (SELECT code_13_ref FROM generic_products)
            GROUP BY dgp.bcb_lab
          ),
          lab_ventes AS (
            SELECT 
              dgp.bcb_lab as laboratory_name,
              COUNT(DISTINCT ip.code_13_ref_id) as product_count,
              SUM(s.quantity) as quantity_sold,
              SUM(s.quantity * s.unit_price_ttc) as ca_selection,
              SUM(s.quantity * (
                (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
              )) as marge_selection,
              SUM(s.quantity * (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0))) as ca_ht_selection,
              MAX(CASE WHEN dgp.bcb_generic_status = 'RÉFÉRENT' THEN 1 ELSE 0 END) as is_referent
            FROM data_sales s
            JOIN data_inventorysnapshot ins ON s.product_id = ins.id
            JOIN data_internalproduct ip ON ins.product_id = ip.id
            JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
            WHERE s.date >= $1::date 
              AND s.date <= $2::date
              AND s.unit_price_ttc IS NOT NULL
              AND s.unit_price_ttc > 0
              AND ins.weighted_average_price > 0
              AND (dgp.tva_percentage IS NOT NULL OR dgp.bcb_tva_rate IS NOT NULL)
              AND COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) > 0
              AND dgp.bcb_lab IS NOT NULL
              AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
              AND ip.code_13_ref_id IN (SELECT code_13_ref FROM generic_products)
            GROUP BY dgp.bcb_lab
          ),
          group_totals AS (
            SELECT 
              SUM(la.ca_achats) as ca_achats_total,
              SUM(lv.ca_selection) as ca_ventes_total
            FROM lab_achats la
            FULL OUTER JOIN lab_ventes lv ON la.laboratory_name = lv.laboratory_name
          ),
          lab_metrics AS (
            SELECT 
              COALESCE(lv.laboratory_name, la.laboratory_name) as laboratory_name,
              COALESCE(lv.product_count, 0) as product_count,
              COALESCE(la.quantity_bought, 0) as quantity_bought,
              COALESCE(la.ca_achats, 0) as ca_achats,
              COALESCE(lv.quantity_sold, 0) as quantity_sold,
              COALESCE(lv.ca_selection, 0) as ca_selection,
              CASE 
                WHEN COALESCE(lv.ca_ht_selection, 0) > 0 
                THEN (COALESCE(lv.marge_selection, 0) / lv.ca_ht_selection) * 100
                ELSE 0
              END as margin_rate_percent,
              COALESCE(lv.is_referent, 0) as is_referent
            FROM lab_ventes lv
            FULL OUTER JOIN lab_achats la ON lv.laboratory_name = la.laboratory_name
            WHERE COALESCE(lv.laboratory_name, la.laboratory_name) IS NOT NULL
          ),
          total_count AS (
            SELECT COUNT(*) as total FROM lab_metrics
          )
          SELECT 
            lm.laboratory_name,
            lm.product_count,
            lm.quantity_bought,
            lm.ca_achats,
            CASE 
              WHEN gt.ca_achats_total > 0 
              THEN (lm.ca_achats / gt.ca_achats_total) * 100 
              ELSE 0 
            END as part_marche_achats_pct,
            lm.margin_rate_percent,
            lm.quantity_sold,
            lm.ca_selection,
            CASE 
              WHEN gt.ca_ventes_total > 0 
              THEN (lm.ca_selection / gt.ca_ventes_total) * 100 
              ELSE 0 
            END as part_marche_ca_pct,
            lm.is_referent::boolean as is_referent,
            tc.total
          FROM lab_metrics lm
          CROSS JOIN group_totals gt
          CROSS JOIN total_count tc
          ORDER BY lm.ca_selection DESC
          LIMIT $3 OFFSET $4
        `;
        params = [dateRange.start, dateRange.end, pageSize, offset];
      } else {
        query = `
          WITH lab_achats AS (
            SELECT 
              dgp.bcb_lab as laboratory_name,
              SUM(po.qte_r) as quantity_bought,
              SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)) as ca_achats
            FROM data_productorder po
            INNER JOIN data_order o ON po.order_id = o.id
            INNER JOIN data_internalproduct ip ON po.product_id = ip.id
            INNER JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
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
              AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
              AND ip.code_13_ref_id = ANY($3::text[])
            GROUP BY dgp.bcb_lab
          ),
          lab_ventes AS (
            SELECT 
              dgp.bcb_lab as laboratory_name,
              COUNT(DISTINCT ip.code_13_ref_id) as product_count,
              SUM(s.quantity) as quantity_sold,
              SUM(s.quantity * s.unit_price_ttc) as ca_selection,
              SUM(s.quantity * (
                (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
              )) as marge_selection,
              SUM(s.quantity * (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0))) as ca_ht_selection,
              MAX(CASE WHEN dgp.bcb_generic_status = 'RÉFÉRENT' THEN 1 ELSE 0 END) as is_referent
            FROM data_sales s
            JOIN data_inventorysnapshot ins ON s.product_id = ins.id
            JOIN data_internalproduct ip ON ins.product_id = ip.id
            JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
            WHERE s.date >= $1::date 
              AND s.date <= $2::date
              AND s.unit_price_ttc IS NOT NULL
              AND s.unit_price_ttc > 0
              AND ins.weighted_average_price > 0
              AND (dgp.tva_percentage IS NOT NULL OR dgp.bcb_tva_rate IS NOT NULL)
              AND COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) > 0
              AND dgp.bcb_lab IS NOT NULL
              AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
              AND ip.code_13_ref_id = ANY($3::text[])
            GROUP BY dgp.bcb_lab
          ),
          group_totals AS (
            SELECT 
              SUM(la.ca_achats) as ca_achats_total,
              SUM(lv.ca_selection) as ca_ventes_total
            FROM lab_achats la
            FULL OUTER JOIN lab_ventes lv ON la.laboratory_name = lv.laboratory_name
          ),
          lab_metrics AS (
            SELECT 
              COALESCE(lv.laboratory_name, la.laboratory_name) as laboratory_name,
              COALESCE(lv.product_count, 0) as product_count,
              COALESCE(la.quantity_bought, 0) as quantity_bought,
              COALESCE(la.ca_achats, 0) as ca_achats,
              COALESCE(lv.quantity_sold, 0) as quantity_sold,
              COALESCE(lv.ca_selection, 0) as ca_selection,
              CASE 
                WHEN COALESCE(lv.ca_ht_selection, 0) > 0 
                THEN (COALESCE(lv.marge_selection, 0) / lv.ca_ht_selection) * 100
                ELSE 0
              END as margin_rate_percent,
              COALESCE(lv.is_referent, 0) as is_referent
            FROM lab_ventes lv
            FULL OUTER JOIN lab_achats la ON lv.laboratory_name = la.laboratory_name
            WHERE COALESCE(lv.laboratory_name, la.laboratory_name) IS NOT NULL
          ),
          total_count AS (
            SELECT COUNT(*) as total FROM lab_metrics
          )
          SELECT 
            lm.laboratory_name,
            lm.product_count,
            lm.quantity_bought,
            lm.ca_achats,
            CASE 
              WHEN gt.ca_achats_total > 0 
              THEN (lm.ca_achats / gt.ca_achats_total) * 100 
              ELSE 0 
            END as part_marche_achats_pct,
            lm.margin_rate_percent,
            lm.quantity_sold,
            lm.ca_selection,
            CASE 
              WHEN gt.ca_ventes_total > 0 
              THEN (lm.ca_selection / gt.ca_ventes_total) * 100 
              ELSE 0 
            END as part_marche_ca_pct,
            lm.is_referent::boolean as is_referent,
            tc.total
          FROM lab_metrics lm
          CROSS JOIN group_totals gt
          CROSS JOIN total_count tc
          ORDER BY lm.ca_selection DESC
          LIMIT $4 OFFSET $5
        `;
        params = [dateRange.start, dateRange.end, productCodes, pageSize, offset];
      }
    } else {
      if (!session.user.pharmacyId) {
        return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });
      }

      if (isGlobalMode) {
        query = `
          WITH generic_products AS (
            SELECT DISTINCT ip.code_13_ref_id
            FROM data_internalproduct ip
            JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
            WHERE ip.pharmacy_id = $3::uuid
              AND dgp.bcb_generic_group IS NOT NULL
              AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
          ),
          lab_achats AS (
            SELECT 
              dgp.bcb_lab as laboratory_name,
              SUM(po.qte_r) as quantity_bought,
              SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)) as ca_achats
            FROM data_productorder po
            INNER JOIN data_order o ON po.order_id = o.id
            INNER JOIN data_internalproduct ip ON po.product_id = ip.id
            INNER JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
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
              AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
              AND ip.pharmacy_id = $3::uuid
              AND ip.code_13_ref_id IN (SELECT code_13_ref_id FROM generic_products)
            GROUP BY dgp.bcb_lab
          ),
          lab_ventes AS (
            SELECT 
              dgp.bcb_lab as laboratory_name,
              COUNT(DISTINCT ip.code_13_ref_id) as product_count,
              SUM(s.quantity) as quantity_sold,
              SUM(s.quantity * s.unit_price_ttc) as ca_selection,
              SUM(s.quantity * (
                (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
              )) as marge_selection,
              SUM(s.quantity * (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0))) as ca_ht_selection,
              0 as is_referent
            FROM data_sales s
            JOIN data_inventorysnapshot ins ON s.product_id = ins.id
            JOIN data_internalproduct ip ON ins.product_id = ip.id
            JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
            WHERE s.date >= $1::date 
              AND s.date <= $2::date
              AND s.unit_price_ttc IS NOT NULL
              AND s.unit_price_ttc > 0
              AND ins.weighted_average_price > 0
              AND (dgp.tva_percentage IS NOT NULL OR dgp.bcb_tva_rate IS NOT NULL)
              AND COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) > 0
              AND dgp.bcb_lab IS NOT NULL
              AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
              AND ip.pharmacy_id = $3::uuid
              AND ip.code_13_ref_id IN (SELECT code_13_ref_id FROM generic_products)
            GROUP BY dgp.bcb_lab
          ),
          group_totals AS (
            SELECT 
              SUM(la.ca_achats) as ca_achats_total,
              SUM(lv.ca_selection) as ca_ventes_total
            FROM lab_achats la
            FULL OUTER JOIN lab_ventes lv ON la.laboratory_name = lv.laboratory_name
          ),
          lab_metrics AS (
            SELECT 
              COALESCE(lv.laboratory_name, la.laboratory_name) as laboratory_name,
              COALESCE(lv.product_count, 0) as product_count,
              COALESCE(la.quantity_bought, 0) as quantity_bought,
              COALESCE(la.ca_achats, 0) as ca_achats,
              COALESCE(lv.quantity_sold, 0) as quantity_sold,
              COALESCE(lv.ca_selection, 0) as ca_selection,
              CASE 
                WHEN COALESCE(lv.ca_ht_selection, 0) > 0 
                THEN (COALESCE(lv.marge_selection, 0) / lv.ca_ht_selection) * 100
                ELSE 0
              END as margin_rate_percent,
              COALESCE(lv.is_referent, 0) as is_referent
            FROM lab_ventes lv
            FULL OUTER JOIN lab_achats la ON lv.laboratory_name = la.laboratory_name
            WHERE COALESCE(lv.laboratory_name, la.laboratory_name) IS NOT NULL
          ),
          total_count AS (
            SELECT COUNT(*) as total FROM lab_metrics
          )
          SELECT 
            lm.laboratory_name,
            lm.product_count,
            lm.quantity_bought,
            lm.ca_achats,
            CASE 
              WHEN gt.ca_achats_total > 0 
              THEN (lm.ca_achats / gt.ca_achats_total) * 100 
              ELSE 0 
            END as part_marche_achats_pct,
            lm.margin_rate_percent,
            lm.quantity_sold,
            lm.ca_selection,
            CASE 
              WHEN gt.ca_ventes_total > 0 
              THEN (lm.ca_selection / gt.ca_ventes_total) * 100 
              ELSE 0 
            END as part_marche_ca_pct,
            lm.is_referent::boolean as is_referent,
            tc.total
          FROM lab_metrics lm
          CROSS JOIN group_totals gt
          CROSS JOIN total_count tc
          ORDER BY lm.ca_selection DESC
          LIMIT $4 OFFSET $5
        `;
        params = [dateRange.start, dateRange.end, session.user.pharmacyId, pageSize, offset];
      } else {
        query = `
          WITH lab_achats AS (
            SELECT 
              dgp.bcb_lab as laboratory_name,
              SUM(po.qte_r) as quantity_bought,
              SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)) as ca_achats
            FROM data_productorder po
            INNER JOIN data_order o ON po.order_id = o.id
            INNER JOIN data_internalproduct ip ON po.product_id = ip.id
            INNER JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
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
              AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
              AND ip.code_13_ref_id = ANY($3::text[])
              AND ip.pharmacy_id = $4::uuid
            GROUP BY dgp.bcb_lab
          ),
          lab_ventes AS (
            SELECT 
              dgp.bcb_lab as laboratory_name,
              COUNT(DISTINCT ip.code_13_ref_id) as product_count,
              SUM(s.quantity) as quantity_sold,
              SUM(s.quantity * s.unit_price_ttc) as ca_selection,
              SUM(s.quantity * (
                (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
              )) as marge_selection,
              SUM(s.quantity * (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0))) as ca_ht_selection,
              MAX(CASE WHEN dgp.bcb_generic_status = 'RÉFÉRENT' THEN 1 ELSE 0 END) as is_referent
            FROM data_sales s
            JOIN data_inventorysnapshot ins ON s.product_id = ins.id
            JOIN data_internalproduct ip ON ins.product_id = ip.id
            JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
            WHERE s.date >= $1::date 
              AND s.date <= $2::date
              AND s.unit_price_ttc IS NOT NULL
              AND s.unit_price_ttc > 0
              AND ins.weighted_average_price > 0
              AND (dgp.tva_percentage IS NOT NULL OR dgp.bcb_tva_rate IS NOT NULL)
              AND COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) > 0
              AND dgp.bcb_lab IS NOT NULL
              AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
              AND ip.code_13_ref_id = ANY($3::text[])
              AND ip.pharmacy_id = $4::uuid
            GROUP BY dgp.bcb_lab
          ),
          group_totals AS (
            SELECT 
              SUM(la.ca_achats) as ca_achats_total,
              SUM(lv.ca_selection) as ca_ventes_total
            FROM lab_achats la
            FULL OUTER JOIN lab_ventes lv ON la.laboratory_name = lv.laboratory_name
          ),
          lab_metrics AS (
            SELECT 
              COALESCE(lv.laboratory_name, la.laboratory_name) as laboratory_name,
              COALESCE(lv.product_count, 0) as product_count,
              COALESCE(la.quantity_bought, 0) as quantity_bought,
              COALESCE(la.ca_achats, 0) as ca_achats,
              COALESCE(lv.quantity_sold, 0) as quantity_sold,
              COALESCE(lv.ca_selection, 0) as ca_selection,
              CASE 
                WHEN COALESCE(lv.ca_ht_selection, 0) > 0 
                THEN (COALESCE(lv.marge_selection, 0) / lv.ca_ht_selection) * 100
                ELSE 0
              END as margin_rate_percent,
              COALESCE(lv.is_referent, 0) as is_referent
            FROM lab_ventes lv
            FULL OUTER JOIN lab_achats la ON lv.laboratory_name = la.laboratory_name
            WHERE COALESCE(lv.laboratory_name, la.laboratory_name) IS NOT NULL
          ),
          total_count AS (
            SELECT COUNT(*) as total FROM lab_metrics
          )
          SELECT 
            lm.laboratory_name,
            lm.product_count,
            lm.quantity_bought,
            lm.ca_achats,
            CASE 
              WHEN gt.ca_achats_total > 0 
              THEN (lm.ca_achats / gt.ca_achats_total) * 100 
              ELSE 0 
            END as part_marche_achats_pct,
            lm.margin_rate_percent,
            lm.quantity_sold,
            lm.ca_selection,
            CASE 
              WHEN gt.ca_ventes_total > 0 
              THEN (lm.ca_selection / gt.ca_ventes_total) * 100 
              ELSE 0 
            END as part_marche_ca_pct,
            lm.is_referent::boolean as is_referent,
            tc.total
          FROM lab_metrics lm
          CROSS JOIN group_totals gt
          CROSS JOIN total_count tc
          ORDER BY lm.ca_selection DESC
          LIMIT $5 OFFSET $6
        `;
        params = [dateRange.start, dateRange.end, productCodes, session.user.pharmacyId, pageSize, offset];
      }
    }

    const result = await db.query<LaboratoryMarketShareResult>(query, params);
    
    const totalFromFirstRow = result[0]?.total || 0;
    const laboratories = result.map(row => ({
      laboratory_name: row.laboratory_name,
      product_count: Number(row.product_count),
      quantity_bought: Number(row.quantity_bought),
      ca_achats: Number(row.ca_achats),
      part_marche_achats_pct: Number(row.part_marche_achats_pct),
      margin_rate_percent: Number(row.margin_rate_percent),
      quantity_sold: Number(row.quantity_sold),
      ca_selection: Number(row.ca_selection),
      part_marche_ca_pct: Number(row.part_marche_ca_pct),
      is_referent: row.is_referent
    }));

    return NextResponse.json({
      laboratories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFromFirstRow / pageSize),
        total: totalFromFirstRow
      },
      isGlobalMode
    });

  } catch (error) {
    console.error('Laboratory market share error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}