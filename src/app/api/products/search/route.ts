// src/app/api/products/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getAdminProductQuery } from '@/lib/search/productQueries';
import { queryCache, withCache } from '@/lib/cache/queryCache';

interface SearchRequest {
    query: string;
}

interface Product {
    code_13_ref: string;
    name: string;
    brand_lab: string | null;
    universe: string | null;
    bcb_product_id: string;
    all_codes: string[]; // All codes with same bcb_product_id
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: SearchRequest = await request.json();
        const searchQuery = body.query?.trim() || '';

        // Determine search mode
        const isWildcard = searchQuery.startsWith('*');
        const isCodeSearch = /^\d+$/.test(searchQuery); // Only numbers = code search

        console.log('[Products API] Request:', {
            searchQuery,
            isWildcard,
            isCodeSearch,
            userRole: session.user.role
        });

        // All authenticated users can search all products
        const queryConfig = getAdminProductQuery(searchQuery, isWildcard, isCodeSearch);

        const startTime = Date.now();

        const cacheKey = queryCache.generateKey('search:products', {
            query: searchQuery,
            isWildcard,
            isCodeSearch,
            pharmacyId: session.user.pharmacyId,
            isAdmin: session.user.role === 'admin'
        });

        // Cache the entire result processing
        const productsWithAllCodes = await withCache(cacheKey, async () => {
            const result = await query(queryConfig.text, queryConfig.params);

            // For each product, fetch all codes with the same bcb_product_id
            return await Promise.all(
                result.rows.map(async (row: any) => {
                    const allCodesResult = await query(
                        `SELECT code_13_ref FROM data_globalproduct WHERE bcb_product_id = $1`,
                        [row.bcb_product_id]
                    );

                    return {
                        code_13_ref: row.code_13_ref,
                        name: row.name,
                        brand_lab: row.brand_lab,
                        universe: row.universe,
                        bcb_product_id: row.bcb_product_id,
                        all_codes: allCodesResult.rows.map((r: any) => r.code_13_ref)
                    };
                })
            );
        });

        const duration = Date.now() - startTime;

        console.log('Executed query', {
            text: queryConfig.text,
            duration,
            rows: productsWithAllCodes.length
        });

        return NextResponse.json({
            products: productsWithAllCodes,
            count: productsWithAllCodes.length
        });

    } catch (error) {
        console.error('Error in products search:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
