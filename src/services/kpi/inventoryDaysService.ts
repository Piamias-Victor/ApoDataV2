import { AchatsKpiRequest, InventoryDaysResponse } from '@/types/kpi';
import { fetchInventoryDays } from '@/repositories/kpi/inventoryDaysRepository';
import { queryCache, withCache } from '@/lib/cache/queryCache';

export async function getInventoryDaysKpi(request: AchatsKpiRequest): Promise<InventoryDaysResponse> {
    const startTime = Date.now();
    const targetDate: string = (request.dateRange?.end || new Date().toISOString().split('T')[0]) as string;

    const currentKey = queryCache.generateKey('inventory_days', {
        ...request,
        excludedPharmacyIds: request.excludedPharmacyIds,
        excludedLaboratories: request.excludedLaboratories,
        excludedCategories: request.excludedCategories,
        excludedProductCodes: request.excludedProductCodes,
        targetDate
    });

    // Fetch Current
    const currentDays = await withCache(currentKey, () => fetchInventoryDays(request, targetDate));

    let evolution_percent: number | undefined;

    // Fetch Comparison
    if (request.comparisonDateRange?.end) {
        const compDate = request.comparisonDateRange.end;
        const compKey = queryCache.generateKey('inventory_days', {
            ...request,
            excludedPharmacyIds: request.excludedPharmacyIds,
            excludedLaboratories: request.excludedLaboratories,
            excludedCategories: request.excludedCategories,
            excludedProductCodes: request.excludedProductCodes,
            targetDate: compDate
        });

        const compDays = await withCache(compKey, () => fetchInventoryDays(request, compDate));

        if (compDays > 0) {
            evolution_percent = ((currentDays - compDays) / compDays) * 100;
        }
    }

    return {
        days: currentDays,
        evolution_percent,
        duration: `${Date.now() - startTime}ms`
    };
}
