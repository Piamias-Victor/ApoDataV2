// src/app/api/generic-filters/laboratories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface GenericLaboratoryResult {
  readonly laboratory_name: string;
  readonly product_count: number;
  readonly generic_count: number;
  readonly referent_count: number;
  readonly product_codes: string[];
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
      return NextResponse.json({ laboratories: [] });
    }

    const trimmedQuery = query.trim();
    const isAdmin = session.user.role === 'admin';
    
    // NOUVEAU - Choisir la colonne selon le mode
    const columnName = labOrBrandMode === 'laboratory' ? 'bcb_lab' : 'bcb_brand';

    let sqlQuery: string;
    let params: any[];

    if (isAdmin) {
      sqlQuery = `
        SELECT 
          ${columnName} as laboratory_name,
          COUNT(*) as product_count,
          COUNT(*) FILTER (WHERE bcb_generic_status = 'GÉNÉRIQUE') as generic_count,
          COUNT(*) FILTER (WHERE bcb_generic_status = 'RÉFÉRENT') as referent_count,
          ARRAY_AGG(code_13_ref) as product_codes,
          '${labOrBrandMode}'::text as source_type
        FROM data_globalproduct
        WHERE bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
          AND ${columnName} IS NOT NULL
          AND bcb_generic_group IS NOT NULL
          AND LOWER(${columnName}) LIKE LOWER($1)
        GROUP BY ${columnName}
        ORDER BY ${columnName}
        LIMIT 50
      `;
      params = [`%${trimmedQuery}%`];
    } else {
      if (!session.user.pharmacyId) {
        return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });
      }

      sqlQuery = `
        SELECT 
          dgp.${columnName} as laboratory_name,
          COUNT(*) as product_count,
          COUNT(*) FILTER (WHERE dgp.bcb_generic_status = 'GÉNÉRIQUE') as generic_count,
          COUNT(*) FILTER (WHERE dgp.bcb_generic_status = 'RÉFÉRENT') as referent_count,
          ARRAY_AGG(dip.code_13_ref_id) as product_codes,
          '${labOrBrandMode}'::text as source_type
        FROM data_internalproduct dip
        INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
        WHERE dip.pharmacy_id = $1
          AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
          AND dgp.${columnName} IS NOT NULL
          AND dgp.bcb_generic_group IS NOT NULL
          AND LOWER(dgp.${columnName}) LIKE LOWER($2)
        GROUP BY dgp.${columnName}
        ORDER BY dgp.${columnName}
        LIMIT 50
      `;
      params = [session.user.pharmacyId, `%${trimmedQuery}%`];
    }

    const startTime = Date.now();
    const laboratories = await db.query<GenericLaboratoryResult>(sqlQuery, params);
    const queryTime = Date.now() - startTime;

    if (queryTime > 500) {
      console.warn(`Requête laboratoires génériques lente (${queryTime}ms):`, trimmedQuery, labOrBrandMode);
    }

    return NextResponse.json({
      laboratories,
      count: laboratories.length,
      queryTime,
      labOrBrandMode // NOUVEAU
    });

  } catch (error) {
    console.error('Erreur recherche laboratoires génériques:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}