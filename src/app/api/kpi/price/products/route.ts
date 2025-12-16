import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AchatsKpiRequest } from '@/types/kpi';
import { fetchPriceProducts } from '@/repositories/kpi/priceRepository';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { kpiRequest, page, limit, orderBy, orderDirection, search } = body as {
            kpiRequest: AchatsKpiRequest;
            page: number;
            limit: number;
            orderBy: string;
            orderDirection: 'asc' | 'desc';
            search?: string;
        };

        const data = await fetchPriceProducts(kpiRequest, page, limit, orderBy, orderDirection, search);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in price products API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
