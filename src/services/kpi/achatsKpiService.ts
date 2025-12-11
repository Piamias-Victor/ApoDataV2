// src/services/kpi/achatsKpiService.ts
import { fetchAchatsData } from '@/repositories/kpi/achatsRepository';
import { AchatsKpiRequest, AchatsKpiResponse } from '@/types/kpi';
import { queryCache, withCache } from '@/lib/cache/queryCache';

/**
 * Service to get Achats KPI with caching
 * Returns purchased quantity, amount, and evolution
 */
export async function getAchatsKpi(request: AchatsKpiRequest): Promise<AchatsKpiResponse> {
  console.log('📊 [Service] Getting Achats KPI');

  // Generate cache key for current period
  const currentCacheKey = queryCache.generateKey('achats', {
    dateRange: request.dateRange,
    productCodes: request.productCodes,
    laboratories: request.laboratories,
    categories: request.categories,
    pharmacyIds: request.pharmacyIds,
    filterOperators: request.filterOperators,
    // Settings
    tvaRates: request.tvaRates,
    reimbursementStatus: request.reimbursementStatus,
    isGeneric: request.isGeneric
  });

  // Fetch current period data with cache
  const currentData = await withCache(currentCacheKey, () => fetchAchatsData(request));

  // Calculate evolution if comparison period provided
  let evolution_percent: number | undefined;

  if (request.comparisonDateRange) {
    console.log('📊 [Service] Calculating evolution with comparison period');

    // Generate cache key for comparison period
    const comparisonCacheKey = queryCache.generateKey('achats', {
      dateRange: request.comparisonDateRange,
      productCodes: request.productCodes,
      laboratories: request.laboratories,
      categories: request.categories,
      pharmacyIds: request.pharmacyIds,
      filterOperators: request.filterOperators,
      // Settings
      tvaRates: request.tvaRates,
      reimbursementStatus: request.reimbursementStatus,
      isGeneric: request.isGeneric
    });

    // Fetch comparison period data with cache
    const comparisonData = await withCache(comparisonCacheKey, () =>
      fetchAchatsData({
        ...request,
        dateRange: request.comparisonDateRange!
      })
    );

    // Evolution based on montant_ht (not quantity)
    if (comparisonData.montant_ht > 0) {
      evolution_percent = ((currentData.montant_ht - comparisonData.montant_ht) / comparisonData.montant_ht) * 100;

      console.log('📊 [Service] Evolution calculated:', {
        current: currentData.montant_ht,
        comparison: comparisonData.montant_ht,
        evolution: evolution_percent
      });
    }
  }

  return {
    montant_ht: currentData.montant_ht,
    quantite_achetee: currentData.quantite_achetee,
    evolution_percent
  };
}
