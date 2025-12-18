
import { NextRequest, NextResponse } from 'next/server';
import { getPharmacyAnalysis } from '@/repositories/kpi/PharmacyAnalysisRepository';
import { AchatsKpiRequest } from '@/types/kpi';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const request: AchatsKpiRequest & { search?: string } = body;

        const data = await getPharmacyAnalysis(request);

        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pharmacy analysis' },
            { status: 500 }
        );
    }
}
