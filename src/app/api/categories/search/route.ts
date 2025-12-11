import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getAdminCategoryQuery, getUserCategoryQuery } from '@/lib/search/categoryQueries';
import { queryCache, withCache } from '@/lib/cache/queryCache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CategoryResult {
    readonly category_name: string;
    readonly category_type: 'bcb_segment_l0' | 'bcb_segment_l1' | 'bcb_segment_l2' | 'bcb_segment_l3' | 'bcb_segment_l4' | 'bcb_segment_l5' | 'bcb_family';
    readonly product_count: number;
    readonly product_codes: string[];
}

interface SearchParams {
    readonly query: string;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query }: SearchParams = await request.json();

        // Validation minimale
        if (!query && query !== '') {
            return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
        }

        const trimmedQuery = query ? query.trim() : '';
        const isAdmin = session.user.role === 'admin';
        const isDefaultFetch = trimmedQuery.length < 2;

        let sqlQuery: string = '';
        let params: any[] = [];

        if (isAdmin) {
            sqlQuery = getAdminCategoryQuery(isDefaultFetch);
            params = [`%${trimmedQuery}%`];
        } else {
            if (!session.user.pharmacyId) return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });

            sqlQuery = getUserCategoryQuery(isDefaultFetch);
            params = [session.user.pharmacyId, `%${trimmedQuery}%`];
        }

        const startTime = Date.now();

        const cacheKey = queryCache.generateKey('search:categories', {
            query: trimmedQuery,
            pharmacyId: session.user.pharmacyId,
            isAdmin
        });

        const categories = await withCache(cacheKey, () => db.query<CategoryResult>(sqlQuery, params));

        const queryTime = Date.now() - startTime;

        return NextResponse.json({
            categories: categories.rows,
            count: categories.rowCount,
            queryTime
        });

    } catch (error) {
        console.error('Erreur recherche catégories:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
