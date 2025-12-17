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
    formatResponse: (data, evolution_percent) => ({
      montant_ht: data.montant_ht,
      montant_ttc: data.montant_ttc,
      quantite_achetee: data.quantite_achetee,
      evolution_percent
    })
  });
}
