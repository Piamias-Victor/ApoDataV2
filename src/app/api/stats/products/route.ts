import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Adjust path if necessary
import { getProductAnalysis } from '@/repositories/kpi/productAnalysisRepository';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { page = 1, limit = 10, search = '', sortBy, sortOrder, ...kpiRequest } = body;

        // Default to page 1 if not provided or invalid
        const pageNumber = Math.max(1, Number(page) || 1);
        const pageSize = Math.max(1, Number(limit) || 10);

        const result = await getProductAnalysis(kpiRequest, pageNumber, pageSize, search, sortBy, sortOrder);

        return NextResponse.json(result);
    } catch (error) {
        console.error('[PRODUCT_ANALYSIS]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
