import { NextResponse } from 'next/server';
import { getPriceEvolutionKpi } from '@/services/kpi/priceEvolutionService';
import { AchatsKpiRequest } from '@/types/kpi';

export async function POST(request: Request) {
    try {
        const body: AchatsKpiRequest = await request.json();
        const data = await getPriceEvolutionKpi(body);
        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ [API] Price Evolution error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
