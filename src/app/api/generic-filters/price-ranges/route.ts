// src/app/api/generic-filters/price-ranges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PriceRange {
  min: number | null;
  max: number | null;
}

interface PriceFilters {
  prixFabricant: PriceRange;
  prixNetRemise: PriceRange;
  remise: PriceRange;
}

interface RequestBody {
  productCodes: string[] | null;  // null = chercher dans toute la base
  priceFilters: PriceFilters;
}

/**
 * API Route - Filtrage produits par tranches de prix
 * 
 * POST /api/generic-filters/price-ranges
 * Body: { productCodes: string[], priceFilters: PriceFilters }
 * 
 * Filtre les produits selon :
 * - Prix fabricant (prix_achat_ht_fabricant)
 * - Prix net remise (prix_achat_ht_moyen)
 * - Remise (remise)
 * 
 * Applique une intersection (ET) des filtres actifs
 */
export async function POST(request: NextRequest) {
  console.log('');
  console.log('🔵 [API /price-ranges] ========================================');
  console.log('🔵 [API /price-ranges] NEW REQUEST');
  console.log('🔵 [API /price-ranges] ========================================');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('❌ [API /price-ranges] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productCodes, priceFilters }: RequestBody = await request.json();
    
    const isGlobalSearch = productCodes === null;
    
    console.log('📊 [API /price-ranges] Request body:', {
      mode: isGlobalSearch ? 'GLOBAL (all generics/referents)' : 'FILTERED (specific codes)',
      productCodesCount: productCodes?.length || 'ALL',
      priceFilters
    });
    
    if (!isGlobalSearch && productCodes.length === 0) {
      console.log('⚠️ [API /price-ranges] No product codes provided, returning empty array');
      return NextResponse.json({ productCodes: [] });
    }

    // Construction des conditions WHERE dynamiques
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    console.log('🔨 [API /price-ranges] Building SQL conditions...');
    
    // Condition de base : seulement génériques et référents
    if (isGlobalSearch) {
      console.log('  🌍 GLOBAL MODE: Searching ALL generic/referent products');
      conditions.push(`bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')`);
    } else {
      console.log(`  🎯 FILTERED MODE: Searching within ${productCodes.length} specific codes`);
      conditions.push(`code_13_ref = ANY($${paramIndex}::text[])`);
      params.push(productCodes);
      paramIndex++;
    }

    // Filtre prix fabricant
    if (priceFilters.prixFabricant.min !== null) {
      conditions.push(`prix_achat_ht_fabricant >= $${paramIndex}`);
      params.push(priceFilters.prixFabricant.min);
      console.log(`  ✓ Prix fabricant MIN: ${priceFilters.prixFabricant.min}€`);
      paramIndex++;
    }
    if (priceFilters.prixFabricant.max !== null) {
      conditions.push(`prix_achat_ht_fabricant <= $${paramIndex}`);
      params.push(priceFilters.prixFabricant.max);
      console.log(`  ✓ Prix fabricant MAX: ${priceFilters.prixFabricant.max}€`);
      paramIndex++;
    }

    // Filtre prix net remise
    if (priceFilters.prixNetRemise.min !== null) {
      conditions.push(`prix_achat_ht_moyen >= $${paramIndex}`);
      params.push(priceFilters.prixNetRemise.min);
      console.log(`  ✓ Prix net MIN: ${priceFilters.prixNetRemise.min}€`);
      paramIndex++;
    }
    if (priceFilters.prixNetRemise.max !== null) {
      conditions.push(`prix_achat_ht_moyen <= $${paramIndex}`);
      params.push(priceFilters.prixNetRemise.max);
      console.log(`  ✓ Prix net MAX: ${priceFilters.prixNetRemise.max}€`);
      paramIndex++;
    }

    // Filtre remise
    if (priceFilters.remise.min !== null) {
      conditions.push(`remise >= $${paramIndex}`);
      params.push(priceFilters.remise.min);
      console.log(`  ✓ Remise MIN: ${priceFilters.remise.min}%`);
      paramIndex++;
    }
    if (priceFilters.remise.max !== null) {
      conditions.push(`remise <= $${paramIndex}`);
      params.push(priceFilters.remise.max);
      console.log(`  ✓ Remise MAX: ${priceFilters.remise.max}%`);
      paramIndex++;
    }

    // Si mode global et aucun filtre prix, retourner tous les génériques/référents
    if (isGlobalSearch && conditions.length === 1) {
      console.log('⚠️ [API /price-ranges] Global mode but no price filters → would return ALL generics/referents');
      console.log('⚠️ [API /price-ranges] This is probably not intended, returning empty array');
      return NextResponse.json({ productCodes: [] });
    }
    
    // Si mode filtré et aucun filtre prix, retourner tous les codes fournis
    if (!isGlobalSearch && conditions.length === 1) {
      console.log('⚠️ [API /price-ranges] Filtered mode but no price filters, returning all input codes');
      return NextResponse.json({ productCodes });
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT code_13_ref
      FROM data_globalproduct
      WHERE ${whereClause}
    `;

    console.log('📝 [API /price-ranges] SQL Query:', {
      mode: isGlobalSearch ? 'GLOBAL' : 'FILTERED',
      conditions: conditions.length,
      whereClause,
      paramsCount: params.length
    });
    
    console.log('🔍 [API /price-ranges] Full SQL:');
    console.log(query);

    const startTime = Date.now();
    const result = await db.query<{ code_13_ref: string }>(query, params);
    const duration = Date.now() - startTime;
    
    const filteredCodes = result.map(row => row.code_13_ref);

    if (isGlobalSearch) {
      console.log('✅ [API /price-ranges] GLOBAL search completed:', {
        duration: `${duration}ms`,
        totalFound: filteredCodes.length
      });
    } else {
      console.log('✅ [API /price-ranges] FILTERED search completed:', {
        duration: `${duration}ms`,
        inputCodes: productCodes!.length,
        outputCodes: filteredCodes.length,
        filtered: productCodes!.length - filteredCodes.length,
        percentage: `${((filteredCodes.length / productCodes!.length) * 100).toFixed(1)}%`
      });
    }
    
    console.log('🔵 [API /price-ranges] ========================================');
    console.log('');

    return NextResponse.json({ productCodes: filteredCodes });

  } catch (error) {
    console.error('❌ [API /price-ranges] ERROR:', error);
    console.log('🔵 [API /price-ranges] ========================================');
    console.log('');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}