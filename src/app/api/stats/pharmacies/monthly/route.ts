import { NextResponse } from 'next/server';
import { PharmacyMonthlyRepository } from '@/repositories/kpi/PharmacyMonthlyRepository';
import { KpiRequestMapper } from '@/core/mappers/KpiRequestMapper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const kpiRequest = KpiRequestMapper.fromSearchParams(searchParams);

        const repository = new PharmacyMonthlyRepository();
        const data = await repository.execute(kpiRequest);

        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error (Pharmacy Monthly GET):', error);
        return NextResponse.json(
            { error: 'Failed to fetch pharmacy monthly stats' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // The body should match AchatsKpiRequest interface directly
        // We can pass it directly if it matches, or map it.
        // Assuming the hook sends the correct full object structure.
        
        const repository = new PharmacyMonthlyRepository();
        const data = await repository.execute(body);

        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error (Pharmacy Monthly POST):', error);
        return NextResponse.json(
            { error: 'Failed to fetch pharmacy monthly stats' },
            { status: 500 }
        );
    }
}
