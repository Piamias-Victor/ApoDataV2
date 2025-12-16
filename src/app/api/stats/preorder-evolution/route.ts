import { NextRequest, NextResponse } from 'next/server';
import { fetchPreorderEvolution } from '@/repositories/kpi/achatsRepository';
import { AchatsKpiRequest, Grain } from '@/types/kpi';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const request: AchatsKpiRequest = body.request;
        const grain: Grain = body.grain || 'month';

        const data = await fetchPreorderEvolution(request, grain);

        return NextResponse.json(data);
    } catch (error) {
        console.error('[API] Error in preorder-evolution:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
