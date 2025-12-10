// src/app/api/categories/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CategoryResult {
  readonly category_name: string;
  readonly category_type: 'bcb_segment_l0' | 'bcb_segment_l1' | 'bcb_segment_l2' | 'bcb_segment_l3' | 'bcb_segment_l4' | 'bcb_segment_l5' | 'bcb_family';
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
 * API Route - Recherche catégories BCB avec hiérarchie complète
 * 
 * POST /api/categories/search
 * Body: { query: string, mode: 'category' | 'product' }
 * 
 * Mode 'category': recherche dans toute la hiérarchie BCB (l0→l5 + family)
 * Mode 'product': recherche produit → trouve catégories BCB avec produits matchants
 * 
 * Hiérarchie BCB : bcb_segment_l0 (général) → bcb_segment_l5 (spécifique) + bcb_family
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, mode }: SearchParams = await request.json();
    
    if (!query || query.trim().length < 2) {
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
      // Mode catégorie : recherche dans toute la hiérarchie BCB
      if (isAdmin) {
        sqlQuery = `
          WITH all_results AS (
            -- bcb_segment_l0 (univers thérapeutique)
            SELECT 
              bcb_segment_l0 as category_name,
              'bcb_segment_l0' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(code_13_ref) as product_codes
            FROM data_globalproduct
            WHERE bcb_segment_l0 IS NOT NULL
              AND bcb_segment_l0 != 'NaN'
              AND LOWER(bcb_segment_l0) LIKE LOWER($1)
            GROUP BY bcb_segment_l0
            
            UNION ALL
            
            -- bcb_segment_l1
            SELECT 
              bcb_segment_l1 as category_name,
              'bcb_segment_l1' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(code_13_ref) as product_codes
            FROM data_globalproduct
            WHERE bcb_segment_l1 IS NOT NULL
              AND LOWER(bcb_segment_l1) LIKE LOWER($1)
            GROUP BY bcb_segment_l1
            
            UNION ALL
            
            -- bcb_segment_l2
            SELECT 
              bcb_segment_l2 as category_name,
              'bcb_segment_l2' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(code_13_ref) as product_codes
            FROM data_globalproduct
            WHERE bcb_segment_l2 IS NOT NULL
              AND LOWER(bcb_segment_l2) LIKE LOWER($1)
            GROUP BY bcb_segment_l2
            
            UNION ALL
            
            -- bcb_segment_l3
            SELECT 
              bcb_segment_l3 as category_name,
              'bcb_segment_l3' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(code_13_ref) as product_codes
            FROM data_globalproduct
            WHERE bcb_segment_l3 IS NOT NULL
              AND LOWER(bcb_segment_l3) LIKE LOWER($1)
            GROUP BY bcb_segment_l3
            
            UNION ALL
            
            -- bcb_segment_l4
            SELECT 
              bcb_segment_l4 as category_name,
              'bcb_segment_l4' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(code_13_ref) as product_codes
            FROM data_globalproduct
            WHERE bcb_segment_l4 IS NOT NULL
              AND LOWER(bcb_segment_l4) LIKE LOWER($1)
            GROUP BY bcb_segment_l4
            
            UNION ALL
            
            -- bcb_segment_l5
            SELECT 
              bcb_segment_l5 as category_name,
              'bcb_segment_l5' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(code_13_ref) as product_codes
            FROM data_globalproduct
            WHERE bcb_segment_l5 IS NOT NULL
              AND LOWER(bcb_segment_l5) LIKE LOWER($1)
            GROUP BY bcb_segment_l5
            
            UNION ALL
            
            -- bcb_family (familles BCB)
            SELECT 
              bcb_family as category_name,
              'bcb_family' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(code_13_ref) as product_codes
            FROM data_globalproduct
            WHERE bcb_family IS NOT NULL
              AND LOWER(bcb_family) LIKE LOWER($1)
            GROUP BY bcb_family
          ),
          ranked_results AS (
            SELECT 
              category_name,
              category_type,
              product_count,
              product_codes,
              ROW_NUMBER() OVER (PARTITION BY category_name ORDER BY product_count DESC) as rn
            FROM all_results
          )
          SELECT 
            category_name,
            category_type,
            product_count,
            product_codes
          FROM ranked_results
          WHERE rn = 1
          ORDER BY product_count DESC, category_name
          LIMIT 50
        `;
        params = [`%${trimmedQuery}%`];
      } else {
        if (!session.user.pharmacyId) {
          return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });
        }

        sqlQuery = `
          WITH all_results AS (
            -- bcb_segment_l0 (univers thérapeutique)
            SELECT 
              dgp.bcb_segment_l0 as category_name,
              'bcb_segment_l0' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(dip.code_13_ref_id) as product_codes
            FROM data_internalproduct dip
            INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE dip.pharmacy_id = $1
              AND dgp.bcb_segment_l0 IS NOT NULL
              AND dgp.bcb_segment_l0 != 'NaN'
              AND LOWER(dgp.bcb_segment_l0) LIKE LOWER($2)
            GROUP BY dgp.bcb_segment_l0
            
            UNION ALL
            
            -- bcb_segment_l1
            SELECT 
              dgp.bcb_segment_l1 as category_name,
              'bcb_segment_l1' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(dip.code_13_ref_id) as product_codes
            FROM data_internalproduct dip
            INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE dip.pharmacy_id = $1
              AND dgp.bcb_segment_l1 IS NOT NULL
              AND LOWER(dgp.bcb_segment_l1) LIKE LOWER($2)
            GROUP BY dgp.bcb_segment_l1
            
            UNION ALL
            
            -- bcb_segment_l2
            SELECT 
              dgp.bcb_segment_l2 as category_name,
              'bcb_segment_l2' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(dip.code_13_ref_id) as product_codes
            FROM data_internalproduct dip
            INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE dip.pharmacy_id = $1
              AND dgp.bcb_segment_l2 IS NOT NULL
              AND LOWER(dgp.bcb_segment_l2) LIKE LOWER($2)
            GROUP BY dgp.bcb_segment_l2
            
            UNION ALL
            
            -- bcb_segment_l3
            SELECT 
              dgp.bcb_segment_l3 as category_name,
              'bcb_segment_l3' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(dip.code_13_ref_id) as product_codes
            FROM data_internalproduct dip
            INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE dip.pharmacy_id = $1
              AND dgp.bcb_segment_l3 IS NOT NULL
              AND LOWER(dgp.bcb_segment_l3) LIKE LOWER($2)
            GROUP BY dgp.bcb_segment_l3
            
            UNION ALL
            
            -- bcb_segment_l4
            SELECT 
              dgp.bcb_segment_l4 as category_name,
              'bcb_segment_l4' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(dip.code_13_ref_id) as product_codes
            FROM data_internalproduct dip
            INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE dip.pharmacy_id = $1
              AND dgp.bcb_segment_l4 IS NOT NULL
              AND LOWER(dgp.bcb_segment_l4) LIKE LOWER($2)
            GROUP BY dgp.bcb_segment_l4
            
            UNION ALL
            
            -- bcb_segment_l5
            SELECT 
              dgp.bcb_segment_l5 as category_name,
              'bcb_segment_l5' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(dip.code_13_ref_id) as product_codes
            FROM data_internalproduct dip
            INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE dip.pharmacy_id = $1
              AND dgp.bcb_segment_l5 IS NOT NULL
              AND LOWER(dgp.bcb_segment_l5) LIKE LOWER($2)
            GROUP BY dgp.bcb_segment_l5
            
            UNION ALL
            
            -- bcb_family (familles BCB)
            SELECT 
              dgp.bcb_family as category_name,
              'bcb_family' as category_type,
              COUNT(*) as product_count,
              ARRAY_AGG(dip.code_13_ref_id) as product_codes
            FROM data_internalproduct dip
            INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE dip.pharmacy_id = $1
              AND dgp.bcb_family IS NOT NULL
              AND LOWER(dgp.bcb_family) LIKE LOWER($2)
            GROUP BY dgp.bcb_family
          ),
          ranked_results AS (
            SELECT 
              category_name,
              category_type,
              product_count,
              product_codes,
              ROW_NUMBER() OVER (PARTITION BY category_name ORDER BY product_count DESC) as rn
            FROM all_results
          )
          SELECT 
            category_name,
            category_type,
            product_count,
            product_codes
          FROM ranked_results
          WHERE rn = 1
          ORDER BY product_count DESC, category_name
          LIMIT 50
        `;
        params = [session.user.pharmacyId, `%${trimmedQuery}%`];
      }
    } else {
      // Mode produit : recherche produit → trouve catégories BCB
      const isEndCodeSearch = trimmedQuery.startsWith('*') && /^\*\d+$/.test(trimmedQuery);
      const isStartCodeSearch = /^\d+$/.test(trimmedQuery);
      const isNameSearch = !isEndCodeSearch && !isStartCodeSearch;

      if (isAdmin) {
        let productFilter = '';
        if (isNameSearch) {
          productFilter = 'LOWER(name) LIKE LOWER($1)';
        } else if (isStartCodeSearch) {
          productFilter = 'code_13_ref LIKE $1';
        } else if (isEndCodeSearch) {
          productFilter = 'code_13_ref LIKE $1';
        }

        const searchParam = isNameSearch ? `%${trimmedQuery}%` :
                           isStartCodeSearch ? `${trimmedQuery}%` :
                           isEndCodeSearch ? `%${trimmedQuery.substring(1)}` : trimmedQuery;

        sqlQuery = `
          WITH matching_products AS (
            SELECT 
              bcb_segment_l0, bcb_segment_l1, bcb_segment_l2, 
              bcb_segment_l3, bcb_segment_l4, bcb_segment_l5,
              bcb_family, name, code_13_ref
            FROM data_globalproduct
            WHERE ${productFilter}
          ),
          all_categories AS (
            -- Toutes les catégories BCB avec leurs produits matchants
            SELECT 'bcb_segment_l0' as category_type, bcb_segment_l0 as category_name, 
                   name, code_13_ref FROM matching_products WHERE bcb_segment_l0 IS NOT NULL AND bcb_segment_l0 != 'NaN'
            UNION ALL
            SELECT 'bcb_segment_l1' as category_type, bcb_segment_l1 as category_name, 
                   name, code_13_ref FROM matching_products WHERE bcb_segment_l1 IS NOT NULL
            UNION ALL
            SELECT 'bcb_segment_l2' as category_type, bcb_segment_l2 as category_name, 
                   name, code_13_ref FROM matching_products WHERE bcb_segment_l2 IS NOT NULL
            UNION ALL
            SELECT 'bcb_segment_l3' as category_type, bcb_segment_l3 as category_name, 
                   name, code_13_ref FROM matching_products WHERE bcb_segment_l3 IS NOT NULL
            UNION ALL
            SELECT 'bcb_segment_l4' as category_type, bcb_segment_l4 as category_name, 
                   name, code_13_ref FROM matching_products WHERE bcb_segment_l4 IS NOT NULL
            UNION ALL
            SELECT 'bcb_segment_l5' as category_type, bcb_segment_l5 as category_name, 
                   name, code_13_ref FROM matching_products WHERE bcb_segment_l5 IS NOT NULL
            UNION ALL
            SELECT 'bcb_family' as category_type, bcb_family as category_name, 
                   name, code_13_ref FROM matching_products WHERE bcb_family IS NOT NULL
          ),
          category_summary AS (
            SELECT 
              category_type,
              category_name,
              COUNT(*) as product_count,
              JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
            FROM all_categories
            GROUP BY category_type, category_name
          ),
          all_category_products AS (
            SELECT 
              cs.category_type,
              cs.category_name,
              ARRAY_AGG(dgp.code_13_ref) as product_codes
            FROM category_summary cs
            JOIN data_globalproduct dgp ON (
              (cs.category_type = 'bcb_segment_l0' AND dgp.bcb_segment_l0 = cs.category_name) OR
              (cs.category_type = 'bcb_segment_l1' AND dgp.bcb_segment_l1 = cs.category_name) OR
              (cs.category_type = 'bcb_segment_l2' AND dgp.bcb_segment_l2 = cs.category_name) OR
              (cs.category_type = 'bcb_segment_l3' AND dgp.bcb_segment_l3 = cs.category_name) OR
              (cs.category_type = 'bcb_segment_l4' AND dgp.bcb_segment_l4 = cs.category_name) OR
              (cs.category_type = 'bcb_segment_l5' AND dgp.bcb_segment_l5 = cs.category_name) OR
              (cs.category_type = 'bcb_family' AND dgp.bcb_family = cs.category_name)
            )
            GROUP BY cs.category_type, cs.category_name
          )
          SELECT 
            cs.category_name,
            cs.category_type,
            cs.product_count,
            acp.product_codes,
            cs.matching_products
          FROM category_summary cs
          JOIN all_category_products acp ON cs.category_type = acp.category_type 
            AND cs.category_name = acp.category_name
          ORDER BY cs.product_count DESC, cs.category_name
          LIMIT 50
        `;
        params = [searchParam];
      } else {
        // User mode avec jointure
        if (!session.user.pharmacyId) {
          return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });
        }

        let productFilter = '';
        if (isNameSearch) {
          productFilter = 'LOWER(dip.name) LIKE LOWER($2)';
        } else if (isStartCodeSearch) {
          productFilter = 'dip.code_13_ref_id LIKE $2';
        } else if (isEndCodeSearch) {
          productFilter = 'dip.code_13_ref_id LIKE $2';
        }

        const searchParam = isNameSearch ? `%${trimmedQuery}%` :
                           isStartCodeSearch ? `${trimmedQuery}%` :
                           isEndCodeSearch ? `%${trimmedQuery.substring(1)}` : trimmedQuery;

        sqlQuery = `
          WITH matching_products AS (
            SELECT 
              dgp.bcb_segment_l0, dgp.bcb_segment_l1, dgp.bcb_segment_l2, 
              dgp.bcb_segment_l3, dgp.bcb_segment_l4, dgp.bcb_segment_l5,
              dgp.bcb_family, dip.name, dip.code_13_ref_id as code_13_ref
            FROM data_internalproduct dip
            INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE dip.pharmacy_id = $1 AND ${productFilter}
          ),
          all_categories AS (
            -- Toutes les catégories BCB avec leurs produits matchants
            SELECT 'bcb_segment_l0' as category_type, bcb_segment_l0 as category_name, 
                   name, code_13_ref FROM matching_products WHERE bcb_segment_l0 IS NOT NULL AND bcb_segment_l0 != 'NaN'
            UNION ALL
            SELECT 'bcb_segment_l1' as category_type, bcb_segment_l1 as category_name, 
                   name, code_13_ref FROM matching_products WHERE bcb_segment_l1 IS NOT NULL
            UNION ALL
            SELECT 'bcb_segment_l2' as category_type, bcb_segment_l2 as category_name, 
                   name, code_13_ref FROM matching_products WHERE bcb_segment_l2 IS NOT NULL
            UNION ALL
            SELECT 'bcb_segment_l3' as category_type, bcb_segment_l3 as category_name, 
                   name, code_13_ref FROM matching_products WHERE bcb_segment_l3 IS NOT NULL
            UNION ALL
            SELECT 'bcb_segment_l4' as category_type, bcb_segment_l4 as category_name, 
                   name, code_13_ref FROM matching_products WHERE bcb_segment_l4 IS NOT NULL
            UNION ALL
            SELECT 'bcb_segment_l5' as category_type, bcb_segment_l5 as category_name, 
                   name, code_13_ref FROM matching_products WHERE bcb_segment_l5 IS NOT NULL
            UNION ALL
            SELECT 'bcb_family' as category_type, bcb_family as category_name, 
                   name, code_13_ref FROM matching_products WHERE bcb_family IS NOT NULL
          ),
          category_summary AS (
            SELECT 
              category_type,
              category_name,
              COUNT(*) as product_count,
              JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
            FROM all_categories
            GROUP BY category_type, category_name
          ),
          all_category_products AS (
            SELECT 
              cs.category_type,
              cs.category_name,
              ARRAY_AGG(dip.code_13_ref_id) as product_codes
            FROM category_summary cs
            JOIN data_internalproduct dip ON dip.pharmacy_id = $1
            JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE (
              (cs.category_type = 'bcb_segment_l0' AND dgp.bcb_segment_l0 = cs.category_name) OR
              (cs.category_type = 'bcb_segment_l1' AND dgp.bcb_segment_l1 = cs.category_name) OR
              (cs.category_type = 'bcb_segment_l2' AND dgp.bcb_segment_l2 = cs.category_name) OR
              (cs.category_type = 'bcb_segment_l3' AND dgp.bcb_segment_l3 = cs.category_name) OR
              (cs.category_type = 'bcb_segment_l4' AND dgp.bcb_segment_l4 = cs.category_name) OR
              (cs.category_type = 'bcb_family' AND dgp.bcb_family = cs.category_name)
            )
            GROUP BY cs.category_type, cs.category_name
          )
          SELECT 
            cs.category_name,
            cs.category_type,
            cs.product_count,
            acp.product_codes,
            cs.matching_products
          FROM category_summary cs
          JOIN all_category_products acp ON cs.category_type = acp.category_type 
            AND cs.category_name = acp.category_name
          ORDER BY cs.product_count DESC, cs.category_name
          LIMIT 50
        `;
        params = [session.user.pharmacyId, searchParam];
      }
    }

    const startTime = Date.now();
    const categories = await db.query<CategoryResult>(sqlQuery, params);
    const queryTime = Date.now() - startTime;

    // Log performance pour requêtes lentes
    if (queryTime > 500) {
      console.warn(`Requête catégories BCB lente (${queryTime}ms):`, trimmedQuery, mode);
    }

    return NextResponse.json({
      categories,
      count: categories.length,
      queryTime,
      mode
    });

  } catch (error) {
    console.error('Erreur recherche catégories BCB:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}