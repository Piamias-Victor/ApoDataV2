// src/app/api/kpi/achats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAchatsKpi } from '@/services/kpi/achatsKpiService';
import { AchatsKpiRequest } from '@/types/kpi';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    console.log('🔥 [API] Achats KPI Request started');

    try {
        const body: AchatsKpiRequest = await request.json();

        // Validate date range
        if (!body.dateRange?.start || !body.dateRange?.end) {
            return NextResponse.json(
                { error: 'Date range is required' },
                { status: 400 }
            );
        }

        console.log('📝 [API] Request:', {
            dateRange: body.dateRange,
            productCodesCount: body.productCodes?.length || 0,
            pharmacyIdsCount: body.pharmacyIds?.length || 0
        });

        const result = await getAchatsKpi(body);

        const queryTime = Date.now() - startTime;
        console.log('✅ [API] Achats KPI completed', {
            quantite: result.quantite_achetee,
            queryTime: `${queryTime}ms`
        });

        return NextResponse.json({
            ...result,
            queryTime
        });

    } catch (error) {
        console.error('❌ [API] Achats KPI failed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
