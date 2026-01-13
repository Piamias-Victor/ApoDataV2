import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendInvitationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        // 1. Check Admin Session
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Body
        const body = await req.json();
        const { email, name, role, pharmacyId } = body;

        // Basic Validation
        if (!email || !name || !role) {
            return NextResponse.json({ error: 'Champs obligatoires manquants (email, nom, rôle)' }, { status: 400 });
        }

        // 3. Check if user already exists
        const existingUser = await db.query('SELECT id FROM data_user WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return NextResponse.json({ error: 'Un utilisateur avec cet email existe déjà' }, { status: 409 }); // 409 Conflict
        }

        // 4. Generate Token (for setting password)
        const token = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // 5. Insert User
        // Note: password_hash is NULL initially, they must set it via the reset flow.
        const insertQuery = `
            INSERT INTO data_user (
                email, 
                name, 
                role, 
                pharmacy_id, 
                password_reset_token, 
                password_reset_expires,
                created_at,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING id, email, name, role, created_at
        `;

        const values = [
            email,
            name,
            role,
            (role === 'user' && pharmacyId) ? pharmacyId : null,
            token,
            tokenExpiry
        ];

        const result = await db.query(insertQuery, values);
        const newUser = result.rows[0];

        // 6. Send Email using the token
        try {
            await sendInvitationEmail(email, token, name);
        } catch (emailError) {
            console.error('Failed to send invitation email:', emailError);
            // We still return success for creation, but maybe warn? 
            // Or better: rollback? For now, let's just log it and return error to frontend so they can retry "Resend".
            // Since user IS created, we might want to return success but with a warning, 
            // OR just fail the whole request (but user is in DB).
            // Let's decide to keep the user and tell frontend to Try Resend.
            return NextResponse.json({ 
                success: true, 
                user: newUser, 
                warning: 'Utilisateur créé mais échec de l\'envoi de l\'email. Veuillez utiliser "Renvoyer l\'invitation".' 
            });
        }

        return NextResponse.json({ success: true, user: newUser });

    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
    }
}
