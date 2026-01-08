import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const query = `
            SELECT 
                product_label,
                SUM(ttc_sold) as total_sales,
                SUM(qty_sold) as total_qty
            FROM mv_product_stats_daily
            WHERE laboratory_name = 'Non défini'
            GROUP BY product_label
            ORDER BY total_sales DESC
            LIMIT 10
        `;
        const result = await db.query(query);
        return NextResponse.json({ products: result.rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
