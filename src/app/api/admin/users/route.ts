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
  role: z.enum(['admin', 'user', 'viewer', 'pharmacy_user']),
  pharmacyId: z.string().uuid().optional().nullable()
});

/**
 * API Route - Gestion des utilisateurs pour admin
 * 
 * GET /api/admin/users
 * Query params:
 * - search: string (nom ou email)
 * - role: string (admin, user, viewer)
 * - includeDeleted: boolean (true/false)
 * - page: number
 * - limit: number
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('🔍 [API] Users - Session:', {
      user: session?.user?.email,
      role: session?.user?.role
    });

    if (!session?.user || session.user.role !== 'admin') {
      console.log('❌ [API] Users - Unauthorized');
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Construction de la condition WHERE
    let whereConditions = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(LOWER(u.name) LIKE LOWER($${paramIndex}) OR LOWER(u.email) LIKE LOWER($${paramIndex}))`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereConditions.push(`u.role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (!includeDeleted) {
      whereConditions.push(`u.deleted_at IS NULL`);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Compter le total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM data_user u
      ${whereClause}
    `;

    const countResult = await db.query<{ total: string }>(countQuery, params);
    const totalItems = parseInt(countResult[0]?.total || '0');
    const totalPages = Math.ceil(totalItems / limit);

    console.log('📊 [API] Users - Count:', { totalItems, whereClause, params });

    // Récupérer les données
    const dataQuery = `
      SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.role, 
        u.pharmacy_id,
        p.name as pharmacy_name,
        u.created_at, 
        u.updated_at, 
        u.last_login_at,
        u.deleted_at
      FROM data_user u
      LEFT JOIN data_pharmacy p ON u.pharmacy_id = p.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const users = await db.query(dataQuery, [...params, limit, offset]);
    console.log('✅ [API] Users - Found:', users.length);

    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      pharmacyId: u.pharmacy_id,
      pharmacyName: u.pharmacy_name,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      lastLoginAt: u.last_login_at,
      deletedAt: u.deleted_at
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('❌ [API] Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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