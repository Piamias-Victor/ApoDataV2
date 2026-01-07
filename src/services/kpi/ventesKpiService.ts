import { AchatsKpiRequest, VentesKpiResponse } from '@/types/kpi';
import { fetchVentesData } from '@/repositories/kpi/ventesRepository';
import { getKpiDataWithEvolution } from './base/kpiServiceFactory';

export async function getVentesKpi(request: AchatsKpiRequest): Promise<VentesKpiResponse> {
    console.log('📊 [Service] Getting Ventes KPI');

    return getKpiDataWithEvolution(request, {
        key: 'ventes',
        fetchData: fetchVentesData,
        calculateEvolutionValue: (data) => data.montant_ttc,
        formatResponse: (data, evolution_percent, comparisonData) => {
            let quantite_vendue_evolution: number | undefined;

            if (comparisonData && comparisonData.quantite_vendue > 0) {
                quantite_vendue_evolution = ((data.quantite_vendue - comparisonData.quantite_vendue) / comparisonData.quantite_vendue) * 100;
            }

            return {
                montant_ht: data.montant_ht,
                montant_ttc: data.montant_ttc,
                quantite_vendue: data.quantite_vendue,
                quantite_vendue_evolution,
                evolution_percent
            };
        }
    });
}
