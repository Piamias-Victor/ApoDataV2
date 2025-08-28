// src/app/api/search/pharmacies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

interface PharmacyResult {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly ca: number;
  readonly area: string;
  readonly employees_count: number;
  readonly id_nat: string;
}

interface SearchParams {
  readonly query?: string;
  readonly caMin?: string;
  readonly caMax?: string;
  readonly regions?: string[];
}

/**
 * API Route - Recherche pharmacies avec filtres
 * 
 * POST /api/search/pharmacies
 * Body: { query?, caMin?, caMax?, regions? }
 * 
 * Filtres disponibles :
 * - query: recherche nom/adresse
 * - caMin/caMax: tranche CA
 * - regions: array régions
 * - Admin uniquement
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { query, caMin, caMax, regions }: SearchParams = await request.json();
    
    // Au moins un filtre requis
    if (!query && !caMin && !caMax && (!regions || regions.length === 0)) {
      return NextResponse.json({ pharmacies: [] });
    }

    let sqlQuery = `
      SELECT 
        id,
        name,
        address,
        ca,
        area,
        employees_count,
        id_nat
      FROM data_pharmacy
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    let paramCount = 0;

    // Recherche textuelle (nom ou adresse)
    if (query && query.trim().length >= 2) {
      paramCount++;
      sqlQuery += ` AND (
        LOWER(name) LIKE LOWER($${paramCount}) 
        OR LOWER(address) LIKE LOWER($${paramCount})
      )`;
      queryParams.push(`%${query.trim()}%`);
    }

    // Filtre CA minimum
    if (caMin) {
      paramCount++;
      sqlQuery += ` AND ca >= $${paramCount}`;
      queryParams.push(parseFloat(caMin));
    }

    // Filtre CA maximum
    if (caMax) {
      paramCount++;
      sqlQuery += ` AND ca <= $${paramCount}`;
      queryParams.push(parseFloat(caMax));
    }

    // Filtre régions
    if (regions && regions.length > 0) {
      paramCount++;
      sqlQuery += ` AND area = ANY($${paramCount})`;
      queryParams.push(regions);
    }

    // Tri et limite
    sqlQuery += ` ORDER BY ca DESC, name ASC LIMIT 100`;

    const startTime = Date.now();
    const pharmacies = await db.query<PharmacyResult>(sqlQuery, queryParams);
    const queryTime = Date.now() - startTime;

    // Log performance pour requêtes lentes
    if (queryTime > 500) {
      console.warn(`Requête pharmacies lente (${queryTime}ms):`, { query, caMin, caMax, regions });
    }

    return NextResponse.json({
      pharmacies,
      count: pharmacies.length,
      queryTime
    });

  } catch (error) {
    console.error('Erreur recherche pharmacies:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}