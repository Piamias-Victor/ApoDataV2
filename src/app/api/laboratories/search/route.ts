// src/app/api/laboratories/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import {
    getAdminLaboratoryQuery,
    getUserLaboratoryQuery,
    getAdminProductSearchQuery,
    getUserProductSearchQuery
} from '@/lib/search/laboratoryQueries';
import { queryCache, withCache } from '@/lib/cache/queryCache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LaboratoryResult {
    readonly laboratory_name: string;
    readonly product_count: number;
    readonly product_codes: string[];
    readonly matching_products?: Array<{
        readonly name: string;
        readonly code_13_ref: string;
    }>;
    readonly source_type?: 'laboratory' | 'brand';
}

interface SearchParams {
    readonly query: string;
    readonly mode: 'laboratory' | 'product';
    readonly labOrBrandMode: 'laboratory' | 'brand';
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query, mode, labOrBrandMode }: SearchParams = await request.json();

        // Basic Validation
        if (!mode || !['laboratory', 'product'].includes(mode)) {
            return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
        }
        if (!labOrBrandMode || !['laboratory', 'brand'].includes(labOrBrandMode)) {
            return NextResponse.json({ error: 'Invalid labOrBrandMode' }, { status: 400 });
        }

        const trimmedQuery = query ? query.trim() : '';
        const isAdmin = session.user.role === 'admin';
        const isDefaultFetch = trimmedQuery.length < 2;
        const columnName = labOrBrandMode === 'laboratory' ? 'bcb_lab' : 'bcb_brand';

        let sqlQuery: string = '';
        let params: any[] = [];

        // ----------------------------------------------------------------------
        // MODE 1: DIRECT LABORATORY SEARCH (Simple)
        // ----------------------------------------------------------------------
        if (mode === 'laboratory') {
            if (isAdmin) {
                sqlQuery = getAdminLaboratoryQuery(columnName, labOrBrandMode, isDefaultFetch);
                params = !isDefaultFetch ? [`%${trimmedQuery}%`] : [];
            } else {
                if (!session.user.pharmacyId) return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });

                sqlQuery = getUserLaboratoryQuery(columnName, labOrBrandMode, isDefaultFetch);
                params = !isDefaultFetch ? [session.user.pharmacyId, `%${trimmedQuery}%`] : [session.user.pharmacyId];
            }

            // ----------------------------------------------------------------------
            // MODE 2: PRODUCT SEARCH (Complex)
            // ----------------------------------------------------------------------
        } else {
            // If fetching default list in product mode, return empty for now (or top labs)
            if (isDefaultFetch) {
                return NextResponse.json({ laboratories: [], count: 0, queryTime: 0, mode, labOrBrandMode });
            }

            const isEndCodeSearch = trimmedQuery.startsWith('*') && /^\*\d+$/.test(trimmedQuery);
            const isStartCodeSearch = /^\d+$/.test(trimmedQuery);
            const isNameSearch = !isEndCodeSearch && !isStartCodeSearch;

            if (isAdmin) {
                if (isNameSearch) {
                    sqlQuery = getAdminProductSearchQuery(columnName, labOrBrandMode, 'NAME');
                    params = [`%${trimmedQuery}%`];
                } else if (isStartCodeSearch) {
                    sqlQuery = getAdminProductSearchQuery(columnName, labOrBrandMode, 'CODE_START');
                    params = [`${trimmedQuery}%`];
                } else if (isEndCodeSearch) {
                    const codeDigits = trimmedQuery.substring(1);
                    sqlQuery = getAdminProductSearchQuery(columnName, labOrBrandMode, 'CODE_END');
                    params = [`%${codeDigits}`];
                }
            } else {
                if (!session.user.pharmacyId) return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });

                if (isNameSearch) {
                    sqlQuery = getUserProductSearchQuery(columnName, labOrBrandMode, 'NAME');
                    params = [session.user.pharmacyId, `%${trimmedQuery}%`];
                } else if (isStartCodeSearch) {
                    sqlQuery = getUserProductSearchQuery(columnName, labOrBrandMode, 'CODE_START');
                    params = [session.user.pharmacyId, `${trimmedQuery}%`];
                }
            }
        }

        // Execute
        if (!sqlQuery) {
            return NextResponse.json({ laboratories: [] });
        }

        const startTime = Date.now();

        const cacheKey = queryCache.generateKey('search:laboratories', {
            query: trimmedQuery,
            mode,
            labOrBrandMode,
            pharmacyId: session.user.pharmacyId, // Important for user-specific results
            isAdmin
        });

        const laboratories = await withCache(cacheKey, () => db.query<LaboratoryResult>(sqlQuery, params));

        const queryTime = Date.now() - startTime;

        return NextResponse.json({
            laboratories: laboratories.rows,
            count: laboratories.rowCount,
            queryTime,
            mode,
            labOrBrandMode
        });

    } catch (error) {
        console.error('Erreur recherche laboratoires:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
