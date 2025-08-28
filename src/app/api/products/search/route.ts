// src/app/api/products/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

interface ProductResult {
  readonly name: string;
  readonly code_13_ref: string;
  readonly brand_lab: string | null;
  readonly universe: string | null;
}

interface SearchParams {
  readonly query: string;
}

/**
 * API Route - Recherche produits intelligente
 * 
 * POST /api/products/search
 * Body: { query: string }
 * 
 * Logique de recherche :
 * - Lettres: recherche par nom
 * - Chiffres: recherche début code EAN
 * - *+chiffres: recherche fin code EAN
 * - Admin: data_globalproduct
 * - User: data_internalproduct + jointure
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query }: SearchParams = await request.json();
    
    if (!query || query.trim().length < 3) {
      return NextResponse.json({ products: [] });
    }

    const trimmedQuery = query.trim();
    const isAdmin = session.user.role === 'admin';
    
    let sqlQuery: string;
    let params: any[];

    // Déterminer le type de recherche
    const isEndCodeSearch = trimmedQuery.startsWith('*') && /^\*\d+$/.test(trimmedQuery);
    const isStartCodeSearch = /^\d+$/.test(trimmedQuery);
    const isNameSearch = !isEndCodeSearch && !isStartCodeSearch;

    if (isAdmin) {
      // Admin - recherche dans data_globalproduct
      if (isNameSearch) {
        sqlQuery = `
          SELECT name, code_13_ref, brand_lab, universe
          FROM data_globalproduct
          WHERE LOWER(name) LIKE LOWER($1)
          ORDER BY name
          LIMIT 100
        `;
        params = [`%${trimmedQuery}%`];
      } else if (isStartCodeSearch) {
        sqlQuery = `
          SELECT name, code_13_ref, brand_lab, universe
          FROM data_globalproduct
          WHERE code_13_ref LIKE $1
          ORDER BY code_13_ref
          LIMIT 100
        `;
        params = [`${trimmedQuery}%`];
      } else if (isEndCodeSearch) {
        const codeDigits = trimmedQuery.substring(1);
        sqlQuery = `
          SELECT name, code_13_ref, brand_lab, universe
          FROM data_globalproduct
          WHERE code_13_ref LIKE $1
          ORDER BY code_13_ref
          LIMIT 100
        `;
        params = [`%${codeDigits}`];
      } else {
        return NextResponse.json({ products: [] });
      }
    } else {
      // User - recherche dans data_internalproduct avec jointure
      if (!session.user.pharmacyId) {
        return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });
      }

      if (isNameSearch) {
        sqlQuery = `
          SELECT 
            dip.name,
            dip.code_13_ref_id as code_13_ref,
            dgp.brand_lab,
            dgp.universe
          FROM data_internalproduct dip
          LEFT JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
          WHERE dip.pharmacy_id = $1
            AND LOWER(dip.name) LIKE LOWER($2)
          ORDER BY dip.name
          LIMIT 100
        `;
        params = [session.user.pharmacyId, `%${trimmedQuery}%`];
      } else if (isStartCodeSearch) {
        sqlQuery = `
          SELECT 
            dip.name,
            dip.code_13_ref_id as code_13_ref,
            dgp.brand_lab,
            dgp.universe
          FROM data_internalproduct dip
          LEFT JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
          WHERE dip.pharmacy_id = $1
            AND dip.code_13_ref_id LIKE $2
          ORDER BY dip.code_13_ref_id
          LIMIT 100
        `;
        params = [session.user.pharmacyId, `${trimmedQuery}%`];
      } else if (isEndCodeSearch) {
        const codeDigits = trimmedQuery.substring(1);
        sqlQuery = `
          SELECT 
            dip.name,
            dip.code_13_ref_id as code_13_ref,
            dgp.brand_lab,
            dgp.universe
          FROM data_internalproduct dip
          LEFT JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
          WHERE dip.pharmacy_id = $1
            AND dip.code_13_ref_id LIKE $2
          ORDER BY dip.code_13_ref_id
          LIMIT 100
        `;
        params = [session.user.pharmacyId, `%${codeDigits}`];
      } else {
        return NextResponse.json({ products: [] });
      }
    }

    const startTime = Date.now();
    const products = await db.query<ProductResult>(sqlQuery, params);
    const queryTime = Date.now() - startTime;

    // Log performance pour requêtes lentes
    if (queryTime > 500) {
      console.warn(`Requête produits lente (${queryTime}ms):`, trimmedQuery);
    }

    return NextResponse.json({
      products,
      count: products.length,
      queryTime
    });

  } catch (error) {
    console.error('Erreur recherche produits:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}