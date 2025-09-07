// src/app/api/products/bulk-search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface BulkSearchRequest {
  readonly codes: string[];
}

interface ProductResult {
  readonly name: string;
  readonly code_13_ref: string;
  readonly brand_lab?: string;
  readonly universe?: string;
}

interface BulkSearchResponse {
  readonly found: ProductResult[];
  readonly notFound: string[];
  readonly totalSearched: number;
  readonly queryTime: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { codes }: BulkSearchRequest = await request.json();

    if (!Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        { error: 'Codes requis' },
        { status: 400 }
      );
    }

    if (codes.length > 1000) {
      return NextResponse.json(
        { error: 'Maximum 1000 codes par requête' },
        { status: 400 }
      );
    }

    const cleanCodes = codes
      .map(code => code.trim())
      .filter(code => code.length > 0);

    if (cleanCodes.length === 0) {
      return NextResponse.json({
        found: [],
        notFound: codes,
        totalSearched: codes.length,
        queryTime: 0
      });
    }

    console.log(`🚀 [API] Bulk search for ${cleanCodes.length} codes`);

    const startTime = Date.now();
    const isAdmin = session.user.role === 'admin';

    let sqlQuery: string;
    let params: any[];

    if (isAdmin) {
      // Admin : recherche globale
      sqlQuery = `
        SELECT name, code_13_ref, brand_lab, universe
        FROM data_globalproduct
        WHERE code_13_ref = ANY($1::text[])
        ORDER BY code_13_ref
      `;
      params = [cleanCodes];
    } else {
      // User : recherche par pharmacie
      if (!session.user.pharmacyId) {
        return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });
      }

      sqlQuery = `
        SELECT 
          dip.name,
          dip.code_13_ref_id as code_13_ref,
          dgp.brand_lab,
          dgp.universe
        FROM data_internalproduct dip
        LEFT JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
        WHERE dip.pharmacy_id = $1
          AND dip.code_13_ref_id = ANY($2::text[])
        ORDER BY dip.code_13_ref_id
      `;
      params = [session.user.pharmacyId, cleanCodes];
    }

    const result: any = await db.query(sqlQuery, params);
    const queryTime = Date.now() - startTime;

    const foundProducts: ProductResult[] = Array.isArray(result) 
      ? result 
      : (result && Array.isArray(result.rows) ? result.rows : []);

    // Identifier les codes non trouvés
    const foundCodes = new Set(foundProducts.map(p => p.code_13_ref));
    const notFoundCodes = cleanCodes.filter(code => !foundCodes.has(code));

    const response: BulkSearchResponse = {
      found: foundProducts,
      notFound: notFoundCodes,
      totalSearched: cleanCodes.length,
      queryTime
    };

    console.log(`✅ [API] Bulk search results:`, {
      requested: cleanCodes.length,
      found: foundProducts.length,
      notFound: notFoundCodes.length,
      queryTime: `${queryTime}ms`,
      userType: isAdmin ? 'admin' : 'user',
      performance: queryTime < 1000 ? '🚀 EXCELLENT' : queryTime < 3000 ? '✅ GOOD' : '⚠️ SLOW'
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('🚨 [API] Bulk search error:', error);
    return NextResponse.json(
      { 
        error: 'Erreur serveur', 
        details: process.env.NODE_ENV === 'development' ? error : undefined 
      },
      { status: 500 }
    );
  }
}