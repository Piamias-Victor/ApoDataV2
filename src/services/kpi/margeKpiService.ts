import { AchatsKpiRequest, MargeKpiResponse } from '@/types/kpi';
import { fetchMargeData } from '@/repositories/kpi/margeRepository';
import { getKpiDataWithEvolution } from './base/kpiServiceFactory';

export async function getMargeKpi(request: AchatsKpiRequest): Promise<MargeKpiResponse> {
    console.log('📊 [Service] Getting Marge KPI');

    return getKpiDataWithEvolution(request, {
        key: 'marge',
        fetchData: fetchMargeData,
        calculateEvolutionValue: (data) => data.montant_marge,
        formatResponse: (data, evolution_percent, comparisonData) => {
            const marge_percent = data.montant_ht > 0
                ? (data.montant_marge / data.montant_ht) * 100
                : 0;

            let marge_percent_evolution: number | undefined;

            if (comparisonData && comparisonData.montant_ht > 0) {
                const prev_marge_percent = (comparisonData.montant_marge / comparisonData.montant_ht) * 100;
                
                if (prev_marge_percent !== 0) {
                     marge_percent_evolution = ((marge_percent - prev_marge_percent) / Math.abs(prev_marge_percent)) * 100;
                }
            }

            return {
                montant_marge: data.montant_marge,
                marge_percent,
                ...(marge_percent_evolution !== undefined && { marge_percent_evolution }),
                ...(evolution_percent !== undefined && { evolution_percent })
            };
        }
    });
}
