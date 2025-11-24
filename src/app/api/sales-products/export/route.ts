// src/app/api/sales-products/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSecurityContext, enforcePharmacySecurity } from '@/lib/api-security';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SalesProductsExportRequest {
  readonly dateRange: { start: string; end: string };
  readonly comparisonDateRange?: { start: string; end: string };
  readonly productCodes: string[];
  readonly laboratoryCodes: string[];
  readonly categoryCodes: string[];
  readonly pharmacyIds?: string[];
}

interface SalesProductExportRow {
  readonly nom: string;
  readonly code_ean: string;
  readonly bcb_lab: string | null;
  readonly quantity_bought: number;
  readonly quantite_vendue: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
  readonly part_marche_quantite_pct: number;
  readonly part_marche_marge_pct: number;
  readonly montant_ventes_ttc: number;
  readonly montant_marge_total: number;
  readonly montant_ca_ht: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const context = await getSecurityContext();
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: SalesProductsExportRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.dateRange?.start || !body.dateRange?.end) {
      return NextResponse.json({ error: 'Date range required' }, { status: 400 });
    }
    
    const allProductCodes = Array.from(new Set([
      ...(body.productCodes || []),
      ...(body.laboratoryCodes || []),
      ...(body.categoryCodes || [])
    ]));

    const hasProductFilter = allProductCodes.length > 0;

    const secureFilters = enforcePharmacySecurity({
      dateRange: body.dateRange,
      pharmacy: body.pharmacyIds || []
    }, context);

    // ========== PÉRIODE PRINCIPALE ==========
    const mainData = context.isAdmin 
      ? await executeExportAdminQuery(body.dateRange, allProductCodes, secureFilters.pharmacy, hasProductFilter)
      : await executeExportUserQuery(body.dateRange, allProductCodes, context.pharmacyId!, hasProductFilter);

    // ========== PÉRIODE COMPARAISON ==========
    let comparisonMap = new Map<string, number>();
    const hasComparison = body.comparisonDateRange?.start && body.comparisonDateRange?.end;
    
    if (hasComparison) {
      const comparisonData = context.isAdmin
        ? await executeExportAdminQuery(body.comparisonDateRange!, allProductCodes, secureFilters.pharmacy, hasProductFilter)
        : await executeExportUserQuery(body.comparisonDateRange!, allProductCodes, context.pharmacyId!, hasProductFilter);
      
      comparisonData.forEach(row => {
        comparisonMap.set(row.code_ean, row.quantite_vendue);
      });
    }

    // ========== FUSION RÉSULTATS BRUTS ==========
    const exportData = mainData.map(row => {
      const quantite_vendue_comparison = comparisonMap.get(row.code_ean) ?? null;
      
      const evol_quantite_pct = quantite_vendue_comparison !== null && quantite_vendue_comparison > 0
        ? ((row.quantite_vendue - quantite_vendue_comparison) / quantite_vendue_comparison) * 100
        : null;

      return {
        nom: row.nom,
        code_ean: row.code_ean,
        bcb_lab: row.bcb_lab,
        quantity_bought: row.quantity_bought,
        quantite_vendue: row.quantite_vendue,
        quantite_vendue_comparison,
        evol_quantite_pct,
        prix_achat_moyen: row.prix_achat_moyen,
        prix_vente_moyen: row.prix_vente_moyen,
        taux_marge_moyen: row.taux_marge_moyen,
        part_marche_quantite_pct: row.part_marche_quantite_pct,
        part_marche_marge_pct: row.part_marche_marge_pct,
        montant_ventes_ttc: row.montant_ventes_ttc,
        montant_marge_total: row.montant_marge_total,
        montant_ca_ht: row.montant_ca_ht
      };
    });

    return NextResponse.json({
      products: exportData,
      total: exportData.length,
      hasComparison,
      queryTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('💥 [API Sales Products Export] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', queryTime: Date.now() - startTime },
      { status: 500 }
    );
  }
}

async function executeExportAdminQuery(
  dateRange: { start: string; end: string },
  productCodes: string[],
  pharmacyIds?: string[],
  hasProductFilter: boolean = true
): Promise<SalesProductExportRow[]> {
  const pharmacyFilter = pharmacyIds && pharmacyIds.length > 0
    ? 'AND ip.pharmacy_id = ANY($4::uuid[])'
    : '';

  const productFilter = hasProductFilter 
    ? 'AND ip.code_13_ref_id = ANY($3::text[])'
    : '';

  const params: any[] = [dateRange.start, dateRange.end];
  let paramIndex = 3;
  
  if (hasProductFilter) {
    params.push(productCodes);
    paramIndex = 4;
  }
  
  if (pharmacyIds && pharmacyIds.length > 0) {
    params.push(pharmacyIds);
  }

  const finalPharmacyFilter = pharmacyFilter.replace('$4', `$${paramIndex}`);

  const query = `
    WITH product_sales AS (
      SELECT 
        ip.code_13_ref_id,
        MIN(ip.name) as product_name,
        MIN(gp.bcb_lab) as bcb_lab,
        SUM(s.quantity) as quantite_vendue,
        AVG(s.unit_price_ttc) as prix_vente_moyen,
        AVG(ins.weighted_average_price) as prix_achat_moyen,
        SUM(s.quantity * s.unit_price_ttc) as montant_ventes_ttc,
        SUM(s.quantity * (
          (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)) 
          - ins.weighted_average_price
        )) as montant_marge_total,
        SUM(s.quantity * (
          s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)
        )) as montant_ca_ht
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
      GROUP BY ip.code_13_ref_id
      HAVING SUM(s.quantity) > 0
    ),
    product_purchases AS (
      SELECT 
        ip.code_13_ref_id,
        SUM(po.qte_r) as quantity_bought
      FROM data_productorder po
      INNER JOIN data_order o ON po.order_id = o.id
      INNER JOIN data_internalproduct ip ON po.product_id = ip.id
      WHERE o.delivery_date >= $1::date
        AND o.delivery_date <= $2::date
        AND o.delivery_date IS NOT NULL
        AND po.qte_r > 0
        ${productFilter}
        ${finalPharmacyFilter}
      GROUP BY ip.code_13_ref_id
    ),
    selection_totals AS (
      SELECT 
        SUM(ps.quantite_vendue) as total_quantite,
        SUM(ps.montant_marge_total) as total_marge
      FROM product_sales ps
    )
    SELECT 
      ps.product_name as nom,
      ps.code_13_ref_id as code_ean,
      ps.bcb_lab,
      COALESCE(pp.quantity_bought, 0) as quantity_bought,
      ps.quantite_vendue,
      ps.prix_achat_moyen,
      ps.prix_vente_moyen,
      CASE 
        WHEN ps.montant_ca_ht > 0 
        THEN (ps.montant_marge_total / ps.montant_ca_ht) * 100
        ELSE 0
      END as taux_marge_moyen,
      CASE 
        WHEN st.total_quantite > 0 
        THEN (ps.quantite_vendue * 100.0 / st.total_quantite)
        ELSE 0 
      END as part_marche_quantite_pct,
      CASE 
        WHEN st.total_marge > 0 
        THEN (ps.montant_marge_total * 100.0 / st.total_marge)
        ELSE 0 
      END as part_marche_marge_pct,
      ps.montant_ventes_ttc,
      ps.montant_marge_total,
      ps.montant_ca_ht
    FROM product_sales ps
    CROSS JOIN selection_totals st
    LEFT JOIN product_purchases pp ON ps.code_13_ref_id = pp.code_13_ref_id
    ORDER BY ps.quantite_vendue DESC
  `;

  return await db.query(query, params);
}

async function executeExportUserQuery(
  dateRange: { start: string; end: string },
  productCodes: string[],
  pharmacyId: string,
  hasProductFilter: boolean = true
): Promise<SalesProductExportRow[]> {
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
        MIN(ip.name) as product_name,
        MIN(gp.bcb_lab) as bcb_lab,
        SUM(s.quantity) as quantite_vendue,
        AVG(s.unit_price_ttc) as prix_vente_moyen,
        AVG(ins.weighted_average_price) as prix_achat_moyen,
        SUM(s.quantity * s.unit_price_ttc) as montant_ventes_ttc,
        SUM(s.quantity * (
          (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)) 
          - ins.weighted_average_price
        )) as montant_marge_total,
        SUM(s.quantity * (
          s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)
        )) as montant_ca_ht
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
      GROUP BY ip.code_13_ref_id
      HAVING SUM(s.quantity) > 0
    ),
    product_purchases AS (
      SELECT 
        ip.code_13_ref_id,
        SUM(po.qte_r) as quantity_bought
      FROM data_productorder po
      INNER JOIN data_order o ON po.order_id = o.id
      INNER JOIN data_internalproduct ip ON po.product_id = ip.id
      WHERE o.delivery_date >= $1::date
        AND o.delivery_date <= $2::date
        AND o.delivery_date IS NOT NULL
        AND po.qte_r > 0
        AND ip.pharmacy_id = ${pharmacyParam}
        ${productFilter}
      GROUP BY ip.code_13_ref_id
    ),
    selection_totals AS (
      SELECT 
        SUM(ps.quantite_vendue) as total_quantite,
        SUM(ps.montant_marge_total) as total_marge
      FROM product_sales ps
    )
    SELECT 
      ps.product_name as nom,
      ps.code_13_ref_id as code_ean,
      ps.bcb_lab,
      COALESCE(pp.quantity_bought, 0) as quantity_bought,
      ps.quantite_vendue,
      ps.prix_achat_moyen,
      ps.prix_vente_moyen,
      CASE 
        WHEN ps.montant_ca_ht > 0 
        THEN (ps.montant_marge_total / ps.montant_ca_ht) * 100
        ELSE 0
      END as taux_marge_moyen,
      CASE 
        WHEN st.total_quantite > 0 
        THEN (ps.quantite_vendue * 100.0 / st.total_quantite)
        ELSE 0 
      END as part_marche_quantite_pct,
      CASE 
        WHEN st.total_marge > 0 
        THEN (ps.montant_marge_total * 100.0 / st.total_marge)
        ELSE 0 
      END as part_marche_marge_pct,
      ps.montant_ventes_ttc,
      ps.montant_marge_total,
      ps.montant_ca_ht
    FROM product_sales ps
    CROSS JOIN selection_totals st
    LEFT JOIN product_purchases pp ON ps.code_13_ref_id = pp.code_13_ref_id
    ORDER BY ps.quantite_vendue DESC
  `;

  return await db.query(query, params);
}