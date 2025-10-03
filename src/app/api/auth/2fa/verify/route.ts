// src/app/api/auth/2fa/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/totp';

const VerifySchema = z.object({
  token: z.string().length(6).regex(/^\d{6}$/)
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token } = VerifySchema.parse(body);

    const result = await db.query(
      'SELECT two_factor_secret FROM data_user WHERE id = $1',
      [session.user.id]
    );

    const user = result[0];
    if (!user?.two_factor_secret) {
      return NextResponse.json(
        { error: 'Secret 2FA non trouvé' },
        { status: 400 }
      );
    }

    const isValid = verifyToken(token, user.two_factor_secret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Code invalide' },
        { status: 400 }
      );
    }

    await db.query(
      `UPDATE data_user 
       SET two_factor_enabled = TRUE, 
           two_factor_setup_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [session.user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Code invalide (6 chiffres requis)' },
        { status: 400 }
      );
    }

    console.error('Erreur vérification 2FA:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}