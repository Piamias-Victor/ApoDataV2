
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

interface ComparisonEntity {
    id: string;
    type: 'PRODUCT' | 'LABORATORY' | 'CATEGORY';
    sourceIds: string[];
}

interface DateRange {
    from: string;
    to: string;
}

interface RequestBody {
    entities: ComparisonEntity[];
    dateRange: DateRange;
    pharmacyId?: string;
}

async function fetchEntityEvolution(entity: ComparisonEntity, dateRange: DateRange, pharmacyId: string | null) {
    const start = new Date(dateRange.from);
    const end = new Date(dateRange.to);

    const params: any[] = [start, end];

    let pharmacyClause = '1=1';
    if (pharmacyId) {
        params.push(pharmacyId);
        pharmacyClause = `mv.pharmacy_id = $${params.length}`;
    }

    let entityJoin = '';
    let entityWhere = '';

    if (entity.type === 'PRODUCT') {
        entityJoin = `
            JOIN data_internalproduct ip ON mv.product_id = ip.id
            JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
        `;
        params.push(entity.sourceIds);
        entityWhere = `gp.bcb_product_id::text = ANY($${params.length}::text[])`;

    } else if (entity.type === 'LABORATORY') {
        entityJoin = `
            JOIN data_internalproduct ip ON mv.product_id = ip.id
            JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
        `;
        params.push(entity.sourceIds);
        entityWhere = `mv.laboratory_name = ANY($${params.length}::text[])`;

    } else if (entity.type === 'CATEGORY') {
        entityJoin = `
            JOIN data_internalproduct ip ON mv.product_id = ip.id
            JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
        `;
        params.push(entity.sourceIds);
        const p = `$${params.length}::text[]`;

        entityWhere = `(
            gp.bcb_segment_l0 = ANY(${p}) OR
            gp.bcb_segment_l1 = ANY(${p}) OR
            gp.bcb_segment_l2 = ANY(${p}) OR
            gp.bcb_segment_l3 = ANY(${p}) OR
            gp.bcb_segment_l4 = ANY(${p}) OR
            gp.bcb_segment_l5 = ANY(${p}) OR
            gp.bcb_family     = ANY(${p})
        )`;
    }

    const query = `
        SELECT
            TO_CHAR(month, 'YYYY-MM-DD') as date,
            SUM(mv.ht_sold) as sales_ht,
            SUM(mv.margin_sold) as margin_eur,
            SUM(mv.qty_sold) as qty_sold
        FROM mv_product_stats_monthly mv
        ${entityJoin}
        WHERE 
            month >= $1 AND month <= $2
            AND ${pharmacyClause}
            AND ${entityWhere}
        GROUP BY month
        ORDER BY month ASC
    `;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
        date: row.date,
        sales_ht: Number(row.sales_ht) || 0,
        margin_eur: Number(row.margin_eur) || 0,
        qty_sold: Number(row.qty_sold) || 0
    }));
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body: RequestBody = await req.json();
        const { entities, dateRange, pharmacyId } = body;

        if (!entities || !Array.isArray(entities) || entities.length === 0) {
            return NextResponse.json({ error: 'No entities provided' }, { status: 400 });
        }

        const targetPharmacyId = pharmacyId || session.user.pharmacyId || null;

        const results = await Promise.all(
            entities.map(async (entity) => {
                const evolution = await fetchEntityEvolution(entity, dateRange, targetPharmacyId);
                return {
                    entityId: entity.id,
                    evolution
                };
            })
        );

        return NextResponse.json({ results });

    } catch (error) {
        console.error('Error in comparison evolution:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
