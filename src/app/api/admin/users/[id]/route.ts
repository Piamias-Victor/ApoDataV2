import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UpdateUserSchema = z.object({
    role: z.enum(['admin', 'user', 'viewer']).optional(),
    pharmacyId: z.string().uuid().optional().nullable()
});

/**
 * API Route - Gestion d'un utilisateur spécifique
 * 
 * PATCH /api/admin/users/[id] - Modifier rôle/pharmacie
 * DELETE /api/admin/users/[id] - Soft delete
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized - Admin only' },
                { status: 403 }
            );
        }

        const userId = params.id;
        const body = await request.json();

        // Validation
        const validatedData = UpdateUserSchema.parse(body);

        // Vérifier si l'utilisateur existe
        const checkUser = await db.query('SELECT id FROM data_user WHERE id = $1', [userId]);
        if (checkUser.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Construction de la requête UPDATE
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (validatedData.role) {
            updates.push(`role = $${paramIndex++}`);
            values.push(validatedData.role);
        }

        if (validatedData.pharmacyId !== undefined) {
            updates.push(`pharmacy_id = $${paramIndex++}`);
            values.push(validatedData.pharmacyId);
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        updates.push(`updated_at = NOW()`);
        values.push(userId);

        const updateQuery = `
      UPDATE data_user 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, name, role, pharmacy_id, updated_at
    `;

        const result = await db.query(updateQuery, values);
        const updatedUser = result[0];

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                role: updatedUser.role,
                pharmacyId: updatedUser.pharmacy_id,
                updatedAt: updatedUser.updated_at
            }
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }
        console.error('❌ [API] Error updating user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized - Admin only' },
                { status: 403 }
            );
        }

        const userId = params.id;

        // Empêcher l'auto-suppression
        if (userId === session.user.id) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        // Soft delete
        const query = `
      UPDATE data_user 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `;

        const result = await db.query(query, [userId]);

        if (result.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'User deleted successfully' });

    } catch (error) {
        console.error('❌ [API] Error deleting user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
