// src/app/api/filters/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await query(
            `SELECT id, name, description, filter_data, created_at, updated_at
             FROM data_newfilter
             WHERE id = $1 AND user_id = $2`,
            [params.id, session.user.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Filter not found' }, { status: 404 });
        }

        return NextResponse.json({
            filter: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching filter:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await query(
            `DELETE FROM data_newfilter
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [params.id, session.user.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Filter not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            deletedId: result.rows[0].id
        });
    } catch (error) {
        console.error('Error deleting filter:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
