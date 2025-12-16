import { NextRequest, NextResponse } from 'next/server';
import { fetchPriceGlobalKpis } from '@/repositories/kpi/priceRepository';
import { AchatsKpiRequest } from '@/types/kpi';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const request: AchatsKpiRequest = body;

        const data = await fetchPriceGlobalKpis(request);
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API] Error in price kpis:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
