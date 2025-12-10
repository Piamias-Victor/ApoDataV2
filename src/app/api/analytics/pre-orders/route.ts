import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PreOrdersResponse } from '@/types/pre-orders';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest): Promise<NextResponse<PreOrdersResponse | { error: string }>> {
    const startTime = Date.now();
    console.log('🔥 [API] Pre-orders Analytics Request started');

    try {
        const body = await request.json();
        const { dateRange, pharmacyIds, productCodes, categoryCodes, laboratoryCodes } = body;

        console.log('📝 [API] Request body received:', {
            dateRange,
            pharmacyIdsCount: pharmacyIds?.length || 0,
            filters: {
                products: productCodes?.length || 0,
                categories: categoryCodes?.length || 0,
                labs: laboratoryCodes?.length || 0
            }
        });

        if (!dateRange?.start || !dateRange?.end) {
            return NextResponse.json({ error: 'Date range required' }, { status: 400 });
        }

        const allProductCodes = Array.from(new Set([
            ...(productCodes || []),
            ...(laboratoryCodes || []),
            ...(categoryCodes || [])
        ]));

        // Extract pharmacy IDs from objects (like other APIs do)
        const pharmacyIdsList = Array.isArray(pharmacyIds)
            ? pharmacyIds.map(p => typeof p === 'string' ? p : p?.id).filter(Boolean)
            : [];

        const hasProductFilter = allProductCodes.length > 0;
        const hasPharmacyFilter = pharmacyIdsList.length > 0;

        const productFilter = hasProductFilter
            ? 'AND ip.code_13_ref_id = ANY($3::text[])'
            : '';

        const pharmacyFilter = hasPharmacyFilter
            ? (hasProductFilter ? 'AND ip.pharmacy_id = ANY($4::uuid[])' : 'AND ip.pharmacy_id = ANY($3::uuid[])')
            : '';

        const params: any[] = [dateRange.start, dateRange.end];

        if (hasProductFilter) {
            params.push(allProductCodes);
        }

        if (hasPharmacyFilter) {
            params.push(pharmacyIdsList);
        }

        const query = `
            SELECT 
                TO_CHAR(o.sent_date, 'YYYY-MM') as month_date,
                SUM(po.qte_r) as total_quantity,
                SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)) as total_amount_ht
            FROM data_productorder po
            INNER JOIN data_order o ON po.order_id = o.id
            INNER JOIN data_internalproduct ip ON po.product_id = ip.id
            LEFT JOIN LATERAL (
                SELECT weighted_average_price
                FROM data_inventorysnapshot ins2
                WHERE ins2.product_id = po.product_id
                AND ins2.weighted_average_price > 0
                ORDER BY ins2.date DESC
                LIMIT 1
            ) closest_snap ON true
            WHERE o.sent_date >= $1::timestamp 
            AND o.sent_date <= $2::timestamp
            AND o.sent_date IS NOT NULL
            AND po.qte_r > 0
            ${productFilter}
            ${pharmacyFilter}
            GROUP BY month_date
            ORDER BY month_date ASC
        `;

        console.log('🔍 [API] Executing Pre-orders query with params:', {
            params,
            hasProductFilter,
            hasPharmacyFilter,
            dateRangeStart: params[0],
            dateRangeEnd: params[1],
            productCodesCount: hasProductFilter ? params[2]?.length : 0,
            pharmacyIdsCount: hasPharmacyFilter ? (hasProductFilter ? params[3]?.length : params[2]?.length) : 0
        });

        // Log the actual query for debugging
        console.log('📝 [API] SQL Query:', query.replace(/\s+/g, ' ').substring(0, 500));

        const rows = await db.query(query, params);

        console.log('📊 [API] Query returned rows:', {
            rowCount: rows.length,
            firstRow: rows[0] || null,
            allMonths: rows.map(r => r.month_date)
        });

        const metrics = rows.map(row => ({
            date: row.month_date,
            montant_achat_ht: Number(row.total_amount_ht) || 0,
            quantite: Number(row.total_quantity) || 0
        }));

        const total_montant_achat_ht = metrics.reduce((acc, curr) => acc + curr.montant_achat_ht, 0);
        const total_quantite = metrics.reduce((acc, curr) => acc + curr.quantite, 0);

        const response: PreOrdersResponse = {
            metrics,
            total_montant_achat_ht,
            total_quantite,
            queryTime: Date.now() - startTime
        };

        console.log('✅ [API] Pre-orders calculation completed', {
            metricsCount: metrics.length,
            totalAmount: total_montant_achat_ht,
            totalQuantity: total_quantite,
            queryTime: response.queryTime
        });

        return NextResponse.json(response);

    } catch (error) {
        console.error('❌ [API] Pre-orders calculation failed:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
