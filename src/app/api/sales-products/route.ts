// src/app/api/sales-products/route.ts
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
const CACHE_TTL = 3600; // 1 heure pour données ventes

interface SalesProductsRequest {
  readonly dateRange: { start: string; end: string; };
  readonly productCodes: string[];
  readonly laboratoryCodes: string[];
  readonly categoryCodes: string[];
  readonly pharmacyIds?: string[];
}

interface SalesProductRow {
  readonly nom: string;
  readonly code_ean: string;
  readonly periode: string;
  readonly periode_libelle: string;
  readonly type_ligne: 'DETAIL' | 'SYNTHESE';
  readonly quantite_vendue: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
  readonly part_marche_quantite_pct: number;
  readonly part_marche_marge_pct: number;
  readonly montant_ventes_ttc: number;
  readonly montant_marge_total: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    console.log('🔥 [API] Sales products API called');
    
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

    let body: SalesProductsRequest;
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
    
    // 2. Fusion des codes EAN sans doublons
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
    
    const salesData = context.isAdmin 
      ? await executeAdminQuery(body.dateRange, allProductCodes, secureFilters.pharmacy, hasProductFilter)
      : await executeUserQuery(body.dateRange, allProductCodes, context.pharmacyId!, hasProductFilter);

    console.log('📈 [API] Query completed:', {
      dataFound: salesData.length,
      dateRangeUsed: body.dateRange,
      queryTimeMs: Date.now() - startTime
    });

    const result = {
      salesData,
      count: salesData.length,
      dateRange: body.dateRange,
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
    console.error('💥 [API] Sales products API error:', error);
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
): Promise<SalesProductRow[]> {
  const pharmacyFilter = pharmacyIds && pharmacyIds.length > 0
    ? 'AND ip.pharmacy_id = ANY($4::uuid[])'
    : '';

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
  
  if (pharmacyIds && pharmacyIds.length > 0) {
    params.push(pharmacyIds);   // $4 ou $3 selon hasProductFilter
  }

  const finalPharmacyFilter = pharmacyFilter.replace('$4', `$${paramIndex}`);

  // Calcul granularité : si plus de 62 jours, grouper par mois
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const useMonthlyGrouping = diffDays > 62;

  const periodGrouping = useMonthlyGrouping 
    ? "DATE_TRUNC('month', s.date)"
    : "s.date";
  
  const periodFormat = useMonthlyGrouping 
    ? "TO_CHAR(periode, 'YYYY-MM')"
    : "TO_CHAR(periode, 'YYYY-MM-DD')";

  const periodLabel = useMonthlyGrouping
    ? "TO_CHAR(periode, 'Month YYYY')"
    : "TO_CHAR(periode, 'DD/MM/YYYY')";

  const query = `
    WITH period_sales AS (
      SELECT 
        ip.code_13_ref_id,
        MIN(ip.name) as product_name,
        ${periodGrouping} as periode,
        SUM(s.quantity) as quantite_vendue_periode,
        AVG(s.unit_price_ttc) as prix_vente_moyen_periode,
        AVG(ins.weighted_average_price) as prix_achat_moyen_periode,
        SUM(s.quantity * s.unit_price_ttc) as montant_ventes_ttc,
        SUM(s.quantity * (
          (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
        )) as montant_marge_total,
        SUM(s.quantity * (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0))) as montant_ca_ht
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
      GROUP BY ip.code_13_ref_id, ${periodGrouping}
      HAVING SUM(s.quantity) > 0
    ),
    product_info AS (
      SELECT 
        ip.code_13_ref_id,
        MIN(ip.name) as product_name
      FROM data_internalproduct ip
      WHERE 1=1
        ${productFilter}
        ${finalPharmacyFilter}
      GROUP BY ip.code_13_ref_id
    ),
    selection_totals AS (
      SELECT 
        SUM(ps.quantite_vendue_periode) as total_quantite_selection,
        SUM(ps.montant_marge_total) as total_marge_selection
      FROM period_sales ps
    ),
    all_results AS (
      -- Résultats détaillés par période
      SELECT 
        ps.product_name as nom,
        ps.code_13_ref_id as code_ean,
        ${periodFormat} as periode,
        ${periodLabel} as periode_libelle,
        'DETAIL' as type_ligne,
        
        ps.quantite_vendue_periode as quantite_vendue,
        ROUND(ps.prix_achat_moyen_periode, 2) as prix_achat_moyen,
        ROUND(ps.prix_vente_moyen_periode, 2) as prix_vente_moyen,
        CASE 
          WHEN ps.montant_ca_ht > 0 THEN
            ROUND((ps.montant_marge_total / ps.montant_ca_ht) * 100, 2)
          ELSE 0
        END as taux_marge_moyen,
        
        CASE 
          WHEN st.total_quantite_selection > 0 
          THEN ROUND((ps.quantite_vendue_periode * 100.0 / st.total_quantite_selection), 2)
          ELSE 0 
        END as part_marche_quantite_pct,
        
        CASE 
          WHEN st.total_marge_selection > 0 
          THEN ROUND((ps.montant_marge_total * 100.0 / st.total_marge_selection), 2)
          ELSE 0 
        END as part_marche_marge_pct,
        
        ROUND(ps.montant_ventes_ttc, 2) as montant_ventes_ttc,
        ROUND(ps.montant_marge_total, 2) as montant_marge_total,
        
        ps.periode as sort_periode,
        1 as sort_order
        
      FROM period_sales ps
      CROSS JOIN selection_totals st
      
      UNION ALL
      
      -- Ligne synthèse par produit
      SELECT 
        pi.product_name as nom,
        pi.code_13_ref_id as code_ean,
        'TOTAL' as periode,
        'SYNTHÈSE PÉRIODE' as periode_libelle,
        'SYNTHESE' as type_ligne,
        
        SUM(ps.quantite_vendue_periode) as quantite_vendue,
        ROUND(AVG(ps.prix_achat_moyen_periode), 2) as prix_achat_moyen,
        ROUND(AVG(ps.prix_vente_moyen_periode), 2) as prix_vente_moyen,
        CASE 
          WHEN SUM(ps.montant_ca_ht) > 0 THEN
            ROUND((SUM(ps.montant_marge_total) / SUM(ps.montant_ca_ht)) * 100, 2)
          ELSE 0
        END as taux_marge_moyen,
        
        CASE 
          WHEN st.total_quantite_selection > 0 
          THEN ROUND((SUM(ps.quantite_vendue_periode) * 100.0 / st.total_quantite_selection), 2)
          ELSE 0 
        END as part_marche_quantite_pct,
        
        CASE 
          WHEN st.total_marge_selection > 0 
          THEN ROUND((SUM(ps.montant_marge_total) * 100.0 / st.total_marge_selection), 2)
          ELSE 0 
        END as part_marche_marge_pct,
        
        ROUND(SUM(ps.montant_ventes_ttc), 2) as montant_ventes_ttc,
        ROUND(SUM(ps.montant_marge_total), 2) as montant_marge_total,
        
        NULL as sort_periode,
        0 as sort_order
        
      FROM product_info pi
      CROSS JOIN selection_totals st
      LEFT JOIN period_sales ps ON pi.code_13_ref_id = ps.code_13_ref_id
      GROUP BY pi.product_name, pi.code_13_ref_id, st.total_quantite_selection, st.total_marge_selection
      HAVING SUM(ps.quantite_vendue_periode) > 0
    )
    SELECT 
      nom,
      code_ean,
      periode,
      periode_libelle,
      type_ligne,
      quantite_vendue,
      prix_achat_moyen,
      prix_vente_moyen,
      taux_marge_moyen,
      part_marche_quantite_pct,
      part_marche_marge_pct,
      montant_ventes_ttc,
      montant_marge_total
    FROM all_results
    ORDER BY nom, sort_order, sort_periode ASC;
  `;

  return await db.query(query, params);
}

async function executeUserQuery(
  dateRange: { start: string; end: string },
  productCodes: string[],
  pharmacyId: string,
  hasProductFilter: boolean = true
): Promise<SalesProductRow[]> {
  
  const productFilter = hasProductFilter 
    ? 'AND ip.code_13_ref_id = ANY($3::text[])'
    : '';

  const params = hasProductFilter
    ? [dateRange.start, dateRange.end, productCodes, pharmacyId]
    : [dateRange.start, dateRange.end, pharmacyId];

  const pharmacyParam = hasProductFilter ? '$4::uuid' : '$3::uuid';

  // Même logique granularité
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const useMonthlyGrouping = diffDays > 62;

  const periodGrouping = useMonthlyGrouping 
    ? "DATE_TRUNC('month', s.date)"
    : "s.date";
  
  const periodFormat = useMonthlyGrouping 
    ? "TO_CHAR(periode, 'YYYY-MM')"
    : "TO_CHAR(periode, 'YYYY-MM-DD')";

  const periodLabel = useMonthlyGrouping
    ? "TO_CHAR(periode, 'Month YYYY')"
    : "TO_CHAR(periode, 'DD/MM/YYYY')";

  const query = `
    WITH period_sales AS (
      SELECT 
        ip.code_13_ref_id,
        MIN(ip.name) as product_name,
        ${periodGrouping} as periode,
        SUM(s.quantity) as quantite_vendue_periode,
        AVG(s.unit_price_ttc) as prix_vente_moyen_periode,
        AVG(ins.weighted_average_price) as prix_achat_moyen_periode,
        SUM(s.quantity * s.unit_price_ttc) as montant_ventes_ttc,
        SUM(s.quantity * (
          (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
        )) as montant_marge_total,
        SUM(s.quantity * (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0))) as montant_ca_ht
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
      GROUP BY ip.code_13_ref_id, ${periodGrouping}
      HAVING SUM(s.quantity) > 0
    ),
    product_info AS (
      SELECT 
        ip.code_13_ref_id,
        MIN(ip.name) as product_name
      FROM data_internalproduct ip
      WHERE ip.pharmacy_id = ${pharmacyParam}
        ${productFilter}
      GROUP BY ip.code_13_ref_id
    ),
    selection_totals AS (
      SELECT 
        SUM(ps.quantite_vendue_periode) as total_quantite_selection,
        SUM(ps.montant_marge_total) as total_marge_selection
      FROM period_sales ps
    ),
    all_results AS (
      -- Détails par période
      SELECT 
        ps.product_name as nom,
        ps.code_13_ref_id as code_ean,
        ${periodFormat} as periode,
        ${periodLabel} as periode_libelle,
        'DETAIL' as type_ligne,
        
        ps.quantite_vendue_periode as quantite_vendue,
        ROUND(ps.prix_achat_moyen_periode, 2) as prix_achat_moyen,
        ROUND(ps.prix_vente_moyen_periode, 2) as prix_vente_moyen,
        CASE 
          WHEN ps.montant_ca_ht > 0 THEN
            ROUND((ps.montant_marge_total / ps.montant_ca_ht) * 100, 2)
          ELSE 0
        END as taux_marge_moyen,
        
        CASE 
          WHEN st.total_quantite_selection > 0 
          THEN ROUND((ps.quantite_vendue_periode * 100.0 / st.total_quantite_selection), 2)
          ELSE 0 
        END as part_marche_quantite_pct,
        
        CASE 
          WHEN st.total_marge_selection > 0 
          THEN ROUND((ps.montant_marge_total * 100.0 / st.total_marge_selection), 2)
          ELSE 0 
        END as part_marche_marge_pct,
        
        ROUND(ps.montant_ventes_ttc, 2) as montant_ventes_ttc,
        ROUND(ps.montant_marge_total, 2) as montant_marge_total,
        
        ps.periode as sort_periode,
        1 as sort_order
        
      FROM period_sales ps
      CROSS JOIN selection_totals st
      
      UNION ALL
      
      -- Synthèse par produit
      SELECT 
        pi.product_name as nom,
        pi.code_13_ref_id as code_ean,
        'TOTAL' as periode,
        'SYNTHÈSE PÉRIODE' as periode_libelle,
        'SYNTHESE' as type_ligne,
        
        SUM(ps.quantite_vendue_periode) as quantite_vendue,
        ROUND(AVG(ps.prix_achat_moyen_periode), 2) as prix_achat_moyen,
        ROUND(AVG(ps.prix_vente_moyen_periode), 2) as prix_vente_moyen,
        CASE 
          WHEN SUM(ps.montant_ca_ht) > 0 THEN
            ROUND((SUM(ps.montant_marge_total) / SUM(ps.montant_ca_ht)) * 100, 2)
          ELSE 0
        END as taux_marge_moyen,
        
        CASE 
          WHEN st.total_quantite_selection > 0 
          THEN ROUND((SUM(ps.quantite_vendue_periode) * 100.0 / st.total_quantite_selection), 2)
          ELSE 0 
        END as part_marche_quantite_pct,
        
        CASE 
          WHEN st.total_marge_selection > 0 
          THEN ROUND((SUM(ps.montant_marge_total) * 100.0 / st.total_marge_selection), 2)
          ELSE 0 
        END as part_marche_marge_pct,
        
        ROUND(SUM(ps.montant_ventes_ttc), 2) as montant_ventes_ttc,
        ROUND(SUM(ps.montant_marge_total), 2) as montant_marge_total,
        
        NULL as sort_periode,
        0 as sort_order
        
      FROM product_info pi
      CROSS JOIN selection_totals st
      LEFT JOIN period_sales ps ON pi.code_13_ref_id = ps.code_13_ref_id
      GROUP BY pi.product_name, pi.code_13_ref_id, st.total_quantite_selection, st.total_marge_selection
      HAVING SUM(ps.quantite_vendue_periode) > 0
    )
    SELECT 
      nom,
      code_ean,
      periode,
      periode_libelle,
      type_ligne,
      quantite_vendue,
      prix_achat_moyen,
      prix_vente_moyen,
      taux_marge_moyen,
      part_marche_quantite_pct,
      part_marche_marge_pct,
      montant_ventes_ttc,
      montant_marge_total
    FROM all_results
    ORDER BY nom, sort_order, sort_periode ASC;
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
  return `sales:products:${hash}`;
}