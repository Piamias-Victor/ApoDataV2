// src/app/api/categories/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

interface CategoryResult {
  readonly category_name: string;
  readonly category_type: 'universe' | 'category';
  readonly product_count: number;
  readonly product_codes: string[];
  readonly matching_products?: Array<{
    readonly name: string;
    readonly code_13_ref: string;
  }>;
}

interface SearchParams {
  readonly query: string;
  readonly mode: 'category' | 'product';
}

/**
 * API Route - Recherche catégories avec mode dual
 * 
 * POST /api/categories/search
 * Body: { query: string, mode: 'category' | 'product' }
 * 
 * Mode 'category': recherche directe dans universe ET category
 * Mode 'product': recherche produit → trouve catégories avec produits matchants
 * 
 * Admin: data_globalproduct | User: data_internalproduct + jointure
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, mode }: SearchParams = await request.json();
    
    if (!query || query.trim().length < 3) {
      return NextResponse.json({ categories: [] });
    }

    if (!mode || !['category', 'product'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    const trimmedQuery = query.trim();
    const isAdmin = session.user.role === 'admin';
    
    let sqlQuery: string;
    let params: any[];

    if (mode === 'category') {
      // Mode catégorie : recherche directe dans universe ET category
      if (isAdmin) {
        sqlQuery = `
          (
            SELECT 
              universe as category_name,
              'universe' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(code_13_ref) as product_codes
            FROM data_globalproduct
            WHERE universe IS NOT NULL
              AND LOWER(universe) LIKE LOWER($1)
            GROUP BY universe
          )
          UNION ALL
          (
            SELECT 
              category as category_name,
              'category' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(code_13_ref) as product_codes
            FROM data_globalproduct
            WHERE category IS NOT NULL
              AND LOWER(category) LIKE LOWER($1)
            GROUP BY category
          )
          ORDER BY category_name
          LIMIT 50
        `;
        params = [`%${trimmedQuery}%`];
      } else {
        if (!session.user.pharmacyId) {
          return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });
        }

        sqlQuery = `
          (
            SELECT 
              dgp.universe as category_name,
              'universe' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(dip.code_13_ref_id) as product_codes
            FROM data_internalproduct dip
            INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE dip.pharmacy_id = $1
              AND dgp.universe IS NOT NULL
              AND LOWER(dgp.universe) LIKE LOWER($2)
            GROUP BY dgp.universe
          )
          UNION ALL
          (
            SELECT 
              dgp.category as category_name,
              'category' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(dip.code_13_ref_id) as product_codes
            FROM data_internalproduct dip
            INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE dip.pharmacy_id = $1
              AND dgp.category IS NOT NULL
              AND LOWER(dgp.category) LIKE LOWER($2)
            GROUP BY dgp.category
          )
          ORDER BY category_name
          LIMIT 50
        `;
        params = [session.user.pharmacyId, `%${trimmedQuery}%`];
      }
    } else {
      // Mode produit : recherche produit → trouve catégories
      const isEndCodeSearch = trimmedQuery.startsWith('*') && /^\*\d+$/.test(trimmedQuery);
      const isStartCodeSearch = /^\d+$/.test(trimmedQuery);
      const isNameSearch = !isEndCodeSearch && !isStartCodeSearch;

      if (isAdmin) {
        if (isNameSearch) {
          sqlQuery = `
            WITH matching_products AS (
              SELECT 
                universe,
                category,
                name,
                code_13_ref
              FROM data_globalproduct
              WHERE LOWER(name) LIKE LOWER($1)
            ),
            universe_summary AS (
              SELECT 
                universe as category_name,
                'universe' as category_type,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              WHERE universe IS NOT NULL
              GROUP BY universe
            ),
            category_summary AS (
              SELECT 
                category as category_name,
                'category' as category_type,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              WHERE category IS NOT NULL
              GROUP BY category
            ),
            all_universe_products AS (
              SELECT 
                universe as category_name,
                'universe' as category_type,
                ARRAY_AGG(code_13_ref) as product_codes
              FROM data_globalproduct
              WHERE universe IN (SELECT universe FROM matching_products WHERE universe IS NOT NULL)
              GROUP BY universe
            ),
            all_category_products AS (
              SELECT 
                category as category_name,
                'category' as category_type,
                ARRAY_AGG(code_13_ref) as product_codes
              FROM data_globalproduct
              WHERE category IN (SELECT category FROM matching_products WHERE category IS NOT NULL)
              GROUP BY category
            )
            (
              SELECT 
                us.category_name,
                us.category_type,
                us.matching_count as product_count,
                aup.product_codes,
                us.matching_products
              FROM universe_summary us
              JOIN all_universe_products aup ON us.category_name = aup.category_name
            )
            UNION ALL
            (
              SELECT 
                cs.category_name,
                cs.category_type,
                cs.matching_count as product_count,
                acp.product_codes,
                cs.matching_products
              FROM category_summary cs
              JOIN all_category_products acp ON cs.category_name = acp.category_name
            )
            ORDER BY category_name
            LIMIT 50
          `;
          params = [`%${trimmedQuery}%`];
        } else if (isStartCodeSearch) {
          sqlQuery = `
            WITH matching_products AS (
              SELECT 
                universe,
                category,
                name,
                code_13_ref
              FROM data_globalproduct
              WHERE code_13_ref LIKE $1
            ),
            universe_summary AS (
              SELECT 
                universe as category_name,
                'universe' as category_type,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              WHERE universe IS NOT NULL
              GROUP BY universe
            ),
            category_summary AS (
              SELECT 
                category as category_name,
                'category' as category_type,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              WHERE category IS NOT NULL
              GROUP BY category
            ),
            all_universe_products AS (
              SELECT 
                universe as category_name,
                'universe' as category_type,
                ARRAY_AGG(code_13_ref) as product_codes
              FROM data_globalproduct
              WHERE universe IN (SELECT universe FROM matching_products WHERE universe IS NOT NULL)
              GROUP BY universe
            ),
            all_category_products AS (
              SELECT 
                category as category_name,
                'category' as category_type,
                ARRAY_AGG(code_13_ref) as product_codes
              FROM data_globalproduct
              WHERE category IN (SELECT category FROM matching_products WHERE category IS NOT NULL)
              GROUP BY category
            )
            (
              SELECT 
                us.category_name,
                us.category_type,
                us.matching_count as product_count,
                aup.product_codes,
                us.matching_products
              FROM universe_summary us
              JOIN all_universe_products aup ON us.category_name = aup.category_name
            )
            UNION ALL
            (
              SELECT 
                cs.category_name,
                cs.category_type,
                cs.matching_count as product_count,
                acp.product_codes,
                cs.matching_products
              FROM category_summary cs
              JOIN all_category_products acp ON cs.category_name = acp.category_name
            )
            ORDER BY category_name
            LIMIT 50
          `;
          params = [`${trimmedQuery}%`];
        } else if (isEndCodeSearch) {
          const codeDigits = trimmedQuery.substring(1);
          sqlQuery = `
            WITH matching_products AS (
              SELECT 
                universe,
                category,
                name,
                code_13_ref
              FROM data_globalproduct
              WHERE code_13_ref LIKE $1
            ),
            universe_summary AS (
              SELECT 
                universe as category_name,
                'universe' as category_type,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              WHERE universe IS NOT NULL
              GROUP BY universe
            ),
            category_summary AS (
              SELECT 
                category as category_name,
                'category' as category_type,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              WHERE category IS NOT NULL
              GROUP BY category
            ),
            all_universe_products AS (
              SELECT 
                universe as category_name,
                'universe' as category_type,
                ARRAY_AGG(code_13_ref) as product_codes
              FROM data_globalproduct
              WHERE universe IN (SELECT universe FROM matching_products WHERE universe IS NOT NULL)
              GROUP BY universe
            ),
            all_category_products AS (
              SELECT 
                category as category_name,
                'category' as category_type,
                ARRAY_AGG(code_13_ref) as product_codes
              FROM data_globalproduct
              WHERE category IN (SELECT category FROM matching_products WHERE category IS NOT NULL)
              GROUP BY category
            )
            (
              SELECT 
                us.category_name,
                us.category_type,
                us.matching_count as product_count,
                aup.product_codes,
                us.matching_products
              FROM universe_summary us
              JOIN all_universe_products aup ON us.category_name = aup.category_name
            )
            UNION ALL
            (
              SELECT 
                cs.category_name,
                cs.category_type,
                cs.matching_count as product_count,
                acp.product_codes,
                cs.matching_products
              FROM category_summary cs
              JOIN all_category_products acp ON cs.category_name = acp.category_name
            )
            ORDER BY category_name
            LIMIT 50
          `;
          params = [`%${codeDigits}`];
        } else {
          return NextResponse.json({ categories: [] });
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
                dgp.universe,
                dgp.category,
                dip.name,
                dip.code_13_ref_id as code_13_ref
              FROM data_internalproduct dip
              INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
              WHERE dip.pharmacy_id = $1
                AND LOWER(dip.name) LIKE LOWER($2)
            ),
            universe_summary AS (
              SELECT 
                universe as category_name,
                'universe' as category_type,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              WHERE universe IS NOT NULL
              GROUP BY universe
            ),
            category_summary AS (
              SELECT 
                category as category_name,
                'category' as category_type,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              WHERE category IS NOT NULL
              GROUP BY category
            ),
            all_universe_products AS (
              SELECT 
                dgp.universe as category_name,
                'universe' as category_type,
                ARRAY_AGG(dip.code_13_ref_id) as product_codes
              FROM data_internalproduct dip
              INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
              WHERE dip.pharmacy_id = $1
                AND dgp.universe IN (SELECT universe FROM matching_products WHERE universe IS NOT NULL)
              GROUP BY dgp.universe
            ),
            all_category_products AS (
              SELECT 
                dgp.category as category_name,
                'category' as category_type,
                ARRAY_AGG(dip.code_13_ref_id) as product_codes
              FROM data_internalproduct dip
              INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
              WHERE dip.pharmacy_id = $1
                AND dgp.category IN (SELECT category FROM matching_products WHERE category IS NOT NULL)
              GROUP BY dgp.category
            )
            (
              SELECT 
                us.category_name,
                us.category_type,
                us.matching_count as product_count,
                aup.product_codes,
                us.matching_products
              FROM universe_summary us
              JOIN all_universe_products aup ON us.category_name = aup.category_name
            )
            UNION ALL
            (
              SELECT 
                cs.category_name,
                cs.category_type,
                cs.matching_count as product_count,
                acp.product_codes,
                cs.matching_products
              FROM category_summary cs
              JOIN all_category_products acp ON cs.category_name = acp.category_name
            )
            ORDER BY category_name
            LIMIT 50
          `;
          params = [session.user.pharmacyId, `%${trimmedQuery}%`];
        } else if (isStartCodeSearch) {
          sqlQuery = `
            WITH matching_products AS (
              SELECT 
                dgp.universe,
                dgp.category,
                dip.name,
                dip.code_13_ref_id as code_13_ref
              FROM data_internalproduct dip
              INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
              WHERE dip.pharmacy_id = $1
                AND dip.code_13_ref_id LIKE $2
            ),
            universe_summary AS (
              SELECT 
                universe as category_name,
                'universe' as category_type,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              WHERE universe IS NOT NULL
              GROUP BY universe
            ),
            category_summary AS (
              SELECT 
                category as category_name,
                'category' as category_type,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              WHERE category IS NOT NULL
              GROUP BY category
            ),
            all_universe_products AS (
              SELECT 
                dgp.universe as category_name,
                'universe' as category_type,
                ARRAY_AGG(dip.code_13_ref_id) as product_codes
              FROM data_internalproduct dip
              INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
              WHERE dip.pharmacy_id = $1
                AND dgp.universe IN (SELECT universe FROM matching_products WHERE universe IS NOT NULL)
              GROUP BY dgp.universe
            ),
            all_category_products AS (
              SELECT 
                dgp.category as category_name,
                'category' as category_type,
                ARRAY_AGG(dip.code_13_ref_id) as product_codes
              FROM data_internalproduct dip
              INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
              WHERE dip.pharmacy_id = $1
                AND dgp.category IN (SELECT category FROM matching_products WHERE category IS NOT NULL)
              GROUP BY dgp.category
            )
            (
              SELECT 
                us.category_name,
                us.category_type,
                us.matching_count as product_count,
                aup.product_codes,
                us.matching_products
              FROM universe_summary us
              JOIN all_universe_products aup ON us.category_name = aup.category_name
            )
            UNION ALL
            (
              SELECT 
                cs.category_name,
                cs.category_type,
                cs.matching_count as product_count,
                acp.product_codes,
                cs.matching_products
              FROM category_summary cs
              JOIN all_category_products acp ON cs.category_name = acp.category_name
            )
            ORDER BY category_name
            LIMIT 50
          `;
          params = [session.user.pharmacyId, `${trimmedQuery}%`];
        } else if (isEndCodeSearch) {
          const codeDigits = trimmedQuery.substring(1);
          sqlQuery = `
            WITH matching_products AS (
              SELECT 
                dgp.universe,
                dgp.category,
                dip.name,
                dip.code_13_ref_id as code_13_ref
              FROM data_internalproduct dip
              INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
              WHERE dip.pharmacy_id = $1
                AND dip.code_13_ref_id LIKE $2
            ),
            universe_summary AS (
              SELECT 
                universe as category_name,
                'universe' as category_type,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              WHERE universe IS NOT NULL
              GROUP BY universe
            ),
            category_summary AS (
              SELECT 
                category as category_name,
                'category' as category_type,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
              FROM matching_products
              WHERE category IS NOT NULL
              GROUP BY category
            ),
            all_universe_products AS (
              SELECT 
                dgp.universe as category_name,
                'universe' as category_type,
                ARRAY_AGG(dip.code_13_ref_id) as product_codes
              FROM data_internalproduct dip
              INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
              WHERE dip.pharmacy_id = $1
                AND dgp.universe IN (SELECT universe FROM matching_products WHERE universe IS NOT NULL)
              GROUP BY dgp.universe
            ),
            all_category_products AS (
              SELECT 
                dgp.category as category_name,
                'category' as category_type,
                ARRAY_AGG(dip.code_13_ref_id) as product_codes
              FROM data_internalproduct dip
              INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
              WHERE dip.pharmacy_id = $1
                AND dgp.category IN (SELECT category FROM matching_products WHERE category IS NOT NULL)
              GROUP BY dgp.category
            )
            (
              SELECT 
                us.category_name,
                us.category_type,
                us.matching_count as product_count,
                aup.product_codes,
                us.matching_products
              FROM universe_summary us
              JOIN all_universe_products aup ON us.category_name = aup.category_name
            )
            UNION ALL
            (
              SELECT 
                cs.category_name,
                cs.category_type,
                cs.matching_count as product_count,
                acp.product_codes,
                cs.matching_products
              FROM category_summary cs
              JOIN all_category_products acp ON cs.category_name = acp.category_name
            )
            ORDER BY category_name
            LIMIT 50
          `;
          params = [session.user.pharmacyId, `%${codeDigits}`];
        } else {
          return NextResponse.json({ categories: [] });
        }
      }
    }

    const startTime = Date.now();
    const categories = await db.query<CategoryResult>(sqlQuery, params);
    const queryTime = Date.now() - startTime;

    // Log performance pour requêtes lentes
    if (queryTime > 500) {
      console.warn(`Requête catégories lente (${queryTime}ms):`, trimmedQuery, mode);
    }

    return NextResponse.json({
      categories,
      count: categories.length,
      queryTime,
      mode
    });

  } catch (error) {
    console.error('Erreur recherche catégories:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}