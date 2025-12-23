import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { search } = body;

        let sql = `
            SELECT 
                bcb_generic_group as name,
                COUNT(DISTINCT code_13_ref) as product_count
            FROM data_globalproduct 
            WHERE bcb_generic_group IS NOT NULL 
            AND bcb_generic_group != ''
            AND bcb_generic_group ILIKE $1
            GROUP BY bcb_generic_group
            ORDER BY name ASC
            LIMIT 50
        `;

        const result = await query(sql, [`%${search}%`]);

        const groups = result.rows.map(row => ({
            id: row.name,
            name: row.name,
            count: parseInt(row.product_count)
        }));

        return NextResponse.json({ groups });

    } catch (error) {
        console.error('Error fetching groups:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
