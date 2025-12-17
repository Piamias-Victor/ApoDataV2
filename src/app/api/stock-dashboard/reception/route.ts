import { NextResponse } from 'next/server';
import { getStockReceptionKpi } from '@/services/kpi/stockDashboardService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = await getStockReceptionKpi(body);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching stock reception kpi:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
