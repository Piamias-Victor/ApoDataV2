// src/app/api/declaration-bri/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSecurityContext, enforcePharmacySecurity } from '@/lib/api-security';
import { db } from '@/lib/db';
import { ExcelExporter } from '@/utils/export/excelExporter';
import type { BriExportFilters, PharmacyTotal, ProductTotal, ProductPharmacyDetail } from '@/types/declaration-bri';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();

    try {
        console.log('📊 [API BRI Export] Request started');

        // Vérification de sécurité
        const context = await getSecurityContext();
        if (!context) {
            console.log('❌ [API BRI Export] Unauthorized');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🔐 [API BRI Export] Security context:', {
            userId: context.userId,
            role: context.userRole,
            isAdmin: context.isAdmin,
            pharmacyId: context.pharmacyId
        });

        // Récupération des filtres
        let body: BriExportFilters;
        try {
            body = await request.json();
            console.log('📥 [API BRI Export] Request body:', {
                dateRange: body.analysisDateRange,
                pharmacyIds: body.pharmacyIds?.length || 0,
                productCodes: body.productCodes?.length || 0
            });
        } catch (jsonError) {
            console.log('💥 [API BRI Export] JSON parsing error:', jsonError);
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        if (!body.analysisDateRange?.start || !body.analysisDateRange?.end) {
            console.log('❌ [API BRI Export] Missing date range');
            return NextResponse.json({ error: 'Date range required' }, { status: 400 });
        }

        // Application de la sécurité pharmacie
        const secureFilters = enforcePharmacySecurity({
            dateRange: body.analysisDateRange,
            pharmacy: body.pharmacyIds || []
        }, context);

        console.log('🛡️ [API BRI Export] Secure filters applied:', secureFilters);

        // Récupération des données
        const [pharmacyTotals, productTotals, productDetails] = await Promise.all([
            fetchPharmacyTotals(body, secureFilters.pharmacy, context.isAdmin, context.pharmacyId ?? undefined),
            fetchProductTotals(body, secureFilters.pharmacy, context.isAdmin, context.pharmacyId ?? undefined),
            fetchProductPharmacyDetails(body, secureFilters.pharmacy, context.isAdmin, context.pharmacyId ?? undefined)
        ]);

        console.log('📦 [API BRI Export] Data fetched:', {
            pharmacies: pharmacyTotals.length,
            products: productTotals.length,
            details: productDetails.size,
            queryTime: Date.now() - startTime
        });

        // Génération du fichier Excel
        const exporter = new ExcelExporter();

        // Feuille 1: Total par pharmacie
        exporter.addSheet(
            'Total',
            ['Nom Pharmacie', 'IDNAT', 'Qté Vendues'],
            pharmacyTotals.map(p => ({
                'Nom Pharmacie': p.pharmacy_name,
                'IDNAT': p.id_nat,
                'Qté Vendues': p.total_quantity_sold
            }))
        );

        // Feuille 2: Total par produit
        exporter.addSheet(
            'Produit',
            ['Code EAN 13', 'Nom Produit', 'Laboratoire', 'Qté Vendue'],
            productTotals.map(p => ({
                'Code EAN 13': p.code_ean,
                'Nom Produit': p.product_name,
                'Laboratoire': p.laboratory || '-',
                'Qté Vendue': p.total_quantity_sold
            }))
        );

        // Feuilles individuelles par produit
        productDetails.forEach((details, codeEan) => {
            // Vérifier que le code EAN n'est pas null
            if (!codeEan) {
                console.warn('⚠️ [API BRI Export] Skipping product with null code_ean');
                return;
            }

            // Nom de la feuille = code EAN (limité à 31 caractères pour Excel)
            const sheetName = codeEan.substring(0, 31);

            exporter.addSheet(
                sheetName,
                ['Nom Pharmacie', 'IDNAT', 'Qté Vendue'],
                details.map(d => ({
                    'Nom Pharmacie': d.pharmacy_name,
                    'IDNAT': d.id_nat,
                    'Qté Vendue': d.quantity_sold
                }))
            );
        });

        // Génération du buffer Excel
        const buffer = await exporter.generateBuffer();

        // Génération du nom de fichier
        const filename = ExcelExporter.generateFilename('declaration_bri');

        console.log('✅ [API BRI Export] Excel generated:', {
            filename,
            sizeKb: Math.round(buffer.byteLength / 1024),
            totalTime: Date.now() - startTime
        });

        // Retour du fichier
        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=${filename}`,
                'Content-Length': buffer.byteLength.toString()
            }
        });

    } catch (error) {
        console.error('💥 [API BRI Export] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', queryTime: Date.now() - startTime },
            { status: 500 }
        );
    }
}

/**
 * Récupère les totaux par pharmacie
 */
async function fetchPharmacyTotals(
    filters: BriExportFilters,
    pharmacyIds: string[] | undefined,
    isAdmin: boolean,
    userPharmacyId?: string
): Promise<PharmacyTotal[]> {
    const productCodes = filters.productCodes || [];
    const hasProductFilter = productCodes.length > 0;

    const productFilter = hasProductFilter
        ? 'AND ip.code_13_ref_id = ANY($3::text[])'
        : '';

    let params: any[];
    let pharmacyFilter = '';

    if (isAdmin) {
        if (pharmacyIds && pharmacyIds.length > 0) {
            pharmacyFilter = hasProductFilter
                ? 'AND p.id = ANY($4::uuid[])'
                : 'AND p.id = ANY($3::uuid[])';
            params = hasProductFilter
                ? [filters.analysisDateRange.start, filters.analysisDateRange.end, productCodes, pharmacyIds]
                : [filters.analysisDateRange.start, filters.analysisDateRange.end, pharmacyIds];
        } else {
            params = hasProductFilter
                ? [filters.analysisDateRange.start, filters.analysisDateRange.end, productCodes]
                : [filters.analysisDateRange.start, filters.analysisDateRange.end];
        }
    } else {
        pharmacyFilter = hasProductFilter
            ? 'AND p.id = $4::uuid'
            : 'AND p.id = $3::uuid';
        params = hasProductFilter
            ? [filters.analysisDateRange.start, filters.analysisDateRange.end, productCodes, userPharmacyId]
            : [filters.analysisDateRange.start, filters.analysisDateRange.end, userPharmacyId];
    }

    const query = `
    SELECT 
      p.name as pharmacy_name,
      p.id_nat,
      COALESCE(SUM(s.quantity), 0) as total_quantity_sold
    FROM data_pharmacy p
    LEFT JOIN data_internalproduct ip ON ip.pharmacy_id = p.id
    LEFT JOIN data_inventorysnapshot ins ON ins.product_id = ip.id
    LEFT JOIN data_sales s ON s.product_id = ins.id
      AND s.date >= $1::date 
      AND s.date <= $2::date
    WHERE 1=1
      ${productFilter}
      ${pharmacyFilter}
    GROUP BY p.id, p.name, p.id_nat
    ORDER BY p.name
  `;

    return await db.query(query, params);
}

/**
 * Récupère les totaux par produit
 */
async function fetchProductTotals(
    filters: BriExportFilters,
    pharmacyIds: string[] | undefined,
    isAdmin: boolean,
    userPharmacyId?: string
): Promise<ProductTotal[]> {
    const productCodes = filters.productCodes || [];
    const hasProductFilter = productCodes.length > 0;

    const productFilter = hasProductFilter
        ? 'AND ip.code_13_ref_id = ANY($3::text[])'
        : '';

    let params: any[];
    let pharmacyFilter = '';

    if (isAdmin) {
        if (pharmacyIds && pharmacyIds.length > 0) {
            pharmacyFilter = hasProductFilter
                ? 'AND ip.pharmacy_id = ANY($4::uuid[])'
                : 'AND ip.pharmacy_id = ANY($3::uuid[])';
            params = hasProductFilter
                ? [filters.analysisDateRange.start, filters.analysisDateRange.end, productCodes, pharmacyIds]
                : [filters.analysisDateRange.start, filters.analysisDateRange.end, pharmacyIds];
        } else {
            params = hasProductFilter
                ? [filters.analysisDateRange.start, filters.analysisDateRange.end, productCodes]
                : [filters.analysisDateRange.start, filters.analysisDateRange.end];
        }
    } else {
        pharmacyFilter = hasProductFilter
            ? 'AND ip.pharmacy_id = $4::uuid'
            : 'AND ip.pharmacy_id = $3::uuid';
        params = hasProductFilter
            ? [filters.analysisDateRange.start, filters.analysisDateRange.end, productCodes, userPharmacyId]
            : [filters.analysisDateRange.start, filters.analysisDateRange.end, userPharmacyId];
    }

    const query = `
    SELECT 
      gp.code_13_ref as code_ean,
      gp.name as product_name,
      gp.bcb_lab as laboratory,
      COALESCE(SUM(s.quantity), 0) as total_quantity_sold
    FROM data_globalproduct gp
    LEFT JOIN data_internalproduct ip ON ip.code_13_ref_id = gp.code_13_ref
    LEFT JOIN data_inventorysnapshot ins ON ins.product_id = ip.id
    LEFT JOIN data_sales s ON s.product_id = ins.id
      AND s.date >= $1::date 
      AND s.date <= $2::date
    WHERE 1=1
      ${productFilter}
      ${pharmacyFilter}
    GROUP BY gp.code_13_ref, gp.name, gp.bcb_lab
    HAVING COALESCE(SUM(s.quantity), 0) > 0
    ORDER BY total_quantity_sold DESC
  `;

    return await db.query(query, params);
}

/**
 * Récupère les détails par produit et pharmacie
 */
async function fetchProductPharmacyDetails(
    filters: BriExportFilters,
    pharmacyIds: string[] | undefined,
    isAdmin: boolean,
    userPharmacyId?: string
): Promise<Map<string, ProductPharmacyDetail[]>> {
    const productCodes = filters.productCodes || [];
    const hasProductFilter = productCodes.length > 0;

    const productFilter = hasProductFilter
        ? 'AND ip.code_13_ref_id = ANY($3::text[])'
        : '';

    let params: any[];
    let pharmacyFilter = '';

    if (isAdmin) {
        if (pharmacyIds && pharmacyIds.length > 0) {
            pharmacyFilter = hasProductFilter
                ? 'AND p.id = ANY($4::uuid[])'
                : 'AND p.id = ANY($3::uuid[])';
            params = hasProductFilter
                ? [filters.analysisDateRange.start, filters.analysisDateRange.end, productCodes, pharmacyIds]
                : [filters.analysisDateRange.start, filters.analysisDateRange.end, pharmacyIds];
        } else {
            params = hasProductFilter
                ? [filters.analysisDateRange.start, filters.analysisDateRange.end, productCodes]
                : [filters.analysisDateRange.start, filters.analysisDateRange.end];
        }
    } else {
        pharmacyFilter = hasProductFilter
            ? 'AND p.id = $4::uuid'
            : 'AND p.id = $3::uuid';
        params = hasProductFilter
            ? [filters.analysisDateRange.start, filters.analysisDateRange.end, productCodes, userPharmacyId]
            : [filters.analysisDateRange.start, filters.analysisDateRange.end, userPharmacyId];
    }

    const query = `
    SELECT 
      ip.code_13_ref_id as code_ean,
      p.name as pharmacy_name,
      p.id_nat,
      COALESCE(SUM(s.quantity), 0) as quantity_sold
    FROM data_internalproduct ip
    INNER JOIN data_pharmacy p ON p.id = ip.pharmacy_id
    LEFT JOIN data_inventorysnapshot ins ON ins.product_id = ip.id
    LEFT JOIN data_sales s ON s.product_id = ins.id
      AND s.date >= $1::date 
      AND s.date <= $2::date
    WHERE 1=1
      ${productFilter}
      ${pharmacyFilter}
    GROUP BY ip.code_13_ref_id, p.name, p.id_nat
    HAVING COALESCE(SUM(s.quantity), 0) > 0
    ORDER BY ip.code_13_ref_id, p.name
  `;

    const rows = await db.query<ProductPharmacyDetail & { code_ean: string }>(query, params);

    // Grouper par code EAN
    const detailsMap = new Map<string, ProductPharmacyDetail[]>();

    rows.forEach(row => {
        const { code_ean, pharmacy_name, id_nat, quantity_sold } = row;

        if (!detailsMap.has(code_ean)) {
            detailsMap.set(code_ean, []);
        }

        detailsMap.get(code_ean)!.push({
            pharmacy_name,
            id_nat,
            quantity_sold
        });
    });

    return detailsMap;
}
