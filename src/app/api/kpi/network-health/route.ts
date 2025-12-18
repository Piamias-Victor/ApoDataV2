import { NextRequest, NextResponse } from 'next/server';
import { getNetworkHealthKpi } from '@/services/kpi/networkHealthKpiService';
import { AchatsKpiRequest } from '@/types/kpi';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const request: AchatsKpiRequest = body;

        // Validation
        if (!request.dateRange?.start || !request.dateRange?.end) {
            return NextResponse.json({ error: 'Date range required' }, { status: 400 });
        }

        const kpiData = await getNetworkHealthKpi(request);

        return NextResponse.json(kpiData);
    } catch (error) {
        console.error('❌ [API] Error in Network Health KPI:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
