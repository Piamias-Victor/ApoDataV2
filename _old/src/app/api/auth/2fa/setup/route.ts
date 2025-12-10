// src/app/api/auth/2fa/setup/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateSecret, generateQRCode } from '@/lib/totp';
import type { TwoFactorSetup } from '@/types/totp';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const secret = generateSecret();
    const qrCode = await generateQRCode(session.user.email, secret);

    await db.query(
      `UPDATE data_user 
       SET two_factor_secret = $1, updated_at = NOW() 
       WHERE id = $2`,
      [secret, session.user.id]
    );

    const response: TwoFactorSetup = { secret, qrCode };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur setup 2FA:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}