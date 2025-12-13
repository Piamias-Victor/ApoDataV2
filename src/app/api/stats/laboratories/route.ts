import { NextRequest, NextResponse } from 'next/server';
import { getLaboratoryAnalysis } from '@/repositories/kpi/laboratoryAnalysisRepository';
import { AchatsKpiRequest } from '@/types/kpi';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const request: AchatsKpiRequest = body;

        const data = await getLaboratoryAnalysis(request);

        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch laboratory analysis' },
            { status: 500 }
        );
    }
}
