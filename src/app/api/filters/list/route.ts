// src/app/api/filters/list/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await query(
            `SELECT id, name, description, filter_data, created_at, updated_at
             FROM data_newfilter
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [session.user.id]
        );

        return NextResponse.json({
            filters: result.rows
        });
    } catch (error) {
        console.error('Error fetching filters:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
