import { NextResponse } from 'next/server';
import { getRestockingData } from '@/services/kpi/stockDashboardService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = await getRestockingData(body);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching restocking data:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
