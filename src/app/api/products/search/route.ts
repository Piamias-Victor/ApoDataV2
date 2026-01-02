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
        const productsWithAllCodes = await withCache<Product[]>(cacheKey, async () => {
            // Updated query to fetch all codes in one go
            // We need to modify the base query or do a second query for ALL ids at once, 
            // but the cleanest is to aggregate in the main query if possible, 
            // OR fetch main results -> get IDs -> fetch all codes for these IDs in one IN query.

            // Let's use the IN approach as it's safer with existing complex queries
            const result = await query(queryConfig.text, queryConfig.params);

            if (result.rows.length === 0) return [];

            const bcbIds = result.rows
                .map((row: any) => row.bcb_product_id)
                .filter((id: any) => id !== null); // Ensure no nulls

            if (bcbIds.length === 0) {
                return result.rows.map((row: any) => ({
                    code_13_ref: row.code_13_ref,
                    name: row.name,
                    brand_lab: row.brand_lab,
                    universe: row.universe,
                    bcb_product_id: row.bcb_product_id,
                    all_codes: [row.code_13_ref]
                }));
            }

            // Fetch all codes for these BCB IDs in ONE query
            const codesResult = await query(
                `SELECT bcb_product_id, code_13_ref 
                 FROM data_globalproduct 
                 WHERE bcb_product_id = ANY($1::int[])`,
                [bcbIds]
            );

            const codesMap = new Map<number, string[]>();
            codesResult.rows.forEach((row: any) => {
                const id = row.bcb_product_id;
                if (!codesMap.has(id)) {
                    codesMap.set(id, []);
                }
                codesMap.get(id)?.push(row.code_13_ref);
            });

            return result.rows.map((row: any) => ({
                code_13_ref: row.code_13_ref,
                name: row.name,
                brand_lab: row.brand_lab,
                universe: row.universe,
                bcb_product_id: row.bcb_product_id,
                // Fallback to current code if no mapping found (shouldn't happen)
                all_codes: codesMap.get(row.bcb_product_id) || [row.code_13_ref]
            }));
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
