import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AchatsKpiRequest } from '@/types/kpi';
import { SupplierAnalysisRepository } from '@/repositories/kpi/SupplierAnalysisRepository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const repository = new SupplierAnalysisRepository();

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: AchatsKpiRequest = await request.json();

        // Ensure filters are safe (though repository builder handles this)
        if (!body.dateRange?.start || !body.dateRange?.end) {
            return NextResponse.json({ error: 'Date range required' }, { status: 400 });
        }

        const data = await repository.execute(body);

        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ [API] Error processing Supplier Analysis request:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
