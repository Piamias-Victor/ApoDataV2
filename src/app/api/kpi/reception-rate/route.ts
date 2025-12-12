import { NextResponse } from 'next/server';
import { getReceptionRateKpi } from '@/services/kpi/receptionRateService';
import { AchatsKpiRequest } from '@/types/kpi';

export async function POST(request: Request) {
    try {
        const body: AchatsKpiRequest = await request.json();
        const data = await getReceptionRateKpi(body);
        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ [API] Reception Rate error:', error);
        return NextResponse.json({ error: 'Interval Server Error' }, { status: 500 });
    }
}
