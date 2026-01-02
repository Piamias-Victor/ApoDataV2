
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const maxDuration = 300; // 5 minutes max duration for Vercel (Cron jobs can take time)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // 1. Security Check
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Check if authorized (Vercel Cron sends this header, or manual Bearer)
    if (authHeader !== `Bearer ${cronSecret}` && request.headers.get('x-vercel-cron') !== 'true' && process.env.NODE_ENV === 'production') {
        // Allow bypass in development if needed, or enforce strictly
        // For strictly secure: 
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const startTime = Date.now();
        const logs: string[] = [];

        // Helper to refresh
        const refreshView = async (viewName: string) => {
            const start = Date.now();
            try {
                // concurrently is better for read availability, but requires unique index
                await query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`);
                const duration = Date.now() - start;
                logs.push(`✅ Refreshed ${viewName} in ${duration}ms`);
            } catch (error: any) {
                // Fallback to non-concurrent if unique index is missing or other issue (though we expect indexes to be there)
                logs.push(`⚠️ Concurrent refresh failed for ${viewName}, trying standard refresh. Error: ${error.message}`);
                try {
                    await query(`REFRESH MATERIALIZED VIEW ${viewName}`);
                    const duration = Date.now() - start;
                    logs.push(`✅ Refreshed ${viewName} (Non-Concurrent) in ${duration}ms`);
                } catch (retryError: any) {
                    logs.push(`❌ Failed to refresh ${viewName}: ${retryError.message}`);
                    throw retryError; // Stop execution if a critical view fails? Or continue? 
                    // Usually for Level 1 failures we might want to stop, but let's try to proceed.
                }
            }
        };

        // --- Level 1: Base Views (Independent) ---
        // Can run in parallel if DB resources allow, but sequential is safer for stability
        await refreshView('mv_sales_enriched');
        await refreshView('mv_latest_product_prices');
        await refreshView('mv_stock_monthly');

        // --- Level 2: Daily Aggregates (Depend on L1) ---
        await refreshView('mv_lab_stats_daily');
        await refreshView('mv_product_stats_daily');

        // --- Level 3: Monthly Aggregates (Depend on L2) ---
        await refreshView('mv_product_stats_monthly');

        const totalTime = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            totalTime: `${totalTime}ms`,
            logs
        });

    } catch (error: any) {
        console.error('CRON Refresh Failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
