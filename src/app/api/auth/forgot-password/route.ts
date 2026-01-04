// src/app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        console.log(`[ForgotPassword] Request for: ${email}`);

        // 1. Vérifier si l'utilisateur existe
        const userRes = await db.query('SELECT id FROM data_user WHERE LOWER(email) = LOWER($1)', [email]);
        const user = userRes.rows[0];

        if (!user) {
            console.log(`[ForgotPassword] User not found for email: ${email}`);
            // On retourne quand même un succès pour éviter le user enumeration
            return NextResponse.json({ success: true });
        }

        console.log(`[ForgotPassword] User found: ${user.id}`);

        // 2. Générer un token unique
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 3600000); // 1 heure

        // 3. Sauvegarder le token en base (Colonnes data_user)
        await db.query(`
            UPDATE data_user 
            SET password_reset_token = $1, 
                password_reset_expires = $2
            WHERE id = $3
        `, [token, expiresAt, user.id]);

        // 4. Envoyer l'email (Simulé si pas de SMTP)
        if (process.env.SMTP_HOST) {
            console.log(`[ForgotPassword] SMTP_HOST detected. Sending email...`);
            try {
                await sendPasswordResetEmail(email, token);
                console.log(`[ForgotPassword] Email sent.`);
            } catch (err) {
                console.error(`[ForgotPassword] ERROR sending email:`, err);
            }
        } else {
            console.log('\n📧 [DEV] RESET PASSWORD LINK:\n', `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`, '\n');
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Password Reset Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
