import { AchatsKpiRequest, AchatsKpiResponse } from '@/types/kpi';
import { fetchAchatsData } from '@/repositories/kpi/achatsRepository';
import { getKpiDataWithEvolution } from './base/kpiServiceFactory';

/**
 * Service to get Achats KPI with caching
 * Returns purchased quantity, amount, and evolution
 */
export async function getAchatsKpi(request: AchatsKpiRequest): Promise<AchatsKpiResponse> {
  console.log('📊 [Service] Getting Achats KPI');

  return getKpiDataWithEvolution(request, {
    key: 'achats',
    fetchData: fetchAchatsData,
    calculateEvolutionValue: (data) => data.montant_ttc,
    formatResponse: (data, evolution_percent, comparisonData) => {
      const quantite_achetee_evolution = comparisonData && comparisonData.quantite_achetee > 0
        ? ((data.quantite_achetee - comparisonData.quantite_achetee) / comparisonData.quantite_achetee) * 100
        : undefined;

      return {
        montant_ht: data.montant_ht,
        montant_ttc: data.montant_ttc,
        quantite_achetee: data.quantite_achetee,
        montant_tarif: data.montant_tarif,
        ...(quantite_achetee_evolution !== undefined && { quantite_achetee_evolution }),
        ...(evolution_percent !== undefined && { evolution_percent })
      };
    }
  });
}
