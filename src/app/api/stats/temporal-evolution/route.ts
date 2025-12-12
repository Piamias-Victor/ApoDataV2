import { NextRequest, NextResponse } from 'next/server';
import { getTemporalEvolutionData } from '@/services/kpi/temporalEvolutionService';
import { AchatsKpiRequest, Grain } from '@/types/kpi';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const request = body as AchatsKpiRequest & { grain: Grain };

        // Extract grain, default to 'day' if missing
        const grain = request.grain || 'day';

        const data = await getTemporalEvolutionData(request, grain);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in temporal evolution API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
