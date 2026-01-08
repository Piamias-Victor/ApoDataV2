import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await db.query(`
            SELECT 
                u.id,
                u.email,
                u.name,
                u.role,
                u.created_at,
                p.name as pharmacy_name
            FROM data_user u
            LEFT JOIN data_pharmacy p ON u.pharmacy_id = p.id
            WHERE u.deleted_at IS NULL
            ORDER BY u.created_at DESC
        `);

        return NextResponse.json({ users: result.rows });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
