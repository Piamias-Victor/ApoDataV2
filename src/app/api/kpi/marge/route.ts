import { NextResponse } from 'next/server';
import { getMargeKpi } from '@/services/kpi/margeKpiService';
import { AchatsKpiRequest } from '@/types/kpi';

export async function POST(request: Request) {
    const startTime = Date.now();
    console.log('🔥 [API] Marge KPI Request started');

    try {
        const body: AchatsKpiRequest = await request.json();

        // Basic validation
        if (!body.dateRange || !body.dateRange.start || !body.dateRange.end) {
            return NextResponse.json(
                { error: 'Invalid date range' },
                { status: 400 }
            );
        }

        const data = await getMargeKpi(body);

        console.log(`✅ [API] Marge KPI completed { amount: ${data.montant_marge}, queryTime: '${Date.now() - startTime}ms' }`);

        return NextResponse.json(data);

    } catch (error) {
        console.error('❌ [API] Error processing Marge KPI request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
