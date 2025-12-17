import { NextResponse } from 'next/server';
import { getStockCurrentKpi } from '@/services/kpi/stockDashboardService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = await getStockCurrentKpi(body);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching stock current kpi:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
