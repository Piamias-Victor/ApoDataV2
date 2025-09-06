// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import type { CreateUserResponse } from '@/types/user';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CreateUserSchema = z.object({
  email: z.string().email('Email invalide').max(255),
  name: z.string().min(2, 'Nom trop court').max(255),
  password: z.string().min(8, 'Mot de passe trop court').max(100),
  role: z.enum(['admin', 'user', 'viewer']),
  pharmacyId: z.string().uuid().optional().nullable()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = CreateUserSchema.parse(body);
    
    // Vérification email unique
    const existingUser = await db.query(
      'SELECT id FROM data_user WHERE email = $1',
      [validatedData.email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email déjà utilisé' },
        { status: 400 }
      );
    }

    // Vérification pharmacie si fournie
    if (validatedData.pharmacyId) {
      const pharmacy = await db.query(
        'SELECT id FROM data_pharmacy WHERE id = $1',
        [validatedData.pharmacyId]
      );

      if (pharmacy.length === 0) {
        return NextResponse.json(
          { error: 'Pharmacie non trouvée' },
          { status: 400 }
        );
      }
    }

    // Hash du mot de passe et création
    const passwordHash = await hash(validatedData.password, 12);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertQuery = `
      INSERT INTO data_user (
        id, email, name, password_hash, role, pharmacy_id, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, name, role, pharmacy_id, created_at, updated_at
    `;

    const result = await db.query(insertQuery, [
      userId,
      validatedData.email,
      validatedData.name,
      passwordHash,
      validatedData.role,
      validatedData.pharmacyId || null,
      now,
      now
    ]);

    const createdUser = result[0];

    const response: CreateUserResponse = {
      user: {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
        pharmacyId: createdUser.pharmacy_id,
        createdAt: createdUser.created_at,
        updatedAt: createdUser.updated_at,
        lastLoginAt: null
      },
      message: 'Utilisateur créé avec succès'
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Données invalides',
          details: error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        },
        { status: 400 }
      );
    }

    console.error('❌ [API] User creation error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}