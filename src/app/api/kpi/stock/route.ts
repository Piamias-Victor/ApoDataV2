import { NextResponse } from 'next/server';
import { getStockKpi } from '@/services/kpi/stockKpiService';
import { AchatsKpiRequest } from '@/types/kpi';

export async function POST(request: Request) {
    const startTime = Date.now();
    console.log('🔥 [API] Stock KPI Request started');

    try {
        const body: AchatsKpiRequest = await request.json();

        // Basic validation
        if (!body.dateRange || !body.dateRange.end) {
            return NextResponse.json(
                { error: 'Invalid date range. End date required for Stock.' },
                { status: 400 }
            );
        }

        const data = await getStockKpi(body);

        console.log(`✅ [API] Stock KPI completed { value: ${data.stock_value_ht}, queryTime: '${Date.now() - startTime}ms' }`);

        return NextResponse.json(data);

    } catch (error) {
        console.error('❌ [API] Error processing Stock KPI request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
