import { AchatsKpiRequest, PriceEvolutionResponse } from '@/types/kpi';
import { fetchPriceEvolutionData } from '@/repositories/kpi/priceEvolutionRepository';
import { getKpiDataWithEvolution } from './base/kpiServiceFactory';

export async function getPriceEvolutionKpi(request: AchatsKpiRequest): Promise<PriceEvolutionResponse> {
    return getKpiDataWithEvolution(request, {
        key: 'price_evolution',
        fetchData: fetchPriceEvolutionData,
        calculateEvolutionValue: (data) => data.avg_purchase_price,
        formatResponse: (data, purchase_evolution_percent, comparisonData) => {
            let sell_evolution_percent: number | undefined;
            if (comparisonData && comparisonData.avg_sell_price_ttc > 0) {
                sell_evolution_percent = ((data.avg_sell_price_ttc - comparisonData.avg_sell_price_ttc) / comparisonData.avg_sell_price_ttc) * 100;
            }

            return {
                purchase_price: data.avg_purchase_price,
                purchase_evolution_percent,
                sell_price: data.avg_sell_price_ttc,
                sell_evolution_percent
            };
        }
    });
}
