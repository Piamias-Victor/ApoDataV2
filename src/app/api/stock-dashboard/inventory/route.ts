import { NextResponse } from 'next/server';
import { getInventoryKpi } from '@/services/kpi/stockDashboardService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = await getInventoryKpi(body);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching inventory kpi:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
