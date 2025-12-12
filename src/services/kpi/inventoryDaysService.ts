import { AchatsKpiRequest, InventoryDaysResponse } from '@/types/kpi';
import { fetchInventoryDays } from '@/repositories/kpi/inventoryDaysRepository';
import { getKpiDataWithEvolution } from './base/kpiServiceFactory';

export async function getInventoryDaysKpi(request: AchatsKpiRequest): Promise<InventoryDaysResponse> {
    return getKpiDataWithEvolution(request, {
        key: 'inventory_days',
        fetchData: (req) => fetchInventoryDays(req, req.dateRange?.end || ''),
        calculateEvolutionValue: (days) => days,
        formatResponse: (days, evolution_percent) => ({
            days,
            evolution_percent
        })
    });
}
