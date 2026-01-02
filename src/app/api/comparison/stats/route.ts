import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

interface ComparisonEntity {
    id: string; // The ID from the store (timestamp)
    type: 'PRODUCT' | 'LABORATORY' | 'CATEGORY';
    sourceIds: string[]; // IDs to filter by (e.g. ['doliprane', 'efferalgan'])
}

interface DateRange {
    from: string;
    to: string;
}

interface RequestBody {
    entities: ComparisonEntity[];
    dateRange: DateRange;
    pharmacyId?: string; // Optional specific pharmacy override
}

// Helper to convert array of strings to SQL array string or parameters
// We will use parameterized queries strictly.

async function fetchEntityStats(entity: ComparisonEntity, dateRange: DateRange, pharmacyId: string | null) {
    const start = new Date(dateRange.from);
    const end = new Date(dateRange.to);

    // N-1 Period
    const prevStart = new Date(start);
    prevStart.setFullYear(start.getFullYear() - 1);
    const prevEnd = new Date(end);
    prevEnd.setFullYear(end.getFullYear() - 1);

    const params: any[] = [start, end, prevStart, prevEnd];

    // Base Pharmacy Filter
    // If pharmacyId is provided (user context), filter by it.
    // If not (e.g. admin viewing all data? or just context), handle accordingly.
    // Assuming context provides the main pharmacyId unless user is admin viewing generic info?
    // Let's stick to standard behavior: if user has pharmacyId, use it.

    let pharmacyClause = '1=1';
    if (pharmacyId) {
        params.push(pharmacyId);
        pharmacyClause = `mv.pharmacy_id = $${params.length}`;
    }

    // Entity specific filters
    let entityJoin = '';
    let entityWhere = '';

    if (entity.type === 'PRODUCT') {
        // sourceIds are bcb_product_ids or codes? 
        // Based on ComparisonSelectionModal, they are string IDs.
        // If they are IDs from our DB, they might be bcb_product_id.
        // Let's check: in modal, PRODUCT id is `p.bcb_product_id`.
        // So we filter by bcb_product_id.
        // We need to join global product to filter by bcb_product_id.

        // Wait, mv_product_stats_monthly has product_id which links to data_internalproduct using code_13_ref usually?
        // mv.product_id -> data_internalproduct.id
        // data_internalproduct.code_13_ref_id -> data_globalproduct.code_13_ref
        // data_globalproduct.bcb_product_id is what we have.

        entityJoin = `
            JOIN data_internalproduct ip ON mv.product_id = ip.id
            JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
        `;

        params.push(entity.sourceIds); // Pass as array
        entityWhere = `gp.bcb_product_id::text = ANY($${params.length}::text[])`;

    } else if (entity.type === 'LABORATORY') {
        // sourceIds are laboratory names from the Search API (which queries mv.laboratory_name)
        // So we must filter on mv.laboratory_name to ensure matches.

        entityJoin = `
            JOIN data_internalproduct ip ON mv.product_id = ip.id
            JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
        `;
        params.push(entity.sourceIds);
        entityWhere = `mv.laboratory_name = ANY($${params.length}::text[])`;

    } else if (entity.type === 'CATEGORY') {
        // sourceIds are category names.
        // Categories can be in multiple columns: bcb_segment_l0...l5, bcb_family.
        // This is tricky. simpler if we check all columns? 
        // Or did the modal provide specific types? 
        // In modal: id: c.name, label: c.category_name. 
        // We don't distinguish which level it came from in `sourceIds` array easily 
        // unless we passed objects {id, type}. 
        // But `sourceIds` is string[].
        // For now, let's assume we check against all hierarchy columns OR assume simple match.
        // Given the modal search query unioned all levels, checking all levels is safest.

        entityJoin = `
            JOIN data_internalproduct ip ON mv.product_id = ip.id
            JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
        `;
        params.push(entity.sourceIds); // The selected category names
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
            -- Period N
            SUM(CASE WHEN month >= $1 AND month <= $2 THEN mv.ht_sold ELSE 0 END) as sales_ht,
            SUM(CASE WHEN month >= $1 AND month <= $2 THEN mv.margin_sold ELSE 0 END) as margin_eur,
            SUM(CASE WHEN month >= $1 AND month <= $2 THEN mv.qty_sold ELSE 0 END) as qty_sold,
            SUM(CASE WHEN month >= $1 AND month <= $2 THEN mv.ht_purchased ELSE 0 END) as purchases_ht,
            SUM(CASE WHEN month >= $1 AND month <= $2 THEN mv.qty_purchased ELSE 0 END) as qty_bought,
            
            -- Period N-1
            SUM(CASE WHEN month >= $3 AND month <= $4 THEN mv.ht_sold ELSE 0 END) as sales_ht_prev,
            SUM(CASE WHEN month >= $3 AND month <= $4 THEN mv.margin_sold ELSE 0 END) as margin_eur_prev,
            SUM(CASE WHEN month >= $3 AND month <= $4 THEN mv.qty_sold ELSE 0 END) as qty_sold_prev,
            SUM(CASE WHEN month >= $3 AND month <= $4 THEN mv.ht_purchased ELSE 0 END) as purchases_ht_prev,
            SUM(CASE WHEN month >= $3 AND month <= $4 THEN mv.qty_purchased ELSE 0 END) as qty_bought_prev
            
        FROM mv_product_stats_monthly mv
        ${entityJoin}
        WHERE 
            (month >= $3 AND month <= $2) -- Covers full range N-1 to N end
            AND ${pharmacyClause}
            AND ${entityWhere}
    `;

    // Adaptation of clauses for Stock Query (different alias 'mv' -> 's')
    // We need to ensure the entityJoin works on the stock table too.
    // Stock table: mv_stock_monthly s
    // Join: JOIN data_internalproduct ip ON s.code_13_ref = ip.code_13_ref (OR s.product_id?)
    // repository says: mv_stock_monthly has product_id.

    // Let's verify joins.
    // Entity Join used aliases 'mv', 'ip', 'gp'.
    // If I use a subquery, I should rename 'mv' to something else or keep it isolated.
    // A clean separate query might be safer and easier to maintain than a massive single query.
    // Given we are already doing Promise.all for entities, doing 2 queries per entity is fine (one for sales, one for stock).

    const salesResult = await db.query(query, params);

    // --- Stock Query ---
    // Create isolated parameters for Stock Query to avoid "could not determine data type of parameter $1"
    // caused by unused parameters from the main query (like $1 start date).
    const stockParams: any[] = [end]; // $1 = end date

    let stockPharmacyClause = '1=1';
    if (pharmacyId) {
        stockParams.push(pharmacyId);
        stockPharmacyClause = `s.pharmacy_id = $${stockParams.length}`;
    }

    // Rebuild Entity Where/Join for Stock (alias 's')
    const stockJoin = entityJoin.replace(/mv\.product_id/g, 's.product_id');

    let stockEntityWhere = '';
    // We need to re-add the entity sourceIds to the new stockParams
    // and generate the clause with the NEW index.

    if (entity.type === 'PRODUCT') {
        stockParams.push(entity.sourceIds);
        stockEntityWhere = `gp.bcb_product_id::text = ANY($${stockParams.length}::text[])`;
    } else if (entity.type === 'LABORATORY') {
        stockParams.push(entity.sourceIds);
        // Note: Laboratory Search returns names. 
        // We filter on s.laboratory_name (was mv.laboratory_name)
        stockEntityWhere = `s.laboratory_name = ANY($${stockParams.length}::text[])`;
    } else if (entity.type === 'CATEGORY') {
        stockParams.push(entity.sourceIds);
        const p = `$${stockParams.length}::text[]`;
        stockEntityWhere = `(
            gp.bcb_segment_l0 = ANY(${p}) OR
            gp.bcb_segment_l1 = ANY(${p}) OR
            gp.bcb_segment_l2 = ANY(${p}) OR
            gp.bcb_segment_l3 = ANY(${p}) OR
            gp.bcb_segment_l4 = ANY(${p}) OR
            gp.bcb_segment_l5 = ANY(${p}) OR
            gp.bcb_family     = ANY(${p})
        )`;
    }

    const stockQuery = `
        SELECT 
            COALESCE(SUM(t.stock), 0) as stock_quantity,
            COALESCE(SUM(t.stock_value_ht), 0) as stock_value,
            COUNT(*) as nb_refs
        FROM (
            SELECT DISTINCT ON (s.product_id)
                s.stock,
                s.stock_value_ht
            FROM mv_stock_monthly s
            ${stockJoin}
            WHERE s.month_end_date <= $1 -- End date (now $1 in stockParams)
              AND ${stockPharmacyClause}
              AND ${stockEntityWhere}
            ORDER BY s.product_id, s.month_end_date DESC
        ) t
    `;

    const stockResult = await db.query(stockQuery, stockParams);

    const row = salesResult.rows[0];
    const stockRow = stockResult.rows[0];

    // Helper conversions
    const num = (v: any) => Number(v) || 0;
    const sales = num(row.sales_ht);
    const salesPrev = num(row.sales_ht_prev);
    const margin = num(row.margin_eur);
    const marginPrev = num(row.margin_eur_prev);
    const qtySold = num(row.qty_sold);
    const qtySoldPrev = num(row.qty_sold_prev);

    // Margin %
    const marginRate = sales > 0 ? (margin / sales) * 100 : 0;
    const marginRatePrev = salesPrev > 0 ? (marginPrev / salesPrev) * 100 : 0;

    const calcEvol = (curr: number, prev: number) => prev === 0 ? null : ((curr - prev) / prev) * 100;
    const calcDiff = (curr: number, prev: number) => curr - prev; // For rates (points)

    return {
        // VENTE HT
        sales_ht: sales,
        sales_ht_evolution: calcEvol(sales, salesPrev),

        // MARGE €
        margin_eur: margin,
        margin_eur_evolution: calcEvol(margin, marginPrev),

        // % DE MARGE
        margin_rate: marginRate,
        margin_rate_evolution: calcDiff(marginRate, marginRatePrev), // Points

        // VOLUME
        qty_sold: qtySold,
        qty_sold_evolution: calcEvol(qtySold, qtySoldPrev),

        qty_bought: num(row.qty_bought),
        qty_bought_evolution: calcEvol(num(row.qty_bought), num(row.qty_bought_prev)),

        purchases_ht: num(row.purchases_ht),
        purchases_ht_evolution: calcEvol(num(row.purchases_ht), num(row.purchases_ht_prev)),

        // Stock Data
        stock_value: num(stockRow.stock_value),
        stock_quantity: num(stockRow.stock_quantity),
        days_stock: 0, // Complex to calc accurately without avg stock
        nb_refs: num(stockRow.nb_refs)
    };
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
                const stats = await fetchEntityStats(entity, dateRange, targetPharmacyId);
                return {
                    entityId: entity.id,
                    stats
                };
            })
        );

        return NextResponse.json({ results });

    } catch (error) {
        console.error('Error in comparison stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
