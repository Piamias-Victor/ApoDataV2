import { NextRequest, NextResponse } from 'next/server';
import { getLaboratoryDiscrepancy } from '@/services/kpi/stockDashboardService';

export async function POST(req: NextRequest) {
    try {
        const kpiRequest = await req.json();
        const data = await getLaboratoryDiscrepancy(kpiRequest);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in Laboratory Discrepancy API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch laboratory discrepancy data' },
            { status: 500 }
        );
    }
}
