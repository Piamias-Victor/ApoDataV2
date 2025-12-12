import { AchatsKpiRequest, StockKpiResponse } from '@/types/kpi';
import { fetchStockData } from '@/repositories/kpi/stockRepository';
import { getKpiDataWithEvolution } from './base/kpiServiceFactory';

export async function getStockKpi(request: AchatsKpiRequest): Promise<StockKpiResponse> {
    console.log('📦 [Service] Getting Stock KPI');

    return getKpiDataWithEvolution(request, {
        key: 'stock',
        fetchData: (req) => fetchStockData(req, req.dateRange?.end || ''),
        calculateEvolutionValue: (data) => data.stock_value_ht,
        formatResponse: (data, evolution_percent) => ({
            stock_value_ht: data.stock_value_ht,
            stock_quantity: data.stock_quantity,
            evolution_percent
        })
    });
}
