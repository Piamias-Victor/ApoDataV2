import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = params.id;

        // Soft delete user: mark as deleted/inactive by setting deleted_at
        // Also remove pharmacy link
        await db.query(`
            UPDATE data_user
            SET deleted_at = NOW(),
                pharmacy_id = NULL
            WHERE id = $1
        `, [userId]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
