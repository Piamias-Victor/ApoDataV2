// src/app/api/laboratories/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LaboratoryResult {
  readonly laboratory_name: string;
  readonly product_count: number;
  readonly product_codes: string[];
  readonly matching_products?: Array<{
    readonly name: string;
    readonly code_13_ref: string;
  }>;
}

interface SearchParams {
  readonly query: string;
  readonly mode: 'laboratory' | 'product';
}

/**
 * API Route - Recherche laboratoires avec mode dual
 * 
 * POST /api/laboratories/search
 * Body: { query: string, mode: 'laboratory' | 'product' }
 * 
 * Mode 'laboratory': recherche directe par nom laboratoire
 * Mode 'product': recherche produit → trouve labos avec produits matchants
 * 
 * Admin: data_globalproduct | User: data_internalproduct + jointure
 * MISE À JOUR: Utilise bcb_lab (données BCB) au lieu de brand_lab
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, mode }: SearchParams = await request.json();
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ laboratories: [] });
    }

    if (!mode || !['laboratory', 'product'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    const trimmedQuery = query.trim();
    const isAdmin = session.user.role === 'admin';
    
    let sqlQuery: string;
    let params: any[];

    if (mode === 'laboratory') {
      // Mode laboratoire : recherche directe par nom laboratoire BCB
      if (isAdmin) {
        sqlQuery = `
          SELECT 
            bcb_lab as laboratory_name,
            COUNT(*) as product_count,
            ARRAY_AGG(code_13_ref) as product_codes
          FROM data_globalproduct
          WHERE bcb_lab IS NOT NULL
            AND LOWER(bcb_lab) LIKE LOWER($1)
          GROUP BY bcb_lab
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
            ARRAY_AGG(dip.code_13_ref_id) as product_codes
          FROM data_internalproduct dip
          INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
          WHERE dip.pharmacy_id = $1
            AND dgp.bcb_lab IS NOT NULL
            AND LOWER(dgp.bcb_lab) LIKE LOWER($2)
          GROUP BY dgp.bcb_lab
          ORDER BY dgp.bcb_lab
          LIMIT 50
        `;
        params = [session.user.pharmacyId, `%${trimmedQuery}%`];
      }
    } else {
      // Mode produit : recherche produit → trouve laboratoires BCB
      // Déterminer le type de recherche produit
      const isEndCodeSearch = trimmedQuery.startsWith('*') && /^\*\d+$/.test(trimmedQuery);
      const isStartCodeSearch = /^\d+$/.test(trimmedQuery);
      const isNameSearch = !isEndCodeSearch && !isStartCodeSearch;

      if (isAdmin) {
        if (isNameSearch) {
          sqlQuery = `
            WITH matching_products AS (
              SELECT 
                bcb_lab,
                name,
                code_13_ref
              FROM data_globalproduct
              WHERE bcb_lab IS NOT NULL
                AND LOWER(name) LIKE LOWER($1)
            ),
            lab_summary AS (
              SELECT 
                bcb_lab as laboratory_name,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              GROUP BY bcb_lab
            ),
            all_lab_products AS (
              SELECT 
                bcb_lab as laboratory_name,
                ARRAY_AGG(code_13_ref) as product_codes
              FROM data_globalproduct
              WHERE bcb_lab IN (SELECT bcb_lab FROM matching_products)
              GROUP BY bcb_lab
            )
            SELECT 
              ls.laboratory_name,
              ls.matching_count as product_count,
              alp.product_codes,
              ls.matching_products
            FROM lab_summary ls
            JOIN all_lab_products alp ON ls.laboratory_name = alp.laboratory_name
            ORDER BY ls.laboratory_name
            LIMIT 50
          `;
          params = [`%${trimmedQuery}%`];
        } else if (isStartCodeSearch) {
          sqlQuery = `
            WITH matching_products AS (
              SELECT 
                bcb_lab,
                name,
                code_13_ref
              FROM data_globalproduct
              WHERE bcb_lab IS NOT NULL
                AND code_13_ref LIKE $1
            ),
            lab_summary AS (
              SELECT 
                bcb_lab as laboratory_name,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              GROUP BY bcb_lab
            ),
            all_lab_products AS (
              SELECT 
                bcb_lab as laboratory_name,
                ARRAY_AGG(code_13_ref) as product_codes
              FROM data_globalproduct
              WHERE bcb_lab IN (SELECT bcb_lab FROM matching_products)
              GROUP BY bcb_lab
            )
            SELECT 
              ls.laboratory_name,
              ls.matching_count as product_count,
              alp.product_codes,
              ls.matching_products
            FROM lab_summary ls
            JOIN all_lab_products alp ON ls.laboratory_name = alp.laboratory_name
            ORDER BY ls.laboratory_name
            LIMIT 50
          `;
          params = [`${trimmedQuery}%`];
        } else if (isEndCodeSearch) {
          const codeDigits = trimmedQuery.substring(1);
          sqlQuery = `
            WITH matching_products AS (
              SELECT 
                bcb_lab,
                name,
                code_13_ref
              FROM data_globalproduct
              WHERE bcb_lab IS NOT NULL
                AND code_13_ref LIKE $1
            ),
            lab_summary AS (
              SELECT 
                bcb_lab as laboratory_name,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              GROUP BY bcb_lab
            ),
            all_lab_products AS (
              SELECT 
                bcb_lab as laboratory_name,
                ARRAY_AGG(code_13_ref) as product_codes
              FROM data_globalproduct
              WHERE bcb_lab IN (SELECT bcb_lab FROM matching_products)
              GROUP BY bcb_lab
            )
            SELECT 
              ls.laboratory_name,
              ls.matching_count as product_count,
              alp.product_codes,
              ls.matching_products
            FROM lab_summary ls
            JOIN all_lab_products alp ON ls.laboratory_name = alp.laboratory_name
            ORDER BY ls.laboratory_name
            LIMIT 50
          `;
          params = [`%${codeDigits}`];
        } else {
          return NextResponse.json({ laboratories: [] });
        }
      } else {
        // User mode avec jointure
        if (!session.user.pharmacyId) {
          return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });
        }

        if (isNameSearch) {
          sqlQuery = `
            WITH matching_products AS (
              SELECT 
                dgp.bcb_lab,
                dip.name,
                dip.code_13_ref_id as code_13_ref
              FROM data_internalproduct dip
              INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
              WHERE dip.pharmacy_id = $1
                AND dgp.bcb_lab IS NOT NULL
                AND LOWER(dip.name) LIKE LOWER($2)
            ),
            lab_summary AS (
              SELECT 
                bcb_lab as laboratory_name,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              GROUP BY bcb_lab
            ),
            all_lab_products AS (
              SELECT 
                dgp.bcb_lab as laboratory_name,
                ARRAY_AGG(dip.code_13_ref_id) as product_codes
              FROM data_internalproduct dip
              INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
              WHERE dip.pharmacy_id = $1
                AND dgp.bcb_lab IN (SELECT bcb_lab FROM matching_products)
              GROUP BY dgp.bcb_lab
            )
            SELECT 
              ls.laboratory_name,
              ls.matching_count as product_count,
              alp.product_codes,
              ls.matching_products
            FROM lab_summary ls
            JOIN all_lab_products alp ON ls.laboratory_name = alp.laboratory_name
            ORDER BY ls.laboratory_name
            LIMIT 50
          `;
          params = [session.user.pharmacyId, `%${trimmedQuery}%`];
        } else if (isStartCodeSearch) {
          sqlQuery = `
            WITH matching_products AS (
              SELECT 
                dgp.bcb_lab,
                dip.name,
                dip.code_13_ref_id as code_13_ref
              FROM data_internalproduct dip
              INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
              WHERE dip.pharmacy_id = $1
                AND dgp.bcb_lab IS NOT NULL
                AND dip.code_13_ref_id LIKE $2
            ),
            lab_summary AS (
              SELECT 
                bcb_lab as laboratory_name,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              GROUP BY bcb_lab
            ),
            all_lab_products AS (
              SELECT 
                dgp.bcb_lab as laboratory_name,
                ARRAY_AGG(dip.code_13_ref_id) as product_codes
              FROM data_internalproduct dip
              INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
              WHERE dip.pharmacy_id = $1
                AND dgp.bcb_lab IN (SELECT bcb_lab FROM matching_products)
              GROUP BY dgp.bcb_lab
            )
            SELECT 
              ls.laboratory_name,
              ls.matching_count as product_count,
              alp.product_codes,
              ls.matching_products
            FROM lab_summary ls
            JOIN all_lab_products alp ON ls.laboratory_name = alp.laboratory_name
            ORDER BY ls.laboratory_name
            LIMIT 50
          `;
          params = [session.user.pharmacyId, `${trimmedQuery}%`];
        } else if (isEndCodeSearch) {
          const codeDigits = trimmedQuery.substring(1);
          sqlQuery = `
            WITH matching_products AS (
              SELECT 
                dgp.bcb_lab,
                dip.name,
                dip.code_13_ref_id as code_13_ref
              FROM data_internalproduct dip
              INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
              WHERE dip.pharmacy_id = $1
                AND dgp.bcb_lab IS NOT NULL
                AND dip.code_13_ref_id LIKE $2
            ),
            lab_summary AS (
              SELECT 
                bcb_lab as laboratory_name,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              GROUP BY bcb_lab
            ),
            all_lab_products AS (
              SELECT 
                dgp.bcb_lab as laboratory_name,
                ARRAY_AGG(dip.code_13_ref_id) as product_codes
              FROM data_internalproduct dip
              INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
              WHERE dip.pharmacy_id = $1
                AND dgp.bcb_lab IN (SELECT bcb_lab FROM matching_products)
              GROUP BY dgp.bcb_lab
            )
            SELECT 
              ls.laboratory_name,
              ls.matching_count as product_count,
              alp.product_codes,
              ls.matching_products
            FROM lab_summary ls
            JOIN all_lab_products alp ON ls.laboratory_name = alp.laboratory_name
            ORDER BY ls.laboratory_name
            LIMIT 50
          `;
          params = [session.user.pharmacyId, `%${codeDigits}`];
        } else {
          return NextResponse.json({ laboratories: [] });
        }
      }
    }

    const startTime = Date.now();
    const laboratories = await db.query<LaboratoryResult>(sqlQuery, params);
    const queryTime = Date.now() - startTime;

    // Log performance pour requêtes lentes
    if (queryTime > 500) {
      console.warn(`Requête laboratoires lente (${queryTime}ms):`, trimmedQuery, mode);
    }

    return NextResponse.json({
      laboratories,
      count: laboratories.length,
      queryTime,
      mode
    });

  } catch (error) {
    console.error('Erreur recherche laboratoires:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}