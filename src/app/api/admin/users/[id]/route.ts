import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = params.id;
        const body = await req.json();
        const { name, role, pharmacy_id } = body;

        // Validation simple
        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        if (role === 'pharmacy_user' && !pharmacy_id) {
             return NextResponse.json({ error: 'Pharmacy is required for users' }, { status: 400 });
        }

        // Update data_user
        await db.query(`
            UPDATE data_user
            SET name = $1,
                role = $2,
                pharmacy_id = $3,
                updated_at = NOW()
            WHERE id = $4
        `, [name, role, pharmacy_id, userId]);

        return NextResponse.json({ success: true, message: 'User updated' });

    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
