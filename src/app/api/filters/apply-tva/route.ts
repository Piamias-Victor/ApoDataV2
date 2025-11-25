// src/app/api/filters/apply-tva/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RequestBody {
    readonly productCodes: string[];
    readonly tvaRates: number[];
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
        const { productCodes, tvaRates, dateRange, pharmacyId } = body;

        console.log('📊 [apply-tva API] Request params:', {
            productCodes: productCodes.length,
            tvaRates,
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

        if (!productCodes || productCodes.length === 0) {
            console.log('❌ [apply-tva API] Missing productCodes');
            return NextResponse.json({ error: 'Product codes required' }, { status: 400 });
        }

        if (!tvaRates || tvaRates.length === 0) {
            console.log('ℹ️ [apply-tva API] No TVA rates specified, returning all codes');
            return NextResponse.json({ productCodes });
        }

        const isAdmin = session.user.role === 'admin';
        const effectivePharmacyId = pharmacyId || session.user.pharmacyId;

        // Construction du filtre TVA
        const tvaFilterSQL = `AND tva_percentage = ANY(ARRAY[${tvaRates.join(', ')}])`;

        console.log('🔍 [apply-tva API] TVA Filter SQL:', tvaFilterSQL);

        let query: string;
        let params: any[];

        if (isAdmin && !pharmacyId) {
            // MODE ADMIN (toutes pharmacies)
            console.log('🌍 [apply-tva API] ADMIN MODE - All pharmacies');

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
      `;

            params = [dateRange.start, dateRange.end, productCodes];

        } else {
            // MODE NON-ADMIN ou ADMIN avec pharmacyId spécifique
            if (!effectivePharmacyId) {
                console.log('❌ [apply-tva API] Non-admin without pharmacyId');
                return NextResponse.json({ error: 'Pharmacy ID required' }, { status: 400 });
            }

            console.log('🏪 [apply-tva API] PHARMACY MODE:', effectivePharmacyId);

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
      `;

            params = [dateRange.start, dateRange.end, effectivePharmacyId, productCodes];
        }

        console.log('🔄 [apply-tva API] Executing query...');
        const startTime = Date.now();

        const result = await db.query<{ code_13_ref: string }>(query, params);

        const duration = Date.now() - startTime;
        const filteredCodes = result.map(row => row.code_13_ref);

        console.log('✅ [apply-tva API] Query success:', {
            duration: `${duration}ms`,
            inputCodes: productCodes.length,
            outputCodes: filteredCodes.length,
            filtered: productCodes.length - filteredCodes.length,
            tvaRates
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
