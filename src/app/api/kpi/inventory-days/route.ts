import { NextResponse } from 'next/server';
import { getInventoryDaysKpi } from '@/services/kpi/inventoryDaysService';
import { AchatsKpiRequest } from '@/types/kpi';

export async function POST(request: Request) {
    try {
        const body: AchatsKpiRequest = await request.json();

        if (!body.dateRange?.end) {
            return NextResponse.json({ error: 'End date required' }, { status: 400 });
        }

        const data = await getInventoryDaysKpi(body);
        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ [API] Inventory Days error:', error);
        return NextResponse.json({ error: 'Interval Server Error' }, { status: 500 });
    }
}
