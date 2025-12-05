// src/app/api/price-increase/sales-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSecurityContext } from '@/lib/api-security';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SalesDataRequest {
    code_eans: string[];
    date_start: string;
    date_end: string;
}

interface ProductSalesData {
    code_ean: string;
    nom_produit: string;
    laboratoire: string;
    quantite_vendue: number;
    ca_ttc: number;
    prix_vente_moyen_ttc: number;
    prix_achat_moyen_ht: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();

    try {
        console.log('📊 [API Price Increase Sales] Request started');

        // Sécurité
        const context = await getSecurityContext();
        if (!context) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Récupération des paramètres
        const body: SalesDataRequest = await request.json();
        const { code_eans, date_start, date_end } = body;

        if (!code_eans || code_eans.length === 0) {
            return NextResponse.json({ error: 'code_eans required' }, { status: 400 });
        }

        if (!date_start || !date_end) {
            return NextResponse.json({ error: 'date_start and date_end required' }, { status: 400 });
        }

        console.log('📥 [API Price Increase Sales] Params:', {
            codeEansCount: code_eans.length,
            dateStart: date_start,
            dateEnd: date_end,
            isAdmin: context.isAdmin
        });

        // Filtre pharmacie (sécurité)
        let pharmacyFilter = '';
        let params: any[];

        if (context.isAdmin) {
            params = [date_start, date_end, code_eans];
        } else {
            pharmacyFilter = 'AND ip.pharmacy_id = $4::uuid';
            params = [date_start, date_end, code_eans, context.pharmacyId];
        }

        // Requête SQL inspirée de products/list/route.ts
        const query = `
      WITH product_sales AS (
        SELECT 
          ip.code_13_ref_id,
          SUM(s.quantity) as total_quantity_sold,
          SUM(s.quantity * s.unit_price_ttc) as total_ca_ttc,
          AVG(s.unit_price_ttc) as avg_sell_price_ttc,
          AVG(ins.weighted_average_price) as avg_buy_price_ht,
          AVG(COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 20)) as avg_tva_rate
        FROM data_sales s
        INNER JOIN data_inventorysnapshot ins ON s.product_id = ins.id
        INNER JOIN data_internalproduct ip ON ins.product_id = ip.id
        LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
        WHERE s.date >= $1::date AND s.date <= $2::date
          AND s.unit_price_ttc IS NOT NULL
          AND s.unit_price_ttc > 0
          AND ins.weighted_average_price > 0
          AND ip.code_13_ref_id = ANY($3::text[])
          ${pharmacyFilter}
        GROUP BY ip.code_13_ref_id
      )
      SELECT 
        gp.code_13_ref as code_ean,
        gp.name as nom_produit,
        gp.bcb_lab as laboratoire,
        COALESCE(ps.total_quantity_sold, 0) as quantite_vendue,
        COALESCE(ps.total_ca_ttc, 0) as ca_ttc,
        COALESCE(ps.avg_sell_price_ttc, 0) as prix_vente_moyen_ttc,
        COALESCE(ps.avg_buy_price_ht, 0) as prix_achat_moyen_ht
      FROM data_globalproduct gp
      LEFT JOIN product_sales ps ON gp.code_13_ref = ps.code_13_ref_id
      WHERE gp.code_13_ref = ANY($3::text[])
      ORDER BY ps.total_quantity_sold DESC NULLS LAST
    `;

        const results = await db.query<ProductSalesData>(query, params);

        console.log('✅ [API Price Increase Sales] Query success:', {
            productsFound: results.length,
            duration: Date.now() - startTime
        });

        return NextResponse.json({
            data: results,
            queryTime: Date.now() - startTime
        });

    } catch (error) {
        console.error('💥 [API Price Increase Sales] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', queryTime: Date.now() - startTime },
            { status: 500 }
        );
    }
}
