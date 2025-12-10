// src/app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        // 1. Vérifier si l'utilisateur existe
        const userRes = await db.query('SELECT id FROM data_user WHERE email = $1', [email]);
        const user = userRes.rows[0];

        if (!user) {
            // On retourne quand même un succès pour éviter le user enumeration
            return NextResponse.json({ success: true });
        }

        // 2. Générer un token unique
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 3600000); // 1 heure

        // 3. Sauvegarder le token en base (Besoin d'une table password_resets ou colonne user)
        // Ici on suppose une table dédiée pour plus de propreté
        await db.query(`
      INSERT INTO auth_password_resets (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3
    `, [user.id, token, expiresAt]);

        // 4. Envoyer l'email (Simulé si pas de SMTP)
        if (process.env.SMTP_HOST) {
            await sendPasswordResetEmail(email, token);
        } else {
            console.log('📧 simulation email reset pour:', email, 'token:', token);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Password Reset Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
