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
        const { page = 1, limit = 10, search = '', sortBy, sortOrder, isGenericAnalysis = false, ...kpiRequest } = body;

        // Default to page 1 if not provided or invalid
        const pageNumber = Math.max(1, Number(page) || 1);
        const pageSize = Math.max(1, Number(limit) || 10);

        // Create generic status filter if requested
        const genericStatusFilter = isGenericAnalysis
            ? "gp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT')"
            : undefined;

        // Create product type filter
        let productTypeFilter: string | undefined;
        if (kpiRequest.productType === 'MEDICAMENT') {
            productTypeFilter = "mv.ean13 LIKE '34009%'";
        } else if (kpiRequest.productType === 'PARAPHARMACIE') {
            productTypeFilter = "mv.ean13 NOT LIKE '34009%'";
        }

        const result = await getProductAnalysis(kpiRequest, pageNumber, pageSize, search, sortBy, sortOrder, genericStatusFilter, productTypeFilter);

        return NextResponse.json(result);
    } catch (error) {
        console.error('[PRODUCT_ANALYSIS]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
