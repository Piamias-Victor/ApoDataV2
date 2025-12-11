// src/app/api/filters/save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, filterData } = body;

        if (!name || !filterData) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await query(
            `INSERT INTO data_newfilter (user_id, name, description, filter_data, updated_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             RETURNING id, name, description, created_at`,
            [session.user.id, name, description || null, JSON.stringify(filterData)]
        );

        return NextResponse.json({
            success: true,
            filter: result.rows[0]
        });
    } catch (error) {
        console.error('Error saving filter:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
