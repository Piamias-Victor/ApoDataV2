import { NextRequest, NextResponse } from 'next/server';

import { getStockEvolution } from '@/services/kpi/stockDashboardService';

export async function POST(req: NextRequest) {
    try {
        const kpiRequest = await req.json();
        const data = await getStockEvolution(kpiRequest);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in Stock Evolution API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stock evolution data' },
            { status: 500 }
        );
    }
}
