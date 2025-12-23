
import { NextRequest, NextResponse } from 'next/server';
import { GenericLaboratoryRepository } from '@/repositories/kpi/GenericLaboratoryRepository';
import { AchatsKpiRequest } from '@/types/kpi';

const repository = new GenericLaboratoryRepository();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const request: AchatsKpiRequest = body;

        const data = await repository.execute(request);

        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch generic laboratory analysis' },
            { status: 500 }
        );
    }
}
