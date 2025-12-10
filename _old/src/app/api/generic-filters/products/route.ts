// src/app/api/generic-filters/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface GenericProductResult {
  readonly code_13_ref: string;
  readonly name: string;
  readonly bcb_lab: string;
  readonly bcb_generic_status: 'GÉNÉRIQUE' | 'RÉFÉRENT';
  readonly bcb_generic_group: string;
  readonly source_type?: 'laboratory' | 'brand'; // NOUVEAU
}

interface RequestBody {
  readonly query: string;
  readonly labOrBrandMode?: 'laboratory' | 'brand'; // NOUVEAU
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, labOrBrandMode = 'brand' }: RequestBody = await request.json(); // NOUVEAU
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ products: [] });
    }

    const trimmedQuery = query.trim();
    const isAdmin = session.user.role === 'admin';
    
    // NOUVEAU - Choisir la colonne selon le mode
    const columnName = labOrBrandMode === 'laboratory' ? 'bcb_lab' : 'bcb_brand';
    
    // Déterminer le type de recherche
    const isEndCodeSearch = trimmedQuery.startsWith('*') && /^\*\d+$/.test(trimmedQuery);
    const isStartCodeSearch = /^\d+$/.test(trimmedQuery);
    const isNameSearch = !isEndCodeSearch && !isStartCodeSearch;

    let sqlQuery: string;
    let params: any[];

    if (isAdmin) {
      if (isNameSearch) {
        sqlQuery = `
          SELECT 
            code_13_ref,
            name,
            ${columnName} as bcb_lab,
            bcb_generic_status,
            bcb_generic_group,
            '${labOrBrandMode}'::text as source_type
          FROM data_globalproduct
          WHERE bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
            AND ${columnName} IS NOT NULL
            AND bcb_generic_group IS NOT NULL
            AND LOWER(name) LIKE LOWER($1)
          ORDER BY name
          LIMIT 50
        `;
        params = [`%${trimmedQuery}%`];
      } else if (isStartCodeSearch) {
        sqlQuery = `
          SELECT 
            code_13_ref,
            name,
            ${columnName} as bcb_lab,
            bcb_generic_status,
            bcb_generic_group,
            '${labOrBrandMode}'::text as source_type
          FROM data_globalproduct
          WHERE bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
            AND ${columnName} IS NOT NULL
            AND bcb_generic_group IS NOT NULL
            AND code_13_ref LIKE $1
          ORDER BY code_13_ref
          LIMIT 50
        `;
        params = [`${trimmedQuery}%`];
      } else if (isEndCodeSearch) {
        const codeDigits = trimmedQuery.substring(1);
        sqlQuery = `
          SELECT 
            code_13_ref,
            name,
            ${columnName} as bcb_lab,
            bcb_generic_status,
            bcb_generic_group,
            '${labOrBrandMode}'::text as source_type
          FROM data_globalproduct
          WHERE bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
            AND ${columnName} IS NOT NULL
            AND bcb_generic_group IS NOT NULL
            AND code_13_ref LIKE $1
          ORDER BY code_13_ref
          LIMIT 50
        `;
        params = [`%${codeDigits}`];
      } else {
        return NextResponse.json({ products: [] });
      }
    } else {
      if (!session.user.pharmacyId) {
        return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });
      }

      if (isNameSearch) {
        sqlQuery = `
          SELECT 
            dip.code_13_ref_id as code_13_ref,
            dip.name,
            dgp.${columnName} as bcb_lab,
            dgp.bcb_generic_status,
            dgp.bcb_generic_group,
            '${labOrBrandMode}'::text as source_type
          FROM data_internalproduct dip
          INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
          WHERE dip.pharmacy_id = $1
            AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
            AND dgp.${columnName} IS NOT NULL
            AND dgp.bcb_generic_group IS NOT NULL
            AND LOWER(dip.name) LIKE LOWER($2)
          ORDER BY dip.name
          LIMIT 50
        `;
        params = [session.user.pharmacyId, `%${trimmedQuery}%`];
      } else if (isStartCodeSearch) {
        sqlQuery = `
          SELECT 
            dip.code_13_ref_id as code_13_ref,
            dip.name,
            dgp.${columnName} as bcb_lab,
            dgp.bcb_generic_status,
            dgp.bcb_generic_group,
            '${labOrBrandMode}'::text as source_type
          FROM data_internalproduct dip
          INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
          WHERE dip.pharmacy_id = $1
            AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
            AND dgp.${columnName} IS NOT NULL
            AND dgp.bcb_generic_group IS NOT NULL
            AND dip.code_13_ref_id LIKE $2
          ORDER BY dip.code_13_ref_id
          LIMIT 50
        `;
        params = [session.user.pharmacyId, `${trimmedQuery}%`];
      } else if (isEndCodeSearch) {
        const codeDigits = trimmedQuery.substring(1);
        sqlQuery = `
          SELECT 
            dip.code_13_ref_id as code_13_ref,
            dip.name,
            dgp.${columnName} as bcb_lab,
            dgp.bcb_generic_status,
            dgp.bcb_generic_group,
            '${labOrBrandMode}'::text as source_type
          FROM data_internalproduct dip
          INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
          WHERE dip.pharmacy_id = $1
            AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
            AND dgp.${columnName} IS NOT NULL
            AND dgp.bcb_generic_group IS NOT NULL
            AND dip.code_13_ref_id LIKE $2
          ORDER BY dip.code_13_ref_id
          LIMIT 50
        `;
        params = [session.user.pharmacyId, `%${codeDigits}`];
      } else {
        return NextResponse.json({ products: [] });
      }
    }

    const startTime = Date.now();
    const products = await db.query<GenericProductResult>(sqlQuery, params);
    const queryTime = Date.now() - startTime;

    if (queryTime > 500) {
      console.warn(`Requête produits génériques lente (${queryTime}ms):`, trimmedQuery, labOrBrandMode);
    }

    return NextResponse.json({
      products,
      count: products.length,
      queryTime,
      labOrBrandMode // NOUVEAU
    });

  } catch (error) {
    console.error('Erreur recherche produits génériques:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}