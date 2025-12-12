import { AchatsKpiRequest, ReceptionRateResponse } from '@/types/kpi';
import { fetchReceptionRate } from '@/repositories/kpi/receptionRateRepository';
import { queryCache, withCache } from '@/lib/cache/queryCache';

export async function getReceptionRateKpi(request: AchatsKpiRequest): Promise<ReceptionRateResponse> {
    const startTime = Date.now();

    const currentKey = queryCache.generateKey('reception_rate', request);
    const currentRate = await withCache(currentKey, () => fetchReceptionRate(request));

    let evolution_percent: number | undefined;

    if (request.comparisonDateRange?.start && request.comparisonDateRange?.end) {
        const { comparisonDateRange, ...baseRequest } = request;
        const compRequest: AchatsKpiRequest = {
            ...baseRequest,
            dateRange: request.comparisonDateRange,
        };
        const compKey = queryCache.generateKey('reception_rate', compRequest);
        const compRate = await withCache(compKey, () => fetchReceptionRate(compRequest));

        // Evolution calculation for percentage points or relative?
        // Client usually expects relative evolution of the rate itself.
        if (compRate > 0) {
            evolution_percent = ((currentRate - compRate) / compRate) * 100;
        }
    }

    return {
        rate: currentRate,
        evolution_percent,
        duration: `${Date.now() - startTime}ms`
    };
}
