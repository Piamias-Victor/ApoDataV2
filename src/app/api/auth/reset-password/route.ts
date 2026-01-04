import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token et mot de passe requis' }, { status: 400 });
        }

        // 1. Verify token
        const result = await db.query(
            'SELECT id, email FROM data_user WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
            [token]
        );

        const user = result.rows[0];

        if (!user) {
            return NextResponse.json({ error: 'Ce lien est invalide ou a expiré' }, { status: 400 });
        }

        // 2. Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // 3. Update user
        await db.query(`
            UPDATE data_user 
            SET password_hash = $1, 
                password_reset_token = NULL, 
                password_reset_expires = NULL,
                updated_at = NOW()
            WHERE id = $2
        `, [passwordHash, user.id]);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Password Update Error:', error);
        return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
    }
}
