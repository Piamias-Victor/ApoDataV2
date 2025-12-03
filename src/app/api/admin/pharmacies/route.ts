// src/app/api/admin/pharmacies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import type { Pharmacy } from '@/types/pharmacy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * API Route - Liste des pharmacies pour admin
 * 
 * GET /api/admin/pharmacies
 * Query params:
 * - search: string (recherche par nom)
 * - page: number (défaut: 1)
 * - limit: number (défaut: 20)
 * 
 * Sécurité: Admin uniquement
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Vérification sécurité admin
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      console.log('❌ [API] Unauthorized access attempt to admin/pharmacies');
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    // 2. Extraction des paramètres
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    console.log('📊 [API] Fetching pharmacies:', { search, page, limit, offset });

    // 3. Construction de la condition WHERE pour la recherche
    const searchCondition = search
      ? `WHERE LOWER(p.name) LIKE LOWER($1)`
      : '';
    const searchValue = search ? `%${search}%` : null;

    // 4. Requête pour compter le total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM data_pharmacy p
      ${searchCondition}
    `;

    const countResult = await db.query<{ total: string }>(
      countQuery,
      search ? [searchValue] : []
    );

    const totalItems = parseInt(countResult[0]?.total || '0');
    const totalPages = Math.ceil(totalItems / limit);

    // 5. Requête pour récupérer les pharmacies avec pagination
    const dataQuery = `
      SELECT 
        p.id,
        p.id_nat,
        p.name,
        p.address,
        p.area,
        p.ca,
        p.employees_count,
        p.ca_rank,
        p.created_at,
        p.updated_at,
        -- Statistiques supplémentaires
        (SELECT COUNT(DISTINCT u.id) 
         FROM data_user u 
         WHERE u.pharmacy_id = p.id) as user_count
      FROM data_pharmacy p
      ${searchCondition}
      ORDER BY p.name ASC
      LIMIT $${search ? 2 : 1} OFFSET $${search ? 3 : 2}
    `;

    const params = search
      ? [searchValue, limit, offset]
      : [limit, offset];

    const pharmacies = await db.query<Pharmacy & { user_count: string }>(
      dataQuery,
      params
    );

    // 6. Formatage des données
    const formattedPharmacies = pharmacies.map(p => ({
      id: p.id,
      id_nat: p.id_nat,
      name: p.name,
      address: p.address,
      area: p.area,
      ca: p.ca ? parseFloat(p.ca.toString()) : null,
      employees_count: p.employees_count ? parseInt(p.employees_count.toString()) : null,
      ca_rank: p.ca_rank ? parseInt(p.ca_rank.toString()) : null,
      user_count: parseInt(p.user_count || '0'),
      created_at: p.created_at,
      updated_at: p.updated_at
    }));

    console.log(`✅ [API] Found ${formattedPharmacies.length} pharmacies (page ${page}/${totalPages})`);

    return NextResponse.json({
      pharmacies: formattedPharmacies,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('❌ [API] Error fetching pharmacies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}