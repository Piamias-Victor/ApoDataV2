// src/app/api/laboratory/market-share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LaboratoryMarketShareResult {
  readonly laboratory_name: string;
  readonly ca_selection: number;
  readonly ca_total_group: number;
  readonly part_marche_ca_pct: number;
  readonly marge_selection: number;
  readonly marge_total_group: number;
  readonly part_marche_marge_pct: number;
  readonly product_count: number;
  readonly is_referent: boolean;
}

interface RequestBody {
  readonly filters: {
    readonly productCodes: string[];
    readonly laboratoryCodes: string[];
    readonly categoryCodes: string[];
    readonly pharmacyIds: string[];
    readonly dateRange: { start: string; end: string };
  };
  readonly pagination?: {
    readonly page?: number;
    readonly pageSize?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { filters, pagination } = body;
    const { productCodes, laboratoryCodes, categoryCodes, pharmacyIds, dateRange } = filters;
    const { page = 1, pageSize = 10 } = pagination || {};

    const allCodes = [
      ...(productCodes || []),
      ...(laboratoryCodes || []),
      ...(categoryCodes || [])
    ];

    if (!dateRange?.start || !dateRange?.end) {
      return NextResponse.json({ error: 'Date range required' }, { status: 400 });
    }

    const isAdmin = session.user.role === 'admin';
    const offset = (page - 1) * pageSize;
    
    let query: string;
    let params: any[];

    if (isAdmin) {
      if (pharmacyIds?.length > 0) {
        query = `
          WITH group_total AS (
            SELECT 
              SUM(s.quantity * ins.price_with_tax) as ca_total,
              SUM(s.quantity * (
                (ins.price_with_tax / (1 + COALESCE(ip."TVA", 0) / 100.0)) - ins.weighted_average_price
              )) as marge_total
            FROM data_sales s
            JOIN data_inventorysnapshot ins ON s.product_id = ins.id
            JOIN data_internalproduct ip ON ins.product_id = ip.id
            WHERE s.date >= $1::date 
              AND s.date <= $2::date
              ${allCodes.length > 0 ? 'AND ip.code_13_ref_id = ANY($3::text[])' : ''}
              AND ip.pharmacy_id = ANY($${allCodes.length > 0 ? 4 : 3}::uuid[])
          ),
          lab_metrics AS (
            SELECT 
              dgp.bcb_lab as laboratory_name,
              SUM(s.quantity * ins.price_with_tax) as ca_selection,
              SUM(s.quantity * (
                (ins.price_with_tax / (1 + COALESCE(ip."TVA", 0) / 100.0)) - ins.weighted_average_price
              )) as marge_selection,
              COUNT(DISTINCT ip.code_13_ref_id) as product_count,
              MAX(CASE WHEN dgp.bcb_generic_status = 'RÉFÉRENT' THEN 1 ELSE 0 END) as is_referent
            FROM data_sales s
            JOIN data_inventorysnapshot ins ON s.product_id = ins.id
            JOIN data_internalproduct ip ON ins.product_id = ip.id
            JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
            WHERE s.date >= $1::date 
              AND s.date <= $2::date
              ${allCodes.length > 0 ? 'AND ip.code_13_ref_id = ANY($3::text[])' : ''}
              AND ip.pharmacy_id = ANY($${allCodes.length > 0 ? 4 : 3}::uuid[])
              AND dgp.bcb_lab IS NOT NULL
            GROUP BY dgp.bcb_lab
          ),
          total_count AS (
            SELECT COUNT(*) as total FROM lab_metrics
          )
          SELECT 
            lm.laboratory_name,
            lm.ca_selection,
            gt.ca_total as ca_total_group,
            CASE 
              WHEN gt.ca_total > 0 
              THEN (lm.ca_selection / gt.ca_total) * 100 
              ELSE 0 
            END as part_marche_ca_pct,
            lm.marge_selection,
            gt.marge_total as marge_total_group,
            CASE 
              WHEN gt.marge_total > 0 
              THEN (lm.marge_selection / gt.marge_total) * 100 
              ELSE 0 
            END as part_marche_marge_pct,
            lm.product_count,
            lm.is_referent::boolean as is_referent,
            tc.total
          FROM lab_metrics lm
          CROSS JOIN group_total gt
          CROSS JOIN total_count tc
          ORDER BY lm.ca_selection DESC
          LIMIT $${allCodes.length > 0 ? 5 : 4} OFFSET $${allCodes.length > 0 ? 6 : 5}
        `;
        params = allCodes.length > 0 
          ? [dateRange.start, dateRange.end, allCodes, pharmacyIds, pageSize, offset]
          : [dateRange.start, dateRange.end, pharmacyIds, pageSize, offset];
      } else {
        query = `
          WITH group_total AS (
            SELECT 
              SUM(s.quantity * ins.price_with_tax) as ca_total,
              SUM(s.quantity * (
                (ins.price_with_tax / (1 + COALESCE(ip."TVA", 0) / 100.0)) - ins.weighted_average_price
              )) as marge_total
            FROM data_sales s
            JOIN data_inventorysnapshot ins ON s.product_id = ins.id
            JOIN data_internalproduct ip ON ins.product_id = ip.id
            WHERE s.date >= $1::date 
              AND s.date <= $2::date
              ${allCodes.length > 0 ? 'AND ip.code_13_ref_id = ANY($3::text[])' : ''}
          ),
          lab_metrics AS (
            SELECT 
              dgp.bcb_lab as laboratory_name,
              SUM(s.quantity * ins.price_with_tax) as ca_selection,
              SUM(s.quantity * (
                (ins.price_with_tax / (1 + COALESCE(ip."TVA", 0) / 100.0)) - ins.weighted_average_price
              )) as marge_selection,
              COUNT(DISTINCT ip.code_13_ref_id) as product_count,
              MAX(CASE WHEN dgp.bcb_generic_status = 'RÉFÉRENT' THEN 1 ELSE 0 END) as is_referent
            FROM data_sales s
            JOIN data_inventorysnapshot ins ON s.product_id = ins.id
            JOIN data_internalproduct ip ON ins.product_id = ip.id
            JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
            WHERE s.date >= $1::date 
              AND s.date <= $2::date
              ${allCodes.length > 0 ? 'AND ip.code_13_ref_id = ANY($3::text[])' : ''}
              AND dgp.bcb_lab IS NOT NULL
            GROUP BY dgp.bcb_lab
          ),
          total_count AS (
            SELECT COUNT(*) as total FROM lab_metrics
          )
          SELECT 
            lm.laboratory_name,
            lm.ca_selection,
            gt.ca_total as ca_total_group,
            CASE 
              WHEN gt.ca_total > 0 
              THEN (lm.ca_selection / gt.ca_total) * 100 
              ELSE 0 
            END as part_marche_ca_pct,
            lm.marge_selection,
            gt.marge_total as marge_total_group,
            CASE 
              WHEN gt.marge_total > 0 
              THEN (lm.marge_selection / gt.marge_total) * 100 
              ELSE 0 
            END as part_marche_marge_pct,
            lm.product_count,
            lm.is_referent::boolean as is_referent,
            tc.total
          FROM lab_metrics lm
          CROSS JOIN group_total gt
          CROSS JOIN total_count tc
          ORDER BY lm.ca_selection DESC
          LIMIT $${allCodes.length > 0 ? 4 : 3} OFFSET $${allCodes.length > 0 ? 5 : 4}
        `;
        params = allCodes.length > 0 
          ? [dateRange.start, dateRange.end, allCodes, pageSize, offset]
          : [dateRange.start, dateRange.end, pageSize, offset];
      }
    } else {
      if (!session.user.pharmacyId) {
        return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });
      }

      query = `
        WITH group_total AS (
          SELECT 
            SUM(s.quantity * ins.price_with_tax) as ca_total,
            SUM(s.quantity * (
              (ins.price_with_tax / (1 + COALESCE(ip."TVA", 0) / 100.0)) - ins.weighted_average_price
            )) as marge_total
          FROM data_sales s
          JOIN data_inventorysnapshot ins ON s.product_id = ins.id
          JOIN data_internalproduct ip ON ins.product_id = ip.id
          WHERE s.date >= $1::date 
            AND s.date <= $2::date
            ${allCodes.length > 0 ? 'AND ip.code_13_ref_id = ANY($3::text[])' : ''}
            AND ip.pharmacy_id = $${allCodes.length > 0 ? 4 : 3}::uuid
        ),
        lab_metrics AS (
          SELECT 
            dgp.bcb_lab as laboratory_name,
            SUM(s.quantity * ins.price_with_tax) as ca_selection,
            SUM(s.quantity * (
              (ins.price_with_tax / (1 + COALESCE(ip."TVA", 0) / 100.0)) - ins.weighted_average_price
            )) as marge_selection,
            COUNT(DISTINCT ip.code_13_ref_id) as product_count,
            MAX(CASE WHEN dgp.bcb_generic_status = 'RÉFÉRENT' THEN 1 ELSE 0 END) as is_referent
          FROM data_sales s
          JOIN data_inventorysnapshot ins ON s.product_id = ins.id
          JOIN data_internalproduct ip ON ins.product_id = ip.id
          JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
          WHERE s.date >= $1::date 
            AND s.date <= $2::date
            ${allCodes.length > 0 ? 'AND ip.code_13_ref_id = ANY($3::text[])' : ''}
            AND ip.pharmacy_id = $${allCodes.length > 0 ? 4 : 3}::uuid
            AND dgp.bcb_lab IS NOT NULL
          GROUP BY dgp.bcb_lab
        ),
        total_count AS (
          SELECT COUNT(*) as total FROM lab_metrics
        )
        SELECT 
          lm.laboratory_name,
          lm.ca_selection,
          gt.ca_total as ca_total_group,
          CASE 
            WHEN gt.ca_total > 0 
            THEN (lm.ca_selection / gt.ca_total) * 100 
            ELSE 0 
          END as part_marche_ca_pct,
          lm.marge_selection,
          gt.marge_total as marge_total_group,
          CASE 
            WHEN gt.marge_total > 0 
            THEN (lm.marge_selection / gt.marge_total) * 100 
            ELSE 0 
          END as part_marche_marge_pct,
          lm.product_count,
          lm.is_referent::boolean as is_referent,
          tc.total
        FROM lab_metrics lm
        CROSS JOIN group_total gt
        CROSS JOIN total_count tc
        ORDER BY lm.ca_selection DESC
        LIMIT $${allCodes.length > 0 ? 5 : 4} OFFSET $${allCodes.length > 0 ? 6 : 5}
      `;
      params = allCodes.length > 0 
        ? [dateRange.start, dateRange.end, allCodes, session.user.pharmacyId, pageSize, offset]
        : [dateRange.start, dateRange.end, session.user.pharmacyId, pageSize, offset];
    }

    const startTime = Date.now();
    const results = await db.query<LaboratoryMarketShareResult & { total: number }>(query, params);
    const queryTime = Date.now() - startTime;

    const total = results[0]?.total || 0;
    const totalPages = Math.ceil(total / pageSize);
    
    const laboratories = results.map(r => ({
      laboratory_name: r.laboratory_name,
      ca_selection: r.ca_selection,
      ca_total_group: r.ca_total_group,
      part_marche_ca_pct: r.part_marche_ca_pct,
      marge_selection: r.marge_selection,
      marge_total_group: r.marge_total_group,
      part_marche_marge_pct: r.part_marche_marge_pct,
      product_count: r.product_count,
      is_referent: r.is_referent
    }));

    return NextResponse.json({
      laboratories,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      },
      queryTime
    });

  } catch (error) {
    console.error('Erreur calcul parts de marché laboratoires:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}