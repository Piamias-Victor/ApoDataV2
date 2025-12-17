import { NextRequest, NextResponse } from 'next/server';
import { fetchProductDiscrepancyData } from '@/repositories/kpi/productDiscrepancyRepository';
import { AchatsKpiRequest } from '@/types/kpi';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const request = body as AchatsKpiRequest;

        // Basic validation
        if (!request.dateRange?.start || !request.dateRange?.end) {
            return NextResponse.json({ error: 'Date range is required' }, { status: 400 });
        }

        const data = await fetchProductDiscrepancyData(request);
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API] Product Discrepancy error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
