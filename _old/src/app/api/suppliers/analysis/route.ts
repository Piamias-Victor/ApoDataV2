// src/app/api/suppliers/analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SupplierMetrics {
  readonly supplier_category: string;
  readonly nb_commandes: number;
  readonly quantity_bought: number;
  readonly ca_achats: number;
  readonly nb_produits_distincts: number;
}

interface RequestBody {
  readonly dateRange: { start: string; end: string };
  readonly pharmacyIds?: string[];
  readonly productCodes?: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { dateRange, pharmacyIds = [], productCodes = [] } = body;

    if (!dateRange?.start || !dateRange?.end) {
      return NextResponse.json({ error: 'Date range required' }, { status: 400 });
    }

    const isAdmin = session.user.role === 'admin';
    const effectivePharmacyIds = isAdmin 
      ? pharmacyIds 
      : (session.user.pharmacyId ? [session.user.pharmacyId] : []);

    const hasPharmacyFilter = effectivePharmacyIds.length > 0;
    const hasProductFilter = productCodes.length > 0;

    const pharmacyFilter = hasPharmacyFilter 
      ? `AND ip.pharmacy_id = ANY($3::uuid[])`
      : '';

    let paramIndex = 3;
    if (hasPharmacyFilter) paramIndex++;

    const productFilter = hasProductFilter
      ? `AND ip.code_13_ref_id = ANY($${paramIndex}::text[])`
      : '';

    if (hasProductFilter) paramIndex++;

    const query = `
      WITH supplier_orders AS (
        SELECT 
          o.id as order_id,
          CASE 
            WHEN s.name ILIKE '%OCP%' OR s.name ILIKE '%OCR%' THEN 'OCP'
            WHEN s.name ILIKE '%ALLIANCE%' THEN 'ALLIANCE'
            WHEN s.name ILIKE '%CERP%' THEN 'CERP'
            ELSE 'AUTRE'
          END as supplier_category,
          po.product_id,
          po.qte_r,
          COALESCE(closest_snap.weighted_average_price, 0) as unit_price
        FROM data_order o
        INNER JOIN data_supplier s ON o.supplier_id = s.id
        INNER JOIN data_productorder po ON po.order_id = o.id
        INNER JOIN data_internalproduct ip ON po.product_id = ip.id
        INNER JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
        LEFT JOIN LATERAL (
          SELECT weighted_average_price
          FROM data_inventorysnapshot ins
          WHERE ins.product_id = po.product_id
            AND ins.weighted_average_price > 0
          ORDER BY ins.date DESC
          LIMIT 1
        ) closest_snap ON true
        WHERE o.delivery_date >= $1::date 
          AND o.delivery_date <= $2::date
          AND o.delivery_date IS NOT NULL
          AND po.qte_r > 0
          AND dgp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')
          ${pharmacyFilter}
          ${productFilter}
      )
      SELECT 
        supplier_category,
        COUNT(DISTINCT order_id) as nb_commandes,
        SUM(qte_r) as quantity_bought,
        SUM(qte_r * unit_price) as ca_achats,
        COUNT(DISTINCT product_id) as nb_produits_distincts
      FROM supplier_orders
      GROUP BY supplier_category
      ORDER BY 
        CASE supplier_category
          WHEN 'OCP' THEN 1
          WHEN 'ALLIANCE' THEN 2
          WHEN 'CERP' THEN 3
          WHEN 'AUTRE' THEN 4
        END;
    `;

    const params: any[] = [dateRange.start, dateRange.end];
    if (hasPharmacyFilter) params.push(effectivePharmacyIds);
    if (hasProductFilter) params.push(productCodes);

    const result = await db.query<SupplierMetrics>(query, params);

    const suppliers = result.map(row => ({
      supplier_category: row.supplier_category,
      nb_commandes: Number(row.nb_commandes),
      quantity_bought: Number(row.quantity_bought),
      ca_achats: Number(row.ca_achats),
      nb_produits_distincts: Number(row.nb_produits_distincts)
    }));

    const total = {
      nb_commandes: suppliers.reduce((sum, s) => sum + s.nb_commandes, 0),
      quantity_bought: suppliers.reduce((sum, s) => sum + s.quantity_bought, 0),
      ca_achats: suppliers.reduce((sum, s) => sum + s.ca_achats, 0),
      nb_produits_distincts: suppliers.reduce((sum, s) => sum + s.nb_produits_distincts, 0)
    };

    return NextResponse.json({ suppliers, total });

  } catch (error) {
    console.error('Supplier analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}