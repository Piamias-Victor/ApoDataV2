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
}

/**
 * API Route - Recherche laboratoires avec produits génériques/référents
 * 
 * POST /api/generic-filters/laboratories
 * Body: { query: string }
 * 
 * Filtre: laboratoires ayant au moins un produit générique ou référent
 * Recherche: nom laboratoire (bcb_lab)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await request.json();
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ laboratories: [] });
    }

    const trimmedQuery = query.trim();
    const isAdmin = session.user.role === 'admin';
    
    let sqlQuery: string;
    let params: any[];

    if (isAdmin) {
      sqlQuery = `
        SELECT 
          bcb_lab as laboratory_name,
          COUNT(*) as product_count,
          COUNT(CASE WHEN bcb_generic_status = 'GÉNÉRIQUE' THEN 1 END) as generic_count,
          COUNT(CASE WHEN bcb_generic_status = 'RÉFÉRENT' THEN 1 END) as referent_count,
          ARRAY_AGG(code_13_ref) as product_codes
        FROM data_globalproduct
        WHERE bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
          AND bcb_lab IS NOT NULL
          AND bcb_generic_group IS NOT NULL
          AND LOWER(bcb_lab) LIKE LOWER($1)
        GROUP BY bcb_lab
        HAVING COUNT(*) > 0
        ORDER BY bcb_lab
        LIMIT 50
      `;
      params = [`%${trimmedQuery}%`];
    } else {
      if (!session.user.pharmacyId) {
        return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });
      }

      sqlQuery = `
        SELECT 
          dgp.bcb_lab as laboratory_name,
          COUNT(*) as product_count,
          COUNT(CASE WHEN dgp.bcb_generic_status = 'GÉNÉRIQUE' THEN 1 END) as generic_count,
          COUNT(CASE WHEN dgp.bcb_generic_status = 'RÉFÉRENT' THEN 1 END) as referent_count,
          ARRAY_AGG(dip.code_13_ref_id) as product_codes
        FROM data_internalproduct dip
        INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
        WHERE dip.pharmacy_id = $1
          AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
          AND dgp.bcb_lab IS NOT NULL
          AND dgp.bcb_generic_group IS NOT NULL
          AND LOWER(dgp.bcb_lab) LIKE LOWER($2)
        GROUP BY dgp.bcb_lab
        HAVING COUNT(*) > 0
        ORDER BY dgp.bcb_lab
        LIMIT 50
      `;
      params = [session.user.pharmacyId, `%${trimmedQuery}%`];
    }

    const startTime = Date.now();
    const laboratories = await db.query<GenericLaboratoryResult>(sqlQuery, params);
    const queryTime = Date.now() - startTime;

    if (queryTime > 500) {
      console.warn(`Requête laboratoires génériques lente (${queryTime}ms):`, trimmedQuery);
    }

    return NextResponse.json({
      laboratories,
      count: laboratories.length,
      queryTime
    });

  } catch (error) {
    console.error('Erreur recherche laboratoires génériques:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}