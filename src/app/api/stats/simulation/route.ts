import { NextResponse } from 'next/server';
import { SimulationRepository } from '@/repositories/kpi/SimulationRepository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const filtersJson = searchParams.get('filters');
        const filters = filtersJson ? JSON.parse(filtersJson) : {};

        // Determine current status based on REAL date
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const data = await SimulationRepository.getSimulationStats(
            currentYear,
            currentMonth,
            filters // Pass the entire filters object
        );

        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error (Simulation):', error);
        return NextResponse.json(
            { error: 'Failed to fetch simulation stats' },
            { status: 500 }
        );
    }
}
