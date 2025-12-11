// src/app/api/products/tva-counts/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

const TVA_RATES = [0, 2.1, 5.5, 10, 20];

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Count products for each TVA rate (grouped by bcb_product_id)
        const counts: Record<number, number> = {};

        for (const rate of TVA_RATES) {
            const result = await query(
                `
                WITH ranked_products AS (
                    SELECT 
                        bcb_product_id,
                        ROW_NUMBER() OVER (
                            PARTITION BY bcb_product_id 
                            ORDER BY LENGTH(code_13_ref) DESC, code_13_ref DESC
                        ) as rn
                    FROM data_globalproduct
                    WHERE bcb_tva_rate = $1
                      AND bcb_product_id IS NOT NULL
                )
                SELECT COUNT(*) as count
                FROM ranked_products
                WHERE rn = 1
                `,
                [rate]
            );

            counts[rate] = parseInt(result.rows[0]?.count || '0');
        }

        return NextResponse.json({ counts });

    } catch (error) {
        console.error('Error fetching TVA counts:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
