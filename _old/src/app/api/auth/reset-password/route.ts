// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Validation mot de passe fort
const PasswordSchema = z.string()
  .min(8, 'Minimum 8 caractères')
  .max(100, 'Maximum 100 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule requise')
  .regex(/[a-z]/, 'Au moins une minuscule requise')
  .regex(/[0-9]/, 'Au moins un chiffre requis')
  .regex(/[^A-Za-z0-9]/, 'Au moins un caractère spécial requis');

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  password: PasswordSchema,
  confirmPassword: z.string()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword']
  }
);

export async function POST(request: NextRequest) {
  console.log('🔄 [API] Reset password request started');
  
  try {
    // 1. Validation des données
    const body = await request.json();
    const { token, password } = ResetPasswordSchema.parse(body);
    
    console.log('🔑 [API] Reset password for token:', token.slice(0, 8) + '...');

    // 2. Hash du token reçu pour comparaison
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 3. Recherche utilisateur avec token valide
    const userResult = await db.query(
      `SELECT id, email, name, password_reset_token, password_reset_expires 
       FROM data_user 
       WHERE password_reset_token = $1 
         AND password_reset_expires > NOW()`,
      [hashedToken]
    );

    if (userResult.length === 0) {
      console.log('❌ [API] Invalid or expired token');
      return NextResponse.json(
        { error: 'Token invalide ou expiré. Veuillez faire une nouvelle demande.' },
        { status: 400 }
      );
    }

    const user = userResult[0];
    console.log('👤 [API] User found for password reset:', { id: user.id, email: user.email });

    // 4. Hash du nouveau mot de passe
    const passwordHash = await hash(password, 12);
    console.log('🔐 [API] Password hashed successfully');

    // 5. Mise à jour mot de passe + nettoyage token
    await db.query(
      `UPDATE data_user 
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    console.log('✅ [API] Password updated and reset token cleared');

    // 6. Log de sécurité (audit trail)
    console.log('🛡️ [SECURITY] Password reset completed', {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(
      { 
        message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
        success: true
      },
      { status: 200 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ [API] Validation error:', error.issues);
      return NextResponse.json(
        { 
          error: 'Données invalides',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    console.error('❌ [API] Reset password error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}