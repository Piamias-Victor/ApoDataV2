// src/app/api/products/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
 * Normalise et extrait les mots-clés d'une recherche
 */
function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2);
}

/**
 * Construit la clause WHERE pour recherche multi-mots
 */
function buildKeywordSearch(keywords: string[], isAdmin: boolean): { condition: string; params: string[] } {
  if (keywords.length === 0) {
    return { condition: '1=0', params: [] };
  }

  const nameField = isAdmin ? 'name' : 'dip.name';
  const conditions = keywords.map((_, index) => 
    `LOWER(${nameField}) LIKE LOWER($${isAdmin ? index + 1 : index + 2})`
  );

  return {
    condition: conditions.join(' AND '),
    params: keywords.map(keyword => `%${keyword}%`)
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query }: SearchParams = await request.json();
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ products: [] });
    }

    const trimmedQuery = query.trim();
    const isAdmin = session.user.role === 'admin';
    
    let sqlQuery: string;
    let params: any[];

    const isEndCodeSearch = trimmedQuery.startsWith('*') && /^\*\d+$/.test(trimmedQuery);
    const isStartCodeSearch = /^\d+$/.test(trimmedQuery);
    const isKeywordNameSearch = !isEndCodeSearch && !isStartCodeSearch;

    if (isAdmin) {
      if (isKeywordNameSearch) {
        const keywords = extractKeywords(trimmedQuery);
        const { condition, params: keywordParams } = buildKeywordSearch(keywords, true);
        
        sqlQuery = `
          WITH ranked_products AS (
            SELECT 
              name, 
              code_13_ref, 
              brand_lab, 
              universe,
              bcb_product_id,
              ROW_NUMBER() OVER (
                PARTITION BY COALESCE(bcb_product_id::text, code_13_ref) 
                ORDER BY 
                  CASE WHEN code_13_ref ~ '^[0-9]{13}$' THEN 0 ELSE 1 END,
                  code_13_ref
              ) as rn
            FROM data_globalproduct
            WHERE ${condition}
          )
          SELECT name, code_13_ref, brand_lab, universe
          FROM ranked_products
          WHERE rn = 1
          ORDER BY 
            CASE 
              WHEN LOWER(name) LIKE LOWER($${keywords.length + 1}) THEN 1
              ELSE 2
            END,
            name
          LIMIT 100
        `;
        params = [...keywordParams, `%${trimmedQuery}%`];
        
      } else if (isStartCodeSearch) {
        sqlQuery = `
          WITH ranked_products AS (
            SELECT 
              name, 
              code_13_ref, 
              brand_lab, 
              universe,
              bcb_product_id,
              ROW_NUMBER() OVER (
                PARTITION BY COALESCE(bcb_product_id::text, code_13_ref) 
                ORDER BY 
                  CASE WHEN code_13_ref ~ '^[0-9]{13}$' THEN 0 ELSE 1 END,
                  code_13_ref
              ) as rn
            FROM data_globalproduct
            WHERE code_13_ref LIKE $1
          )
          SELECT name, code_13_ref, brand_lab, universe
          FROM ranked_products
          WHERE rn = 1
          ORDER BY code_13_ref
          LIMIT 100
        `;
        params = [`${trimmedQuery}%`];
        
      } else if (isEndCodeSearch) {
        const codeDigits = trimmedQuery.substring(1);
        sqlQuery = `
          WITH ranked_products AS (
            SELECT 
              name, 
              code_13_ref, 
              brand_lab, 
              universe,
              bcb_product_id,
              ROW_NUMBER() OVER (
                PARTITION BY COALESCE(bcb_product_id::text, code_13_ref) 
                ORDER BY 
                  CASE WHEN code_13_ref ~ '^[0-9]{13}$' THEN 0 ELSE 1 END,
                  code_13_ref
              ) as rn
            FROM data_globalproduct
            WHERE code_13_ref LIKE $1
          )
          SELECT name, code_13_ref, brand_lab, universe
          FROM ranked_products
          WHERE rn = 1
          ORDER BY code_13_ref
          LIMIT 100
        `;
        params = [`%${codeDigits}`];
      } else {
        return NextResponse.json({ products: [] });
      }
      
    } else {
      if (!session.user.pharmacyId) {
        return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });
      }

      if (isKeywordNameSearch) {
        const keywords = extractKeywords(trimmedQuery);
        const { condition, params: keywordParams } = buildKeywordSearch(keywords, false);
        
        sqlQuery = `
          SELECT 
            dip.name,
            dip.code_13_ref_id as code_13_ref,
            dgp.brand_lab,
            dgp.universe
          FROM data_internalproduct dip
          LEFT JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
          WHERE dip.pharmacy_id = $1 AND ${condition}
          ORDER BY 
            CASE 
              WHEN LOWER(dip.name) LIKE LOWER($${keywords.length + 2}) THEN 1
              ELSE 2
            END,
            dip.name
          LIMIT 100
        `;
        params = [session.user.pharmacyId, ...keywordParams, `%${trimmedQuery}%`];
        
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
    const result: any = await db.query(sqlQuery, params);
    const queryTime = Date.now() - startTime;

    const products: ProductResult[] = Array.isArray(result) 
      ? result 
      : (result && Array.isArray(result.rows) ? result.rows : []);

    console.log(`🔍 [API] Search results:`, {
      query: trimmedQuery,
      type: isKeywordNameSearch ? 'keywords' : isStartCodeSearch ? 'code_start' : 'code_end',
      keywords: isKeywordNameSearch ? extractKeywords(trimmedQuery) : undefined,
      count: products.length,
      queryTime,
      firstResult: products[0]?.name
    });

    return NextResponse.json({
      products,
      count: products.length,
      queryTime,
      searchType: isKeywordNameSearch ? 'keywords' : isStartCodeSearch ? 'code_start' : 'code_end'
    });

  } catch (error) {
    console.error('🚨 [API] Products search error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: process.env.NODE_ENV === 'development' ? error : undefined },
      { status: 500 }
    );
  }
}