// src/app/api/products/by-tva/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

interface TvaRequest {
    tvaRates: number[];
}

interface Product {
    code_13_ref: string;
    name: string;
    brand_lab: string | null;
    universe: string | null;
    bcb_product_id: string;
    all_codes: string[];
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: TvaRequest = await request.json();
        const { tvaRates } = body;

        if (!tvaRates || tvaRates.length === 0) {
            return NextResponse.json({ products: [], count: 0 });
        }

        console.log('[Products by TVA] Request:', { tvaRates });

        // Get products with specified TVA rates, grouped by bcb_product_id
        const placeholders = tvaRates.map((_, i) => `$${i + 1}`).join(', ');

        const result = await query(
            `
            WITH ranked_products AS (
                SELECT 
                    code_13_ref,
                    name,
                    brand_lab,
                    bcb_segment_l0 as universe,
                    bcb_product_id,
                    LENGTH(code_13_ref) as code_length,
                    ROW_NUMBER() OVER (
                        PARTITION BY bcb_product_id 
                        ORDER BY LENGTH(code_13_ref) DESC, code_13_ref DESC
                    ) as rn
                FROM data_globalproduct
                WHERE bcb_tva_rate IN (${placeholders})
                  AND bcb_product_id IS NOT NULL
            )
            SELECT 
                code_13_ref,
                name,
                brand_lab,
                universe,
                bcb_product_id
            FROM ranked_products
            WHERE rn = 1
            ORDER BY name ASC
            `,
            tvaRates
        );

        console.log('[Products by TVA] Found:', result.rows.length, 'products');

        // Fetch all codes for all bcb_product_ids in a single query
        const bcbProductIds = result.rows.map((row: any) => row.bcb_product_id);

        const allCodesResult = await query(
            `
            SELECT bcb_product_id, code_13_ref
            FROM data_globalproduct
            WHERE bcb_product_id = ANY($1::integer[])
            ORDER BY bcb_product_id, code_13_ref
            `,
            [bcbProductIds]
        );

        // Group codes by bcb_product_id
        const codesByProductId: Record<number, string[]> = {};
        allCodesResult.rows.forEach((row: any) => {
            if (!codesByProductId[row.bcb_product_id]) {
                codesByProductId[row.bcb_product_id] = [];
            }
            codesByProductId[row.bcb_product_id]!.push(row.code_13_ref);
        });

        // Build final products array
        const productsWithAllCodes: Product[] = result.rows.map((row: any) => ({
            code_13_ref: row.code_13_ref,
            name: row.name,
            brand_lab: row.brand_lab,
            universe: row.universe,
            bcb_product_id: row.bcb_product_id,
            all_codes: codesByProductId[row.bcb_product_id] || []
        }));

        console.log('[Products by TVA] Returning:', productsWithAllCodes.length, 'products');

        return NextResponse.json({
            products: productsWithAllCodes,
            count: productsWithAllCodes.length
        });

    } catch (error) {
        console.error('Error fetching products by TVA:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
