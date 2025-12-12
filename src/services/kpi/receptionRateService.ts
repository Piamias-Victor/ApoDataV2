import { AchatsKpiRequest, ReceptionRateResponse } from '@/types/kpi';
import { fetchReceptionRate } from '@/repositories/kpi/receptionRateRepository';
import { getKpiDataWithEvolution } from './base/kpiServiceFactory';

export async function getReceptionRateKpi(request: AchatsKpiRequest): Promise<ReceptionRateResponse> {
    return getKpiDataWithEvolution(request, {
        key: 'reception_rate',
        fetchData: fetchReceptionRate,
        calculateEvolutionValue: (rate) => rate,
        formatResponse: (rate, evolution_percent) => ({
            rate,
            evolution_percent
        })
    });
}
