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
        console.error('API Error (Pharmacy Monthly):', error);
        return NextResponse.json(
            { error: 'Failed to fetch pharmacy monthly stats' },
            { status: 500 }
        );
    }
}
