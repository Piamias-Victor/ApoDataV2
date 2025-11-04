// src/app/api/generic-filters/price-ranges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PriceRange {
  readonly min: number | null;
  readonly max: number | null;
}

interface PriceFilters {
  readonly prixFabricant: PriceRange;
  readonly prixNetRemise: PriceRange;
  readonly remise: PriceRange;
}

type GenericStatus = 'BOTH' | 'GÉNÉRIQUE' | 'RÉFÉRENT';

interface RequestBody {
  readonly productCodes: string[] | null;
  readonly priceFilters: PriceFilters;
  readonly tvaRates: number[];
  readonly genericStatus: GenericStatus;
  readonly dateRange: { start: string; end: string };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('');
    console.log('🚀 [price-ranges API] ========================================');
    console.log('🚀 [price-ranges API] NEW REQUEST');
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('❌ [price-ranges API] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { productCodes, priceFilters, tvaRates, genericStatus, dateRange } = body;

    console.log('📊 [price-ranges API] Request params:', {
      productCodes: productCodes ? `${productCodes.length} codes` : 'ALL (global mode)',
      dateRange,
      priceFilters,
      tvaRates,
      genericStatus,
      user: session.user.email,
      role: session.user.role
    });

    // Validation
    if (!dateRange?.start || !dateRange?.end) {
      console.log('❌ [price-ranges API] Missing dateRange');
      return NextResponse.json({ error: 'Date range required' }, { status: 400 });
    }

    const isAdmin = session.user.role === 'admin';
    const pharmacyId = session.user.pharmacyId;

    // Construction des filtres SQL pour prix
    const priceFilterConditions: string[] = [];
    
    if (priceFilters.prixFabricant.min !== null) {
      priceFilterConditions.push(`prix_brut_grossiste >= ${priceFilters.prixFabricant.min}`);
    }
    if (priceFilters.prixFabricant.max !== null) {
      priceFilterConditions.push(`prix_brut_grossiste <= ${priceFilters.prixFabricant.max}`);
    }
    if (priceFilters.prixNetRemise.min !== null) {
      priceFilterConditions.push(`avg_buy_price_ht >= ${priceFilters.prixNetRemise.min}`);
    }
    if (priceFilters.prixNetRemise.max !== null) {
      priceFilterConditions.push(`avg_buy_price_ht <= ${priceFilters.prixNetRemise.max}`);
    }
    if (priceFilters.remise.min !== null) {
      priceFilterConditions.push(`remise_percent >= ${priceFilters.remise.min}`);
    }
    if (priceFilters.remise.max !== null) {
      priceFilterConditions.push(`remise_percent <= ${priceFilters.remise.max}`);
    }

    const priceFilterSQL = priceFilterConditions.length > 0 
      ? `AND ${priceFilterConditions.join(' AND ')}`
      : '';

    // 🔥 MODIFIÉ - Filtre TVA appliqué EN DEHORS de la CTE
    const tvaFilterSQL = tvaRates && tvaRates.length > 0
      ? `AND tva_percentage = ANY(ARRAY[${tvaRates.join(', ')}])`
      : '';

    // Filtre statut générique
    let genericStatusSQL = '';
    if (genericStatus === 'GÉNÉRIQUE') {
      genericStatusSQL = "AND dgp.bcb_generic_status = 'GÉNÉRIQUE'";
    } else if (genericStatus === 'RÉFÉRENT') {
      genericStatusSQL = "AND dgp.bcb_generic_status = 'RÉFÉRENT'";
    } else {
      genericStatusSQL = "AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')";
    }

    console.log('🔍 [price-ranges API] Filters SQL:', {
      price: priceFilterSQL || 'NONE',
      tva: tvaFilterSQL || 'NONE',
      status: genericStatusSQL
    });

    let query: string;
    let params: any[];

    if (isAdmin) {
      // MODE ADMIN (toutes pharmacies)
      if (productCodes === null || productCodes.length === 0) {
        // MODE GLOBAL : Calculer pour TOUS les génériques/référents
        console.log('🌍 [price-ranges API] ADMIN - GLOBAL MODE');
        
        query = `
          WITH product_purchases AS (
            SELECT 
              dgp.code_13_ref,
              dgp.tva_percentage,
              pbcb.prix_achat_ht_fabricant as prix_brut_grossiste,
              AVG(COALESCE(closest_snap.weighted_average_price, 0)) as avg_buy_price_ht,
              CASE 
                WHEN pbcb.prix_achat_ht_fabricant IS NOT NULL 
                  AND pbcb.prix_achat_ht_fabricant > 0 
                  AND AVG(COALESCE(closest_snap.weighted_average_price, 0)) > 0
                THEN ((pbcb.prix_achat_ht_fabricant - AVG(COALESCE(closest_snap.weighted_average_price, 0))) / pbcb.prix_achat_ht_fabricant) * 100
                ELSE 0
              END as remise_percent
            FROM data_productorder po
            JOIN data_order o ON po.order_id = o.id
            JOIN data_internalproduct ip ON po.product_id = ip.id
            JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
            LEFT JOIN data_globalproduct_prices_bcb pbcb ON dgp.code_13_ref = pbcb.code_13_ref
            LEFT JOIN LATERAL (
              SELECT weighted_average_price
              FROM data_inventorysnapshot ins2
              WHERE ins2.product_id = po.product_id
                AND ins2.weighted_average_price > 0
              ORDER BY ins2.date DESC
              LIMIT 1
            ) closest_snap ON true
            WHERE o.delivery_date >= $1::date 
              AND o.delivery_date <= $2::date
              AND o.delivery_date IS NOT NULL
              AND po.qte_r > 0
              ${genericStatusSQL}
              AND dgp.bcb_lab IS NOT NULL
              AND dgp.bcb_generic_group IS NOT NULL
            GROUP BY dgp.code_13_ref, dgp.tva_percentage, pbcb.prix_achat_ht_fabricant
            HAVING AVG(COALESCE(closest_snap.weighted_average_price, 0)) > 0
          )
          SELECT code_13_ref
          FROM product_purchases
          WHERE 1=1
            ${priceFilterSQL}
            ${tvaFilterSQL}
        `;

        params = [dateRange.start, dateRange.end];

      } else {
        // MODE SÉLECTION : Calculer pour les productCodes fournis
        console.log(`🎯 [price-ranges API] ADMIN - SELECTION MODE (${productCodes.length} codes)`);
        
        query = `
          WITH product_purchases AS (
            SELECT 
              dgp.code_13_ref,
              dgp.tva_percentage,
              pbcb.prix_achat_ht_fabricant as prix_brut_grossiste,
              AVG(COALESCE(closest_snap.weighted_average_price, 0)) as avg_buy_price_ht,
              CASE 
                WHEN pbcb.prix_achat_ht_fabricant IS NOT NULL 
                  AND pbcb.prix_achat_ht_fabricant > 0 
                  AND AVG(COALESCE(closest_snap.weighted_average_price, 0)) > 0
                THEN ((pbcb.prix_achat_ht_fabricant - AVG(COALESCE(closest_snap.weighted_average_price, 0))) / pbcb.prix_achat_ht_fabricant) * 100
                ELSE 0
              END as remise_percent
            FROM data_productorder po
            JOIN data_order o ON po.order_id = o.id
            JOIN data_internalproduct ip ON po.product_id = ip.id
            JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
            LEFT JOIN data_globalproduct_prices_bcb pbcb ON dgp.code_13_ref = pbcb.code_13_ref
            LEFT JOIN LATERAL (
              SELECT weighted_average_price
              FROM data_inventorysnapshot ins2
              WHERE ins2.product_id = po.product_id
                AND ins2.weighted_average_price > 0
              ORDER BY ins2.date DESC
              LIMIT 1
            ) closest_snap ON true
            WHERE o.delivery_date >= $1::date 
              AND o.delivery_date <= $2::date
              AND o.delivery_date IS NOT NULL
              AND po.qte_r > 0
              AND ip.code_13_ref_id = ANY($3::text[])
              ${genericStatusSQL}
            GROUP BY dgp.code_13_ref, dgp.tva_percentage, pbcb.prix_achat_ht_fabricant
            HAVING AVG(COALESCE(closest_snap.weighted_average_price, 0)) > 0
          )
          SELECT code_13_ref
          FROM product_purchases
          WHERE 1=1
            ${priceFilterSQL}
            ${tvaFilterSQL}
        `;

        params = [dateRange.start, dateRange.end, productCodes];
      }

    } else {
      // MODE NON-ADMIN (filtre pharmacy obligatoire)
      if (!pharmacyId) {
        console.log('❌ [price-ranges API] Non-admin without pharmacyId');
        return NextResponse.json({ error: 'Pharmacy ID required' }, { status: 400 });
      }

      if (productCodes === null || productCodes.length === 0) {
        // MODE GLOBAL : Calculer pour TOUS les génériques/référents de cette pharmacie
        console.log('🌍 [price-ranges API] NON-ADMIN - GLOBAL MODE');
        
        query = `
          WITH product_purchases AS (
            SELECT 
              dgp.code_13_ref,
              dgp.tva_percentage,
              pbcb.prix_achat_ht_fabricant as prix_brut_grossiste,
              AVG(COALESCE(closest_snap.weighted_average_price, 0)) as avg_buy_price_ht,
              CASE 
                WHEN pbcb.prix_achat_ht_fabricant IS NOT NULL 
                  AND pbcb.prix_achat_ht_fabricant > 0 
                  AND AVG(COALESCE(closest_snap.weighted_average_price, 0)) > 0
                THEN ((pbcb.prix_achat_ht_fabricant - AVG(COALESCE(closest_snap.weighted_average_price, 0))) / pbcb.prix_achat_ht_fabricant) * 100
                ELSE 0
              END as remise_percent
            FROM data_productorder po
            JOIN data_order o ON po.order_id = o.id
            JOIN data_internalproduct ip ON po.product_id = ip.id
            JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
            LEFT JOIN data_globalproduct_prices_bcb pbcb ON dgp.code_13_ref = pbcb.code_13_ref
            LEFT JOIN LATERAL (
              SELECT weighted_average_price
              FROM data_inventorysnapshot ins2
              WHERE ins2.product_id = po.product_id
                AND ins2.weighted_average_price > 0
              ORDER BY ins2.date DESC
              LIMIT 1
            ) closest_snap ON true
            WHERE o.delivery_date >= $1::date 
              AND o.delivery_date <= $2::date
              AND o.delivery_date IS NOT NULL
              AND po.qte_r > 0
              AND ip.pharmacy_id = $3::uuid
              ${genericStatusSQL}
              AND dgp.bcb_lab IS NOT NULL
              AND dgp.bcb_generic_group IS NOT NULL
            GROUP BY dgp.code_13_ref, dgp.tva_percentage, pbcb.prix_achat_ht_fabricant
            HAVING AVG(COALESCE(closest_snap.weighted_average_price, 0)) > 0
          )
          SELECT code_13_ref
          FROM product_purchases
          WHERE 1=1
            ${priceFilterSQL}
            ${tvaFilterSQL}
        `;

        params = [dateRange.start, dateRange.end, pharmacyId];

      } else {
        // MODE SÉLECTION : Calculer pour les productCodes fournis
        console.log(`🎯 [price-ranges API] NON-ADMIN - SELECTION MODE (${productCodes.length} codes)`);
        
        query = `
          WITH product_purchases AS (
            SELECT 
              dgp.code_13_ref,
              dgp.tva_percentage,
              pbcb.prix_achat_ht_fabricant as prix_brut_grossiste,
              AVG(COALESCE(closest_snap.weighted_average_price, 0)) as avg_buy_price_ht,
              CASE 
                WHEN pbcb.prix_achat_ht_fabricant IS NOT NULL 
                  AND pbcb.prix_achat_ht_fabricant > 0 
                  AND AVG(COALESCE(closest_snap.weighted_average_price, 0)) > 0
                THEN ((pbcb.prix_achat_ht_fabricant - AVG(COALESCE(closest_snap.weighted_average_price, 0))) / pbcb.prix_achat_ht_fabricant) * 100
                ELSE 0
              END as remise_percent
            FROM data_productorder po
            JOIN data_order o ON po.order_id = o.id
            JOIN data_internalproduct ip ON po.product_id = ip.id
            JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
            LEFT JOIN data_globalproduct_prices_bcb pbcb ON dgp.code_13_ref = pbcb.code_13_ref
            LEFT JOIN LATERAL (
              SELECT weighted_average_price
              FROM data_inventorysnapshot ins2
              WHERE ins2.product_id = po.product_id
                AND ins2.weighted_average_price > 0
              ORDER BY ins2.date DESC
              LIMIT 1
            ) closest_snap ON true
            WHERE o.delivery_date >= $1::date 
              AND o.delivery_date <= $2::date
              AND o.delivery_date IS NOT NULL
              AND po.qte_r > 0
              AND ip.pharmacy_id = $3::uuid
              AND ip.code_13_ref_id = ANY($4::text[])
              ${genericStatusSQL}
            GROUP BY dgp.code_13_ref, dgp.tva_percentage, pbcb.prix_achat_ht_fabricant
            HAVING AVG(COALESCE(closest_snap.weighted_average_price, 0)) > 0
          )
          SELECT code_13_ref
          FROM product_purchases
          WHERE 1=1
            ${priceFilterSQL}
            ${tvaFilterSQL}
        `;

        params = [dateRange.start, dateRange.end, pharmacyId, productCodes];
      }
    }

    console.log('🔄 [price-ranges API] Executing query...');
    const startTime = Date.now();
    
    const result = await db.query<{ code_13_ref: string }>(query, params);
    
    const duration = Date.now() - startTime;
    const filteredCodes = result.map(row => row.code_13_ref);

    console.log('✅ [price-ranges API] Query success:', {
      duration: `${duration}ms`,
      codesFound: filteredCodes.length,
      inputCodes: productCodes ? productCodes.length : 'ALL',
      filters: {
        price: priceFilterConditions.length > 0,
        tva: tvaRates && tvaRates.length > 0,
        status: genericStatus !== 'BOTH'
      }
    });
    console.log('🚀 [price-ranges API] ========================================');
    console.log('');

    return NextResponse.json({
      productCodes: filteredCodes
    });

  } catch (error) {
    console.error('❌ [price-ranges API] ERROR:', error);
    console.log('🚀 [price-ranges API] ========================================');
    console.log('');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}