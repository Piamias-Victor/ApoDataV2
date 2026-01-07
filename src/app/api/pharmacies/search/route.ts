import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { queryCache, withCache } from '@/lib/cache/queryCache';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin check (assuming only admins filter pharmacies)
        if (session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { query, minCa, maxCa, regions } = body;

        let sqlQuery = `
            SELECT id, name, address, ca, area as region, id_nat, cip
            FROM data_pharmacy
            WHERE 1=1
        `;

        const queryParams: any[] = [];
        let paramIndex = 1;

        // Text Search
        if (query && query.trim().length > 0) {
            const searchTerm = `%${query.trim().toLowerCase()}%`;
            sqlQuery += ` AND (LOWER(name) LIKE $${paramIndex} OR id_nat LIKE $${paramIndex} OR cip LIKE $${paramIndex})`;
            queryParams.push(searchTerm);
            paramIndex++;
        }

        // CA Filter
        if (minCa !== undefined) {
            sqlQuery += ` AND ca >= $${paramIndex}`;
            queryParams.push(minCa);
            paramIndex++;
        }
        if (maxCa !== undefined) {
            sqlQuery += ` AND ca <= $${paramIndex}`;
            queryParams.push(maxCa);
            paramIndex++;
        }

        // Regions Filter
        if (regions && regions.length > 0) {
            // Postgres ANY($1) for array match
            sqlQuery += ` AND area = ANY($${paramIndex})`;
            queryParams.push(regions);
            paramIndex++;
        }

        sqlQuery += ` ORDER BY name ASC LIMIT 500`;

        const result = await withCache(
            queryCache.generateKey('search:pharmacies', { query, minCa, maxCa, regions }),
            () => db.query(sqlQuery, queryParams)
        );

        return NextResponse.json({ pharmacies: result.rows });

    } catch (error) {
        console.error('Error searching pharmacies:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
