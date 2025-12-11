// src/app/api/products/by-filters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

interface FilterRequest {
    tvaRates?: number[];
    reimbursementStatus?: 'ALL' | 'REIMBURSED' | 'NOT_REIMBURSED';
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

        const body: FilterRequest = await request.json();
        const { tvaRates, reimbursementStatus } = body;

        console.log('[Products by Filters] Request:', { tvaRates, reimbursementStatus });

        // Build WHERE clauses
        const whereClauses: string[] = ['bcb_product_id IS NOT NULL'];
        const queryParams: any[] = [];
        let paramIndex = 1;

        // TVA filter
        if (tvaRates && tvaRates.length > 0) {
            const placeholders = tvaRates.map(() => `$${paramIndex++}`).join(', ');
            whereClauses.push(`bcb_tva_rate IN (${placeholders})`);
            queryParams.push(...tvaRates);
        }

        // Reimbursement filter
        if (reimbursementStatus && reimbursementStatus !== 'ALL') {
            if (reimbursementStatus === 'REIMBURSED') {
                whereClauses.push('is_reimbursable = true');
            } else if (reimbursementStatus === 'NOT_REIMBURSED') {
                whereClauses.push('(is_reimbursable = false OR is_reimbursable IS NULL)');
            }
        }

        // If no filters applied, return empty result
        if (whereClauses.length === 1) {
            return NextResponse.json({ products: [], count: 0 });
        }

        const whereClause = whereClauses.join(' AND ');

        console.log('[Products by Filters] WHERE clause:', whereClause);
        console.log('[Products by Filters] Query params:', queryParams);

        // Get products with filters, grouped by bcb_product_id
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
                WHERE ${whereClause}
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
            queryParams
        );

        console.log('[Products by Filters] Found:', result.rows.length, 'products');

        // Fetch all codes for all bcb_product_ids in a single query
        const bcbProductIds = result.rows.map((row: any) => row.bcb_product_id);

        if (bcbProductIds.length === 0) {
            return NextResponse.json({ products: [], count: 0 });
        }

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

        console.log('[Products by Filters] Returning:', productsWithAllCodes.length, 'products');

        return NextResponse.json({
            products: productsWithAllCodes,
            count: productsWithAllCodes.length
        });

    } catch (error) {
        console.error('Error fetching products by filters:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
