import { AchatsKpiRequest, StockKpiResponse } from '@/types/kpi';
import { fetchStockData } from '@/repositories/kpi/stockRepository';
import { queryCache, withCache } from '@/lib/cache/queryCache';

export async function getStockKpi(request: AchatsKpiRequest): Promise<StockKpiResponse> {
    const startTime = Date.now();
    console.log('📦 [Service] Getting Stock KPI');

    // 1. Determine Target Date (End of current range)
    const targetDate = request.dateRange.end;

    const currentCacheKey = queryCache.generateKey('stock', {
        targetDate, // Unique per end date
        productCodes: request.productCodes,
        laboratories: request.laboratories,
        categories: request.categories,
        pharmacyIds: request.pharmacyIds,
        filterOperators: request.filterOperators,
        reimbursementStatus: request.reimbursementStatus,
        isGeneric: request.isGeneric
    });

    // Fetch current stock
    const currentData = await withCache(currentCacheKey, () => fetchStockData(request, targetDate));

    let evolution_percent: number | undefined;

    // 2. Comparison (End of comparison range)
    if (request.comparisonDateRange) {
        const comparisonDate = request.comparisonDateRange.end;
        console.log(`📦 [Service] Calculating evolution vs ${comparisonDate}`);

        const comparisonCacheKey = queryCache.generateKey('stock', {
            targetDate: comparisonDate,
            productCodes: request.productCodes,
            laboratories: request.laboratories,
            categories: request.categories,
            pharmacyIds: request.pharmacyIds,
            filterOperators: request.filterOperators,
            reimbursementStatus: request.reimbursementStatus,
            isGeneric: request.isGeneric
        });

        const comparisonData = await withCache(comparisonCacheKey, () =>
            fetchStockData(request, comparisonDate)
        );

        if (comparisonData.stock_value_ht > 0) {
            evolution_percent = ((currentData.stock_value_ht - comparisonData.stock_value_ht) / comparisonData.stock_value_ht) * 100;
        }
    }

    const duration = Date.now() - startTime;

    return {
        stock_value_ht: currentData.stock_value_ht,
        stock_quantity: currentData.stock_quantity,
        evolution_percent,
        duration: `${duration}ms`
    };
}
