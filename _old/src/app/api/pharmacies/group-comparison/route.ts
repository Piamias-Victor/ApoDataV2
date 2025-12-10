// src/app/api/pharmacies/group-comparison/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true' &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN;
const CACHE_TTL = 43200; // 12 heures

/**
 * Request interface for pharmacy group comparison
 */
interface GroupComparisonRequest {
    readonly dateRange: {
        readonly start: string;
        readonly end: string;
    };
    readonly comparisonDateRange?: {
        readonly start: string;
        readonly end: string;
    };
    readonly pharmacyIds: string[];
    readonly productCodes?: string[];
}

/**
 * Metrics structure for a single entity (selected pharmacies or group)
 */
interface MetricsData {
    readonly ca_sell_in: number;
    readonly ca_sell_in_comparison?: number | undefined;
    readonly evol_sell_in_pct?: number | undefined;

    readonly ca_sell_out: number;
    readonly ca_sell_out_comparison?: number | undefined;
    readonly evol_sell_out_pct?: number | undefined;

    readonly marge: number;
    readonly marge_comparison?: number | undefined;
    readonly evol_marge_pct?: number | undefined;

    readonly taux_marge: number;
    readonly taux_marge_comparison?: number | undefined;

    readonly stock: number;
    readonly stock_comparison?: number | undefined;
}

/**
 * Response interface for pharmacy group comparison
 */
interface GroupComparisonResponse {
    readonly selectedPharmacies: MetricsData;
    readonly groupAverage: MetricsData;
    readonly pharmacyCount: number;
    readonly totalPharmaciesInGroup: number;
    readonly queryTime: number;
    readonly cached: boolean;
}

/**
 * POST /api/pharmacies/group-comparison
 * 
 * Compares selected pharmacies metrics against the group average
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();

    try {
        console.log('🔥 [API] Pharmacy Group Comparison called');

        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'admin') {
            console.log('❌ [API] Unauthorized - Admin only');
            return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
        }

        const body: GroupComparisonRequest = await request.json();
        console.log('📥 [API] Request body:', body);

        // Validation
        if (!body.dateRange?.start || !body.dateRange?.end) {
            return NextResponse.json({ error: 'Date range required' }, { status: 400 });
        }

        if (!body.pharmacyIds || body.pharmacyIds.length === 0) {
            return NextResponse.json({ error: 'At least one pharmacy ID required' }, { status: 400 });
        }

        const hasComparison = !!(body.comparisonDateRange?.start && body.comparisonDateRange?.end);
        const hasProductFilter = !!(body.productCodes && body.productCodes.length > 0);

        console.log('📊 [API] Filters:', {
            pharmacyIds: body.pharmacyIds.length,
            productCodes: body.productCodes?.length || 0,
            hasComparison
        });

        // Check cache
        const cacheKey = generateCacheKey({
            dateRange: body.dateRange,
            comparisonDateRange: body.comparisonDateRange,
            pharmacyIds: body.pharmacyIds,
            productCodes: body.productCodes || [],
            hasComparison,
            hasProductFilter
        });

        if (CACHE_ENABLED) {
            try {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    console.log('✅ [API] Cache HIT');
                    return NextResponse.json({
                        ...(cached as any),
                        cached: true,
                        queryTime: Date.now() - startTime
                    });
                }
            } catch (cacheError) {
                console.warn('⚠️ [API] Cache read error:', cacheError);
            }
        }

        // Execute queries
        const [selectedPharmaciesMetrics, groupTotalMetrics, totalPharmaciesCount] = await Promise.all([
            calculateMetrics(
                body.dateRange,
                body.pharmacyIds,
                body.productCodes,
                hasComparison ? body.comparisonDateRange : undefined
            ),
            calculateMetrics(
                body.dateRange,
                undefined, // No pharmacy filter = all pharmacies
                body.productCodes,
                hasComparison ? body.comparisonDateRange : undefined
            ),
            getTotalPharmaciesCount()
        ]);

        // Calculate group AVERAGE by dividing totals by number of pharmacies
        const groupAverageMetrics: MetricsData = {
            ca_sell_in: groupTotalMetrics.ca_sell_in / totalPharmaciesCount,
            ca_sell_in_comparison: groupTotalMetrics.ca_sell_in_comparison
                ? groupTotalMetrics.ca_sell_in_comparison / totalPharmaciesCount
                : undefined,
            evol_sell_in_pct: groupTotalMetrics.evol_sell_in_pct,

            ca_sell_out: groupTotalMetrics.ca_sell_out / totalPharmaciesCount,
            ca_sell_out_comparison: groupTotalMetrics.ca_sell_out_comparison
                ? groupTotalMetrics.ca_sell_out_comparison / totalPharmaciesCount
                : undefined,
            evol_sell_out_pct: groupTotalMetrics.evol_sell_out_pct,

            marge: groupTotalMetrics.marge / totalPharmaciesCount,
            marge_comparison: groupTotalMetrics.marge_comparison
                ? groupTotalMetrics.marge_comparison / totalPharmaciesCount
                : undefined,
            evol_marge_pct: groupTotalMetrics.evol_marge_pct,

            taux_marge: groupTotalMetrics.taux_marge, // Taux de marge reste le même (c'est un %)
            taux_marge_comparison: groupTotalMetrics.taux_marge_comparison,

            stock: groupTotalMetrics.stock / totalPharmaciesCount,
            stock_comparison: groupTotalMetrics.stock_comparison
                ? groupTotalMetrics.stock_comparison / totalPharmaciesCount
                : undefined
        };

        console.log('📊 [API] Metrics calculated:', {
            selectedPharmacies: {
                ca_sell_in: selectedPharmaciesMetrics.ca_sell_in,
                ca_sell_out: selectedPharmaciesMetrics.ca_sell_out
            },
            groupTotal: {
                ca_sell_in: groupTotalMetrics.ca_sell_in,
                ca_sell_out: groupTotalMetrics.ca_sell_out
            },
            groupAverage: {
                ca_sell_in: groupAverageMetrics.ca_sell_in,
                ca_sell_out: groupAverageMetrics.ca_sell_out
            },
            totalPharmacies: totalPharmaciesCount
        });

        const result: GroupComparisonResponse = {
            selectedPharmacies: selectedPharmaciesMetrics,
            groupAverage: groupAverageMetrics,
            pharmacyCount: body.pharmacyIds.length,
            totalPharmaciesInGroup: totalPharmaciesCount,
            queryTime: Date.now() - startTime,
            cached: false
        };

        // Cache result
        if (CACHE_ENABLED) {
            try {
                await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
                console.log('💾 [API] Result cached');
            } catch (cacheError) {
                console.warn('⚠️ [API] Cache write error:', cacheError);
            }
        }

        console.log('✅ [API] Success:', {
            pharmacyCount: body.pharmacyIds.length,
            totalPharmacies: totalPharmaciesCount,
            queryTime: result.queryTime
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('❌ [API] Pharmacy group comparison error:', error);
        return NextResponse.json(
            { error: 'Internal server error', queryTime: Date.now() - startTime },
            { status: 500 }
        );
    }
}

/**
 * Calculate metrics for a set of pharmacies (or all if pharmacyIds is undefined)
 */
async function calculateMetrics(
    dateRange: { start: string; end: string },
    pharmacyIds?: string[],
    productCodes?: string[],
    comparisonDateRange?: { start: string; end: string }
): Promise<MetricsData> {
    const hasPharmacyFilter = !!(pharmacyIds && pharmacyIds.length > 0);
    const hasProductFilter = !!(productCodes && productCodes.length > 0);

    const productFilter = hasProductFilter ? 'AND ip.code_13_ref_id = ANY($3::text[])' : '';
    const pharmacyFilter = hasPharmacyFilter
        ? (hasProductFilter ? 'AND ip.pharmacy_id = ANY($4::uuid[])' : 'AND ip.pharmacy_id = ANY($3::uuid[])')
        : '';

    const params: any[] = [dateRange.start, dateRange.end];

    if (hasProductFilter) {
        params.push(productCodes);
    }

    if (hasPharmacyFilter) {
        params.push(pharmacyIds);
    }

    // Main period query
    const query = `
    WITH 
    -- CA Sell-In (Achats)
    period_purchases AS (
      SELECT 
        COALESCE(SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)), 0) as ca_sell_in
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
      WHERE o.delivery_date >= $1::date 
        AND o.delivery_date <= $2::date
        AND o.delivery_date IS NOT NULL
        AND po.qte_r > 0
        ${productFilter}
        ${pharmacyFilter}
    ),
    
    -- CA Sell-Out (Ventes) + Marge
    period_sales AS (
      SELECT 
        COALESCE(SUM(s.quantity * s.unit_price_ttc), 0) as ca_sell_out,
        COALESCE(SUM(s.quantity * (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0))), 0) as ca_ht,
        COALESCE(SUM(s.quantity * (
          (s.unit_price_ttc / (1 + COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) / 100.0)) - ins.weighted_average_price
        )), 0) as marge
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
      WHERE s.date >= $1::date AND s.date <= $2::date
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND ins.weighted_average_price > 0
        AND (gp.tva_percentage IS NOT NULL OR gp.bcb_tva_rate IS NOT NULL)
        AND COALESCE(gp.tva_percentage, gp.bcb_tva_rate, 0) > 0
        ${productFilter}
        ${pharmacyFilter}
    ),
    
    -- Stock actuel
    current_stock AS (
      SELECT 
        COALESCE(SUM(latest_stock.stock * latest_stock.weighted_average_price), 0) as stock
      FROM data_internalproduct ip
      JOIN LATERAL (
        SELECT DISTINCT ON (ins.product_id)
          ins.stock, ins.weighted_average_price
        FROM data_inventorysnapshot ins
        WHERE ins.product_id = ip.id
        ORDER BY ins.product_id, ins.date DESC
      ) latest_stock ON true
      WHERE 1=1 
        ${productFilter}
        ${pharmacyFilter}
    )
    
    SELECT 
      pp.ca_sell_in,
      ps.ca_sell_out,
      ps.marge,
      CASE 
        WHEN ps.ca_ht > 0 THEN (ps.marge / ps.ca_ht * 100)
        ELSE 0
      END as taux_marge,
      cs.stock
    FROM period_purchases pp
    CROSS JOIN period_sales ps
    CROSS JOIN current_stock cs;
  `;

    console.log('🗃️ [API] Executing metrics query:', {
        dateRange,
        hasPharmacyFilter,
        hasProductFilter,
        pharmacyCount: pharmacyIds?.length || 'ALL',
        paramsLength: params.length
    });

    const result = await db.query(query, params);

    if (result.length === 0) {
        return {
            ca_sell_in: 0,
            ca_sell_out: 0,
            marge: 0,
            taux_marge: 0,
            stock: 0
        };
    }

    const mainMetrics = result[0];

    // If comparison period is provided, calculate comparison metrics
    if (comparisonDateRange) {
        const comparisonParams: any[] = [comparisonDateRange.start, comparisonDateRange.end];

        if (hasProductFilter) {
            comparisonParams.push(productCodes);
        }

        if (hasPharmacyFilter) {
            comparisonParams.push(pharmacyIds);
        }

        const comparisonResult = await db.query(query, comparisonParams);

        if (comparisonResult.length > 0) {
            const comparisonMetrics = comparisonResult[0];

            return {
                ca_sell_in: Number(mainMetrics.ca_sell_in) || 0,
                ca_sell_in_comparison: Number(comparisonMetrics.ca_sell_in) || 0,
                evol_sell_in_pct: calculateEvolution(mainMetrics.ca_sell_in, comparisonMetrics.ca_sell_in),

                ca_sell_out: Number(mainMetrics.ca_sell_out) || 0,
                ca_sell_out_comparison: Number(comparisonMetrics.ca_sell_out) || 0,
                evol_sell_out_pct: calculateEvolution(mainMetrics.ca_sell_out, comparisonMetrics.ca_sell_out),

                marge: Number(mainMetrics.marge) || 0,
                marge_comparison: Number(comparisonMetrics.marge) || 0,
                evol_marge_pct: calculateEvolution(mainMetrics.marge, comparisonMetrics.marge),

                taux_marge: Number(mainMetrics.taux_marge) || 0,
                taux_marge_comparison: Number(comparisonMetrics.taux_marge) || 0,

                stock: Number(mainMetrics.stock) || 0,
                stock_comparison: Number(comparisonMetrics.stock) || 0
            };
        }
    }

    // No comparison period
    return {
        ca_sell_in: Number(mainMetrics.ca_sell_in) || 0,
        ca_sell_out: Number(mainMetrics.ca_sell_out) || 0,
        marge: Number(mainMetrics.marge) || 0,
        taux_marge: Number(mainMetrics.taux_marge) || 0,
        stock: Number(mainMetrics.stock) || 0
    };
}

/**
 * Get total number of pharmacies in the group
 */
async function getTotalPharmaciesCount(): Promise<number> {
    const result = await db.query('SELECT COUNT(*) as count FROM data_pharmacy');
    return result[0]?.count || 0;
}

/**
 * Calculate evolution percentage
 */
function calculateEvolution(current: number, previous: number): number | undefined {
    if (!previous || previous === 0) return undefined;
    return Number((((current - previous) / previous) * 100).toFixed(2));
}

/**
 * Generate cache key for the request
 */
function generateCacheKey(params: {
    dateRange: { start: string; end: string };
    comparisonDateRange?: { start: string; end: string } | undefined;
    pharmacyIds: string[];
    productCodes: string[];
    hasComparison: boolean;
    hasProductFilter: boolean;
}): string {
    const data = JSON.stringify({
        dateRange: params.dateRange,
        comparisonDateRange: params.comparisonDateRange,
        pharmacyIds: params.pharmacyIds.sort(),
        productCodes: params.hasProductFilter ? params.productCodes.sort() : [],
        hasComparison: params.hasComparison,
        hasProductFilter: params.hasProductFilter
    });

    const hash = crypto.createHash('md5').update(data).digest('hex');
    return `pharmacy:group-comparison:v1:${hash}`;
}
