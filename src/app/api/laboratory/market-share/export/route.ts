// src/app/api/laboratory/market-share/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LaboratoryExportResult {
  readonly laboratory_name: string;
  readonly product_count: number;
  readonly quantity_bought: number;
  readonly ca_achats: number;
  readonly quantity_sold: number;
  readonly ca_selection: number;
  readonly part_marche_ca_pct: number;
  readonly margin_rate_percent: number;
  readonly is_referent: boolean;
}

interface LaboratoryComparisonResult {
  readonly laboratory_name: string;
  readonly ca_achats: number;
  readonly ca_selection: number;
  readonly part_marche_ca_pct: number;
}

interface RequestBody {
  readonly filters: {
    readonly productCodes: string[];
    readonly laboratoryCodes: string[];
    readonly categoryCodes: string[];
    readonly pharmacyIds: string[];
    readonly dateRange: { start: string; end: string };
    readonly comparisonDateRange?: { start: string | null; end: string | null };
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { filters } = body;
    const { 
      productCodes, 
      laboratoryCodes, 
      categoryCodes, 
      pharmacyIds, 
      dateRange,
      comparisonDateRange 
    } = filters;

    const allCodes = [
      ...(productCodes || []),
      ...(laboratoryCodes || []),
      ...(categoryCodes || [])
    ];

    if (!dateRange?.start || !dateRange?.end) {
      return NextResponse.json({ error: 'Date range required' }, { status: 400 });
    }

    const isAdmin = session.user.role === 'admin';
    const hasComparison = comparisonDateRange?.start && comparisonDateRange?.end;
    const userPharmacyId = session.user.pharmacyId ?? undefined;

    // ========== REQUÊTE PÉRIODE ACTUELLE ==========
    const currentQuery = buildExportQuery(isAdmin, allCodes, pharmacyIds);
    const currentParams = buildExportParams(
      isAdmin,
      dateRange,
      allCodes,
      pharmacyIds,
      userPharmacyId
    );

    const currentResults = await db.query<LaboratoryExportResult>(
      currentQuery,
      currentParams
    );
    
    // ========== REQUÊTE PÉRIODE COMPARAISON ==========
    let comparisonResults: LaboratoryComparisonResult[] = [];
    
    if (hasComparison) {
      const comparisonQuery = buildComparisonQuery(isAdmin, allCodes, pharmacyIds);
      const comparisonParams = buildExportParams(
        isAdmin,
        { start: comparisonDateRange.start!, end: comparisonDateRange.end! },
        allCodes,
        pharmacyIds,
        userPharmacyId
      );

      comparisonResults = await db.query<LaboratoryComparisonResult>(
        comparisonQuery,
        comparisonParams
      );
    }

    // ========== CALCUL RANGS + ÉVOLUTIONS (SANS PAGINATION) ==========
    const comparisonMap = new Map(
      comparisonResults.map(r => [r.laboratory_name, r])
    );

    const sortedByCurrentCA = [...currentResults].sort(
      (a, b) => b.ca_selection - a.ca_selection
    );
    
    const previousRankMap = new Map<string, number>();
    if (hasComparison) {
      const sortedByComparisonCA = [...comparisonResults].sort(
        (a, b) => b.ca_selection - a.ca_selection
      );
      sortedByComparisonCA.forEach((lab, index) => {
        previousRankMap.set(lab.laboratory_name, index + 1);
      });
    }

    // ✅ TOUTES les données sans pagination, valeurs BRUTES
    const allLaboratories = sortedByCurrentCA.map((current, index) => {
      const comparison = comparisonMap.get(current.laboratory_name);
      const rang_actuel = index + 1;
      const rang_precedent = previousRankMap.get(current.laboratory_name) || null;
      const gain_rang = rang_precedent !== null ? rang_precedent - rang_actuel : null;
      
      const evol_achats_pct = comparison && comparison.ca_achats > 0
        ? ((current.ca_achats - comparison.ca_achats) / comparison.ca_achats) * 100
        : null;

      const evol_ventes_pct = comparison && comparison.ca_selection > 0
        ? ((current.ca_selection - comparison.ca_selection) / comparison.ca_selection) * 100
        : null;

      const evol_pdm_pct = comparison
        ? current.part_marche_ca_pct - comparison.part_marche_ca_pct
        : null;

      return {
        laboratory_name: current.laboratory_name,
        product_count: current.product_count,
        rang_actuel,
        rang_precedent,
        gain_rang,
        quantity_bought: current.quantity_bought,
        ca_achats: current.ca_achats,
        ca_achats_comparison: comparison?.ca_achats ?? null,
        evol_achats_pct,
        quantity_sold: current.quantity_sold,
        ca_selection: current.ca_selection,
        ca_selection_comparison: comparison?.ca_selection ?? null,
        evol_ventes_pct,
        part_marche_ca_pct: current.part_marche_ca_pct,
        part_marche_ca_pct_comparison: comparison?.part_marche_ca_pct ?? null,
        evol_pdm_pct,
        margin_rate_percent: current.margin_rate_percent,
        is_referent: current.is_referent
      };
    });

    return NextResponse.json({
      laboratories: allLaboratories,
      total: allLaboratories.length,
      hasComparison
    });

  } catch (error) {
    console.error('Erreur export parts de marché laboratoires:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ========== QUERY BUILDERS ==========

function buildExportQuery(
  isAdmin: boolean,
  allCodes: string[],
  pharmacyIds: string[]
): string {
  const hasPharmacyFilter = isAdmin && pharmacyIds?.length > 0;
  const pharmacyFilterGlobal = hasPharmacyFilter 
    ? `AND ip.pharmacy_id = ANY($${allCodes.length > 0 ? 4 : 3}::uuid[])`
    : !isAdmin 
      ? `AND ip.pharmacy_id = $${allCodes.length > 0 ? 4 : 3}::uuid`
      : '';

  const productFilter = allCodes.length > 0 
    ? 'AND ip.code_13_ref_id = ANY($3::text[])' 
    : '';

  return `
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
        ${productFilter}
        ${pharmacyFilterGlobal}
      GROUP BY dgp.bcb_lab
    ),
    lab_ventes AS (
      SELECT 
        dgp.bcb_lab as laboratory_name,
        COUNT(DISTINCT ip.code_13_ref_id) as product_count,
        SUM(s.quantity) as quantity_sold,
        SUM(s.quantity * s.unit_price_ttc) as ca_selection,
        SUM(s.quantity * (
          (s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0)) 
          - ins.weighted_average_price
        )) as marge_selection,
        SUM(s.quantity * (
          s.unit_price_ttc / (1 + COALESCE(dgp.tva_percentage, dgp.bcb_tva_rate, 0) / 100.0)
        )) as ca_ht_selection,
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
        ${productFilter}
        ${pharmacyFilterGlobal}
      GROUP BY dgp.bcb_lab
    ),
    group_totals AS (
      SELECT SUM(lv.ca_selection) as ca_ventes_total FROM lab_ventes lv
    )
    SELECT 
      COALESCE(lv.laboratory_name, la.laboratory_name) as laboratory_name,
      COALESCE(lv.product_count, 0) as product_count,
      COALESCE(la.quantity_bought, 0) as quantity_bought,
      COALESCE(la.ca_achats, 0) as ca_achats,
      COALESCE(lv.quantity_sold, 0) as quantity_sold,
      COALESCE(lv.ca_selection, 0) as ca_selection,
      CASE 
        WHEN gt.ca_ventes_total > 0 
        THEN (COALESCE(lv.ca_selection, 0) / gt.ca_ventes_total) * 100 
        ELSE 0 
      END as part_marche_ca_pct,
      CASE 
        WHEN COALESCE(lv.ca_ht_selection, 0) > 0 
        THEN (COALESCE(lv.marge_selection, 0) / lv.ca_ht_selection) * 100
        ELSE 0
      END as margin_rate_percent,
      COALESCE(lv.is_referent, 0)::boolean as is_referent
    FROM lab_ventes lv
    FULL OUTER JOIN lab_achats la ON lv.laboratory_name = la.laboratory_name
    CROSS JOIN group_totals gt
    WHERE COALESCE(lv.laboratory_name, la.laboratory_name) IS NOT NULL
    ORDER BY COALESCE(lv.ca_selection, 0) DESC
  `;
}

function buildComparisonQuery(
  isAdmin: boolean,
  allCodes: string[],
  pharmacyIds: string[]
): string {
  const hasPharmacyFilter = isAdmin && pharmacyIds?.length > 0;
  const pharmacyFilterGlobal = hasPharmacyFilter 
    ? `AND ip.pharmacy_id = ANY($${allCodes.length > 0 ? 4 : 3}::uuid[])`
    : !isAdmin 
      ? `AND ip.pharmacy_id = $${allCodes.length > 0 ? 4 : 3}::uuid`
      : '';

  const productFilter = allCodes.length > 0 
    ? 'AND ip.code_13_ref_id = ANY($3::text[])' 
    : '';

  return `
    WITH lab_achats AS (
      SELECT 
        dgp.bcb_lab as laboratory_name,
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
        ${productFilter}
        ${pharmacyFilterGlobal}
      GROUP BY dgp.bcb_lab
    ),
    lab_ventes AS (
      SELECT 
        dgp.bcb_lab as laboratory_name,
        SUM(s.quantity * s.unit_price_ttc) as ca_selection
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
        ${productFilter}
        ${pharmacyFilterGlobal}
      GROUP BY dgp.bcb_lab
    ),
    group_totals AS (
      SELECT SUM(lv.ca_selection) as ca_ventes_total FROM lab_ventes lv
    )
    SELECT 
      COALESCE(lv.laboratory_name, la.laboratory_name) as laboratory_name,
      COALESCE(la.ca_achats, 0) as ca_achats,
      COALESCE(lv.ca_selection, 0) as ca_selection,
      CASE 
        WHEN gt.ca_ventes_total > 0 
        THEN (COALESCE(lv.ca_selection, 0) / gt.ca_ventes_total) * 100 
        ELSE 0 
      END as part_marche_ca_pct
    FROM lab_ventes lv
    FULL OUTER JOIN lab_achats la ON lv.laboratory_name = la.laboratory_name
    CROSS JOIN group_totals gt
    WHERE COALESCE(lv.laboratory_name, la.laboratory_name) IS NOT NULL
  `;
}

function buildExportParams(
  isAdmin: boolean,
  dateRange: { start: string; end: string },
  allCodes: string[],
  pharmacyIds: string[],
  userPharmacyId: string | undefined
): any[] {
  const hasPharmacyFilter = isAdmin && pharmacyIds?.length > 0;

  if (allCodes.length > 0) {
    if (hasPharmacyFilter) {
      return [dateRange.start, dateRange.end, allCodes, pharmacyIds];
    } else if (!isAdmin && userPharmacyId) {
      return [dateRange.start, dateRange.end, allCodes, userPharmacyId];
    }
    return [dateRange.start, dateRange.end, allCodes];
  }
  
  if (hasPharmacyFilter) {
    return [dateRange.start, dateRange.end, pharmacyIds];
  } else if (!isAdmin && userPharmacyId) {
    return [dateRange.start, dateRange.end, userPharmacyId];
  }
  return [dateRange.start, dateRange.end];
}