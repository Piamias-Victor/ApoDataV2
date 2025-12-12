import { NextRequest, NextResponse } from 'next/server';
import { getVentesKpi } from '@/services/kpi/ventesKpiService';
import { AchatsKpiRequest } from '@/types/kpi';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const request: AchatsKpiRequest = body;

        // Validation could go here (zod, etc.)

        console.log('🔥 [API] Ventes KPI Request started');
        const kpiData = await getVentesKpi(request);

        console.log('✅ [API] Ventes KPI completed', { amount: kpiData.montant_ht });

        return NextResponse.json(kpiData);
    } catch (error) {
        console.error('❌ [API] Error in Ventes KPI:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
