import { NextRequest, NextResponse } from 'next/server';
import { fetchPriceEvolution } from '@/repositories/kpi/priceRepository';
import { AchatsKpiRequest } from '@/types/kpi';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const request = body as AchatsKpiRequest;

        const data = await fetchPriceEvolution(request);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in price evolution kpis:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
