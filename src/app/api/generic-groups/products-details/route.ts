// src/app/api/generic-groups/products-details/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import type { GenericProductDetail } from '@/types/generic-products-details';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true' && 
                     process.env.UPSTASH_REDIS_REST_URL && 
                     process.env.UPSTASH_REDIS_REST_TOKEN;
const CACHE_TTL = 3600; // 1 heure

interface RequestBody {
  readonly codeEan: string;
  readonly dateRange: { start: string; end: string };
  readonly pharmacyIds?: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { codeEan, dateRange, pharmacyIds = [] } = body;

    if (!codeEan || !dateRange?.start || !dateRange?.end) {
      return NextResponse.json(
        { error: 'codeEan and dateRange required' }, 
        { status: 400 }
      );
    }

    const isAdmin = session.user.role === 'admin';
    
    const effectivePharmacyIds = isAdmin 
      ? pharmacyIds 
      : (session.user.pharmacyId ? [session.user.pharmacyId] : []);

    const hasPharmacyFilter = effectivePharmacyIds.length > 0;

    const cacheKey = generateCacheKey({
      codeEan,
      dateRange,
      pharmacyIds: effectivePharmacyIds,
      role: session.user.role
    });

    if (CACHE_ENABLED) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return NextResponse.json({
            ...(cached as any),
            cached: true,
            queryTime: Date.now() - startTime
          });
        }
      } catch (cacheError) {
        console.warn('⚠️ Cache read error:', cacheError);
      }
    }

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const useMonthlyGrouping = diffDays > 62;

    const periodGrouping = useMonthlyGrouping 
      ? "DATE_TRUNC('month', s.date)"
      : "s.date";
    
    const periodFormat = useMonthlyGrouping 
      ? "TO_CHAR(all_periods.periode, 'YYYY-MM')"
      : "TO_CHAR(all_periods.periode, 'YYYY-MM-DD')";

    const periodLabel = useMonthlyGrouping
      ? "TO_CHAR(all_periods.periode, 'Month YYYY')"
      : "TO_CHAR(all_periods.periode, 'DD/MM/YYYY')";

    const details = isAdmin
      ? await executeAdminQuery(
          codeEan,
          dateRange,
          effectivePharmacyIds,
          hasPharmacyFilter,
          periodGrouping,
          periodFormat,
          periodLabel
        )
      : await executeUserQuery(
          codeEan,
          dateRange,
          session.user.pharmacyId!,
          periodGrouping,
          periodFormat,
          periodLabel
        );

    const result = {
      details,
      productName: details[0]?.product_name || '',
      laboratoryName: details[0]?.laboratory_name || '',
      queryTime: Date.now() - startTime,
      cached: false
    };

    if (CACHE_ENABLED) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
      } catch (cacheError) {
        console.warn('⚠️ Cache write error:', cacheError);
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('💥 [API Generic Details] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', queryTime: Date.now() - startTime },
      { status: 500 }
    );
  }
}

async function executeAdminQuery(
  codeEan: string,
  dateRange: { start: string; end: string },
  pharmacyIds: string[],
  hasPharmacyFilter: boolean,
  periodGrouping: string,
  periodFormat: string,
  periodLabel: string
): Promise<GenericProductDetail[]> {
  
  const pharmacyFilter = hasPharmacyFilter 
    ? 'AND ip.pharmacy_id = ANY($3::uuid[])'
    : '';

  const params = hasPharmacyFilter
    ? [dateRange.start, dateRange.end, pharmacyIds, codeEan]
    : [dateRange.start, dateRange.end, codeEan];

  const codeEanParam = hasPharmacyFilter ? '$4::text' : '$3::text';

  const query = `
    WITH period_sales AS (
      SELECT 
        ${periodGrouping} as periode,
        SUM(s.quantity) as quantity_sold_period,
        SUM(s.quantity * s.unit_price_ttc) as ca_ventes_period,
        SUM(s.quantity * (
          (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
        )) as margin_period,
        SUM(s.quantity * (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0))) as ca_ventes_ht_period,
        AVG(ins.weighted_average_price) as avg_buy_price_period
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        ${pharmacyFilter}
        AND dgp.code_13_ref = ${codeEanParam}
      GROUP BY ${periodGrouping}
    ),
    period_purchases AS (
      SELECT 
        ${periodGrouping.replace('s.date', 'o.delivery_date')} as periode,
        SUM(po.qte_r) as quantity_bought_period,
        SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)) as ca_achats_period,
        AVG(COALESCE(closest_snap.weighted_average_price, 0)) as avg_buy_price_period
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
        ${pharmacyFilter}
        AND dgp.code_13_ref = ${codeEanParam}
      GROUP BY ${periodGrouping.replace('s.date', 'o.delivery_date')}
    ),
    product_info AS (
      SELECT 
        dgp.code_13_ref,
        MIN(dgp.name) as product_name,
        MIN(dgp.bcb_lab) as laboratory_name,
        MIN(pbcb.prix_achat_ht_fabricant) as prix_brut_grossiste
      FROM data_globalproduct dgp
      LEFT JOIN data_globalproduct_prices_bcb pbcb ON dgp.code_13_ref = pbcb.code_13_ref
      WHERE dgp.code_13_ref = ${codeEanParam}
      GROUP BY dgp.code_13_ref
    ),
    all_periods AS (
      SELECT DISTINCT periode FROM period_sales
      UNION
      SELECT DISTINCT periode FROM period_purchases
    )
    SELECT 
      pi.code_13_ref as code_ean,
      pi.product_name,
      pi.laboratory_name,
      ${periodFormat} as periode,
      ${periodLabel} as periode_libelle,
      'DETAIL' as type_ligne,
      COALESCE(pp.quantity_bought_period, 0) as quantity_bought,
      COALESCE(ps.quantity_sold_period, 0) as quantity_sold,
      COALESCE(pp.ca_achats_period, 0) as ca_achats,
      COALESCE(ps.ca_ventes_period, 0) as ca_ventes,
      COALESCE(pp.avg_buy_price_period, ps.avg_buy_price_period, 0) as avg_buy_price_ht,
      CASE 
        WHEN COALESCE(ps.ca_ventes_ht_period, 0) > 0 
        THEN (COALESCE(ps.margin_period, 0) / ps.ca_ventes_ht_period) * 100
        ELSE 0
      END as margin_rate_percent,
      pi.prix_brut_grossiste,
      CASE 
        WHEN pi.prix_brut_grossiste IS NOT NULL 
          AND pi.prix_brut_grossiste > 0 
          AND pp.avg_buy_price_period IS NOT NULL
        THEN ((pi.prix_brut_grossiste - pp.avg_buy_price_period) / pi.prix_brut_grossiste) * 100
        ELSE 0
      END as remise_percent
    FROM product_info pi
    CROSS JOIN all_periods
    LEFT JOIN period_sales ps ON all_periods.periode = ps.periode
    LEFT JOIN period_purchases pp ON all_periods.periode = pp.periode
    WHERE COALESCE(ps.quantity_sold_period, 0) > 0 
       OR COALESCE(pp.quantity_bought_period, 0) > 0
    ORDER BY all_periods.periode ASC;
  `;

  return await db.query<GenericProductDetail>(query, params);
}

async function executeUserQuery(
  codeEan: string,
  dateRange: { start: string; end: string },
  pharmacyId: string,
  periodGrouping: string,
  periodFormat: string,
  periodLabel: string
): Promise<GenericProductDetail[]> {
  
  const params = [dateRange.start, dateRange.end, pharmacyId, codeEan];

  const query = `
    WITH period_sales AS (
      SELECT 
        ${periodGrouping} as periode,
        SUM(s.quantity) as quantity_sold_period,
        SUM(s.quantity * s.unit_price_ttc) as ca_ventes_period,
        SUM(s.quantity * (
          (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
        )) as margin_period,
        SUM(s.quantity * (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0))) as ca_ventes_ht_period,
        AVG(ins.weighted_average_price) as avg_buy_price_period
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        AND ip.pharmacy_id = $3::uuid
        AND dgp.code_13_ref = $4::text
      GROUP BY ${periodGrouping}
    ),
    period_purchases AS (
      SELECT 
        ${periodGrouping.replace('s.date', 'o.delivery_date')} as periode,
        SUM(po.qte_r) as quantity_bought_period,
        SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)) as ca_achats_period,
        AVG(COALESCE(closest_snap.weighted_average_price, 0)) as avg_buy_price_period
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
        AND ip.pharmacy_id = $3::uuid
        AND dgp.code_13_ref = $4::text
      GROUP BY ${periodGrouping.replace('s.date', 'o.delivery_date')}
    ),
    product_info AS (
      SELECT 
        dgp.code_13_ref,
        MIN(dgp.name) as product_name,
        MIN(dgp.bcb_lab) as laboratory_name,
        MIN(pbcb.prix_achat_ht_fabricant) as prix_brut_grossiste
      FROM data_globalproduct dgp
      LEFT JOIN data_globalproduct_prices_bcb pbcb ON dgp.code_13_ref = pbcb.code_13_ref
      WHERE dgp.code_13_ref = $4::text
      GROUP BY dgp.code_13_ref
    ),
    all_periods AS (
      SELECT DISTINCT periode FROM period_sales
      UNION
      SELECT DISTINCT periode FROM period_purchases
    )
    SELECT 
      pi.code_13_ref as code_ean,
      pi.product_name,
      pi.laboratory_name,
      ${periodFormat} as periode,
      ${periodLabel} as periode_libelle,
      'DETAIL' as type_ligne,
      COALESCE(pp.quantity_bought_period, 0) as quantity_bought,
      COALESCE(ps.quantity_sold_period, 0) as quantity_sold,
      COALESCE(pp.ca_achats_period, 0) as ca_achats,
      COALESCE(ps.ca_ventes_period, 0) as ca_ventes,
      COALESCE(pp.avg_buy_price_period, ps.avg_buy_price_period, 0) as avg_buy_price_ht,
      CASE 
        WHEN COALESCE(ps.ca_ventes_ht_period, 0) > 0 
        THEN (COALESCE(ps.margin_period, 0) / ps.ca_ventes_ht_period) * 100
        ELSE 0
      END as margin_rate_percent,
      pi.prix_brut_grossiste,
      CASE 
        WHEN pi.prix_brut_grossiste IS NOT NULL 
          AND pi.prix_brut_grossiste > 0 
          AND pp.avg_buy_price_period IS NOT NULL
        THEN ((pi.prix_brut_grossiste - pp.avg_buy_price_period) / pi.prix_brut_grossiste) * 100
        ELSE 0
      END as remise_percent
    FROM product_info pi
    CROSS JOIN all_periods
    LEFT JOIN period_sales ps ON all_periods.periode = ps.periode
    LEFT JOIN period_purchases pp ON all_periods.periode = pp.periode
    WHERE COALESCE(ps.quantity_sold_period, 0) > 0 
       OR COALESCE(pp.quantity_bought_period, 0) > 0
    ORDER BY all_periods.periode ASC;
  `;

  return await db.query<GenericProductDetail>(query, params);
}

function generateCacheKey(params: {
  codeEan: string;
  dateRange: { start: string; end: string };
  pharmacyIds: string[];
  role: string;
}): string {
  const data = JSON.stringify({
    codeEan: params.codeEan,
    dateRange: params.dateRange,
    pharmacyIds: params.pharmacyIds.sort(),
    role: params.role
  });
  
  const hash = crypto.createHash('md5').update(data).digest('hex');
  return `generic:details:${hash}`;
}