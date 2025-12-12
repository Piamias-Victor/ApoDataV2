import { AchatsKpiRequest, PriceEvolutionResponse } from '@/types/kpi';
import { fetchPriceEvolutionData } from '@/repositories/kpi/priceEvolutionRepository';
import { queryCache, withCache } from '@/lib/cache/queryCache';

export async function getPriceEvolutionKpi(request: AchatsKpiRequest): Promise<PriceEvolutionResponse> {
    const startTime = Date.now();

    // 1. Get Current Data
    const currentKey = queryCache.generateKey('price_evolution', request);
    const currentData = await withCache(currentKey, () => fetchPriceEvolutionData(request));

    let purchase_evolution_percent: number | undefined;
    let sell_evolution_percent: number | undefined;

    // 2. Get Comparison Data
    if (request.comparisonDateRange?.start && request.comparisonDateRange?.end) {
        const { comparisonDateRange, ...baseRequest } = request;
        const compRequest = {
            ...baseRequest,
            dateRange: request.comparisonDateRange,
        };
        const compKey = queryCache.generateKey('price_evolution', compRequest);
        const compData = await withCache(compKey, () => fetchPriceEvolutionData(compRequest));

        // Calculate Evolutions
        if (compData.avg_purchase_price > 0) {
            purchase_evolution_percent = ((currentData.avg_purchase_price - compData.avg_purchase_price) / compData.avg_purchase_price) * 100;
        }

        if (compData.avg_sell_price_ttc > 0) {
            sell_evolution_percent = ((currentData.avg_sell_price_ttc - compData.avg_sell_price_ttc) / compData.avg_sell_price_ttc) * 100;
        }
    }

    return {
        purchase_price: currentData.avg_purchase_price,
        purchase_evolution_percent,
        sell_price: currentData.avg_sell_price_ttc,
        sell_evolution_percent,
        duration: `${Date.now() - startTime}ms`
    };
}
