// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { emailService } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ForgotPasswordSchema = z.object({
  email: z.string().email('Email invalide').max(255)
});

export async function POST(request: NextRequest) {
  console.log('🔄 [API] Forgot password request started');
  
  try {
    // 1. Validation de l'email
    const body = await request.json();
    const { email } = ForgotPasswordSchema.parse(body);
    
    console.log('📧 [API] Password reset requested for:', email);

    // 2. Vérification utilisateur existe
    const userResult = await db.query(
      'SELECT id, name, email FROM data_user WHERE email = $1',
      [email]
    );

    // Toujours retourner succès pour éviter l'énumération d'emails
    if (userResult.length === 0) {
      console.log('⚠️ [API] User not found, but returning success for security');
      return NextResponse.json(
        { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' },
        { status: 200 }
      );
    }

    const user = userResult[0];
    console.log('👤 [API] User found:', { id: user.id, name: user.name });

    // 3. Génération token sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    console.log('🔑 [API] Reset token generated, expires at:', expiresAt.toISOString());

    // 4. Sauvegarde token en base
    await db.query(
      `UPDATE data_user 
       SET password_reset_token = $1, 
           password_reset_expires = $2, 
           updated_at = NOW() 
       WHERE id = $3`,
      [hashedToken, expiresAt, user.id]
    );

    console.log('💾 [API] Reset token saved to database');

    // 5. Construction URL de reset
    const baseUrl = 'https://apo-data-v2.vercel.app/';
    const resetUrl = `${baseUrl}/auth/reset-password/${resetToken}`;

    console.log('🔗 [API] Reset URL generated:', resetUrl);

    // 6. Envoi email
    const emailSent = await emailService.sendResetPasswordEmail(email, {
      userName: user.name,
      resetUrl,
      expiresAt: expiresAt.toLocaleString('fr-FR', {
        timeZone: 'Europe/Paris',
        dateStyle: 'full',
        timeStyle: 'short'
      })
    });

    if (!emailSent) {
      console.error('❌ [API] Failed to send reset email');
      return NextResponse.json(
        { error: 'Erreur envoi email. Veuillez réessayer.' },
        { status: 500 }
      );
    }

    console.log('✅ [API] Reset email sent successfully');

    return NextResponse.json(
      { 
        message: 'Un email de réinitialisation a été envoyé à votre adresse.',
        debug: process.env.NODE_ENV === 'development' ? {
          resetUrl,
          token: resetToken,
          expiresAt: expiresAt.toISOString()
        } : undefined
      },
      { status: 200 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ [API] Validation error:', error.issues);
      return NextResponse.json(
        { 
          error: 'Email invalide',
          details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
        },
        { status: 400 }
      );
    }

    console.error('❌ [API] Forgot password error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}