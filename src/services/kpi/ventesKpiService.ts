import { AchatsKpiRequest, VentesKpiResponse } from '@/types/kpi';
import { fetchVentesData } from '@/repositories/kpi/ventesRepository';
import { getKpiDataWithEvolution } from './base/kpiServiceFactory';

export async function getVentesKpi(request: AchatsKpiRequest): Promise<VentesKpiResponse> {
    console.log('📊 [Service] Getting Ventes KPI');

    return getKpiDataWithEvolution(request, {
        key: 'ventes',
        fetchData: fetchVentesData,
        calculateEvolutionValue: (data) => data.montant_ttc,
        formatResponse: (data, evolution_percent) => ({
            montant_ht: data.montant_ht,
            montant_ttc: data.montant_ttc,
            quantite_vendue: data.quantite_vendue,
            evolution_percent
        })
    });
}
