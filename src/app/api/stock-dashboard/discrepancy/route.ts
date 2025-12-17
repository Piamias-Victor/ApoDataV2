import { NextResponse } from 'next/server';
import { getDiscrepancyKpi } from '@/services/kpi/stockDashboardService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = await getDiscrepancyKpi(body);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching discrepancy kpi:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
