// src/app/api/filters/apply-tva/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RequestBody {
    readonly productCodes: string[] | null; // null = TOUS les produits
    readonly tvaRates: number[];
    readonly productType?: 'ALL' | 'MEDICAMENT' | 'PARAPHARMACIE';
    readonly dateRange: { start: string; end: string };
    readonly pharmacyId?: string | null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        console.log('');
        console.log('🚀 [apply-tva API] ========================================');
        console.log('🚀 [apply-tva API] NEW REQUEST');

        const session = await getServerSession(authOptions);
        if (!session?.user) {
            console.log('❌ [apply-tva API] Unauthorized');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: RequestBody = await request.json();
        const { productCodes, tvaRates, productType = 'ALL', dateRange, pharmacyId } = body;

        console.log('📊 [apply-tva API] Request params:', {
            productCodes: productCodes ? productCodes.length : 'ALL (filters only)',
            tvaRates,
            productType,
            dateRange,
            pharmacyId: pharmacyId || 'none',
            user: session.user.email,
            role: session.user.role
        });

        // Validation
        if (!dateRange?.start || !dateRange?.end) {
            console.log('❌ [apply-tva API] Missing dateRange');
            return NextResponse.json({ error: 'Date range required' }, { status: 400 });
        }

        const hasTvaFilter = tvaRates && tvaRates.length > 0;
        const hasProductTypeFilter = productType !== 'ALL';
        const isFiltersOnly = !productCodes || productCodes.length === 0;

        if (isFiltersOnly) {
            // Mode FILTERS ONLY : pas de sélection de codes, juste des filtres
            if (!hasTvaFilter && !hasProductTypeFilter) {
                console.log('ℹ️ [apply-tva API] No filters and no codes, returning empty');
                return NextResponse.json({ productCodes: [] });
            }
            console.log('🌍 [apply-tva API] FILTERS ONLY MODE - fetching ALL products with filters');
        }

        const isAdmin = session.user.role === 'admin';
        const effectivePharmacyId = pharmacyId || session.user.pharmacyId;

        // Construction du filtre TVA
        const tvaFilterSQL = hasTvaFilter
            ? `AND tva_percentage = ANY(ARRAY[${tvaRates.join(', ')}])`
            : '';

        // Construction du filtre type de produit
        let productTypeFilterSQL = '';
        if (productType === 'MEDICAMENT') {
            productTypeFilterSQL = "AND dgp.code_13_ref LIKE '34009%'";
        } else if (productType === 'PARAPHARMACIE') {
            productTypeFilterSQL = "AND dgp.code_13_ref NOT LIKE '34009%'";
        }

        console.log('🔍 [apply-tva API] Filters SQL:', {
            tva: tvaFilterSQL || 'NONE',
            productType: productTypeFilterSQL || 'NONE'
        });

        let query: string;
        let params: any[];

        if (isAdmin && !pharmacyId) {
            // MODE ADMIN (toutes pharmacies)
            if (isFiltersOnly) {
                // FILTERS ONLY : récupérer TOUS les produits avec les filtres
                console.log('🌍 [apply-tva API] ADMIN - FILTERS ONLY MODE');

                query = `
          SELECT DISTINCT dgp.code_13_ref
          FROM data_productorder po
          JOIN data_order o ON po.order_id = o.id
          JOIN data_internalproduct ip ON po.product_id = ip.id
          JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
          WHERE o.delivery_date >= $1::date 
            AND o.delivery_date <= $2::date
            AND o.delivery_date IS NOT NULL
            AND po.qte_r > 0
            ${tvaFilterSQL}
            ${productTypeFilterSQL}
        `;

                params = [dateRange.start, dateRange.end];

            } else {
                // MODE SÉLECTION
                console.log(`🎯 [apply-tva API] ADMIN - SELECTION MODE (${productCodes!.length} codes)`);

                query = `
          SELECT DISTINCT dgp.code_13_ref
          FROM data_productorder po
          JOIN data_order o ON po.order_id = o.id
          JOIN data_internalproduct ip ON po.product_id = ip.id
          JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
          WHERE o.delivery_date >= $1::date 
            AND o.delivery_date <= $2::date
            AND o.delivery_date IS NOT NULL
            AND po.qte_r > 0
            AND ip.code_13_ref_id = ANY($3::text[])
            ${tvaFilterSQL}
            ${productTypeFilterSQL}
        `;

                params = [dateRange.start, dateRange.end, productCodes];
            }

        } else {
            // MODE NON-ADMIN (filtre pharmacy obligatoire)
            if (!effectivePharmacyId) {
                console.log('❌ [apply-tva API] Non-admin without pharmacyId');
                return NextResponse.json({ error: 'Pharmacy ID required' }, { status: 400 });
            }

            if (isFiltersOnly) {
                // FILTERS ONLY : récupérer TOUS les produits avec les filtres pour cette pharmacie
                console.log('🏪 [apply-tva API] PHARMACY - FILTERS ONLY MODE:', effectivePharmacyId);

                query = `
          SELECT DISTINCT dgp.code_13_ref
          FROM data_productorder po
          JOIN data_order o ON po.order_id = o.id
          JOIN data_internalproduct ip ON po.product_id = ip.id
          JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
          WHERE o.delivery_date >= $1::date 
            AND o.delivery_date <= $2::date
            AND o.delivery_date IS NOT NULL
            AND po.qte_r > 0
            AND ip.pharmacy_id = $3::uuid
            ${tvaFilterSQL}
            ${productTypeFilterSQL}
        `;

                params = [dateRange.start, dateRange.end, effectivePharmacyId];

            } else {
                // MODE SÉLECTION
                console.log(`🏪 [apply-tva API] PHARMACY - SELECTION MODE (${productCodes!.length} codes):`, effectivePharmacyId);

                query = `
          SELECT DISTINCT dgp.code_13_ref
          FROM data_productorder po
          JOIN data_order o ON po.order_id = o.id
          JOIN data_internalproduct ip ON po.product_id = ip.id
          JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
          WHERE o.delivery_date >= $1::date 
            AND o.delivery_date <= $2::date
            AND o.delivery_date IS NOT NULL
            AND po.qte_r > 0
            AND ip.pharmacy_id = $3::uuid
            AND ip.code_13_ref_id = ANY($4::text[])
            ${tvaFilterSQL}
            ${productTypeFilterSQL}
        `;

                params = [dateRange.start, dateRange.end, effectivePharmacyId, productCodes];
            }
        }

        console.log('🔄 [apply-tva API] Executing query...');
        const startTime = Date.now();

        const result = await db.query<{ code_13_ref: string }>(query, params);

        const duration = Date.now() - startTime;
        const filteredCodes = result.map(row => row.code_13_ref);

        console.log('✅ [apply-tva API] Query success:', {
            duration: `${duration}ms`,
            inputCodes: productCodes ? productCodes.length : 'ALL',
            outputCodes: filteredCodes.length,
            filtered: productCodes ? productCodes.length - filteredCodes.length : 'N/A',
            tvaRates,
            productType
        });
        console.log('🚀 [apply-tva API] ========================================');
        console.log('');

        return NextResponse.json({
            productCodes: filteredCodes
        });

    } catch (error) {
        console.error('❌ [apply-tva API] ERROR:', error);
        console.log('🚀 [apply-tva API] ========================================');
        console.log('');
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
