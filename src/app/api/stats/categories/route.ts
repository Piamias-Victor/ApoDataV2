import { NextRequest, NextResponse } from 'next/server';
import { getCategoryTreeData } from '@/services/kpi/categoryService';
import { AchatsKpiRequest } from '@/types/kpi';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { request, path } = body as { request: AchatsKpiRequest; path: string[] };

        if (!request) {
            return NextResponse.json({ error: 'Missing request body' }, { status: 400 });
        }

        const data = await getCategoryTreeData(request, path || []);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in category stats API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
