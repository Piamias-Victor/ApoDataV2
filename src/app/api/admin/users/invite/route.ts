import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { sendInvitationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { email, role, pharmacyId, name } = body;

        // Validation
        if (!email || !role || !name) {
            return NextResponse.json({ error: 'Champs manquants (email, role, nom)' }, { status: 400 });
        }

        if (role !== 'admin' && !pharmacyId) {
            return NextResponse.json({ error: 'Une pharmacie est requise pour les utilisateurs non-admin' }, { status: 400 });
        }

        // Check if user exists
        const userCheck = await db.query('SELECT id FROM data_user WHERE email = $1', [email]);
        if ((userCheck.rowCount ?? 0) > 0) {
            return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
        }

        // Insert new user
        // Note: password_hash is NULL thanks to user's schema update
        const insertQuery = `
            INSERT INTO data_user (email, role, pharmacy_id, name, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING id
        `;

        // Ensure pharmacyId is null for admins if not provided
        const finalPharmacyId = role === 'admin' ? null : pharmacyId;

        const result = await db.query(insertQuery, [email, role, finalPharmacyId, name]);
        const newUserId = result.rows[0].id;

        // Generate Invitation Token
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 86400000); // 24 heures

        // Store token in data_user (using existing columns)
        await db.query(`
            UPDATE data_user 
            SET password_reset_token = $1, 
                password_reset_expires = $2
            WHERE id = $3
        `, [token, expiresAt, newUserId]);

        // Send Email
        if (process.env.SMTP_HOST) {
            await sendInvitationEmail(email, token, name);
        } else {
            console.log('📧 [DEV] Invitation pour:', email, 'Token:', token);
        }

        return NextResponse.json({ success: true, userId: newUserId });

    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
    }
}
