import { AchatsKpiRequest, MargeKpiResponse } from '@/types/kpi';
import { fetchMargeData } from '@/repositories/kpi/margeRepository';
import { getKpiDataWithEvolution } from './base/kpiServiceFactory';

export async function getMargeKpi(request: AchatsKpiRequest): Promise<MargeKpiResponse> {
    console.log('📊 [Service] Getting Marge KPI');

    return getKpiDataWithEvolution(request, {
        key: 'marge',
        fetchData: fetchMargeData,
        calculateEvolutionValue: (data) => data.montant_marge,
        formatResponse: (data, evolution_percent) => {
            const marge_percent = data.montant_ht > 0
                ? (data.montant_marge / data.montant_ht) * 100
                : 0;
            return {
                montant_marge: data.montant_marge,
                marge_percent,
                evolution_percent
            };
        }
    });
}
