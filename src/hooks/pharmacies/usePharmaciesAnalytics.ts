// src/hooks/pharmacies/usePharmaciesAnalytics.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { BaseHookOptions, BaseHookReturn, StandardFilters } from '@/hooks/common/types';
import { PharmacyMetrics } from '@/components/organisms/PharmaciesTable/types';

interface PharmaciesAnalyticsResponse {
  readonly pharmacies: PharmacyMetrics[];
  readonly count: number;
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UsePharmaciesAnalyticsOptions extends BaseHookOptions {
  // Options spécifiques si nécessaires
}

interface UsePharmaciesAnalyticsReturn extends BaseHookReturn<PharmaciesAnalyticsResponse> {
  // Propriétés spécifiques pharmacies
  readonly pharmacies: PharmacyMetrics[];
  readonly count: number;
}

/**
 * Hook usePharmaciesAnalytics - VERSION SIMPLIFIÉE
 * 
 * ✅ Utilise directement products du store (contient logique ET/OU + exclusions)
 */
export function usePharmaciesAnalytics(
  options: UsePharmaciesAnalyticsOptions = {}
): UsePharmaciesAnalyticsReturn {
  // Récupération filtres depuis le store
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // 🔥 Lecture directe de products (contient déjà logique ET/OU + exclusions)
  const products = useFiltersStore((state) => state.products);
  const excludedProducts = useFiltersStore((state) => state.excludedProducts);

  console.log('🎯 [usePharmaciesAnalytics] Using products from store:', {
    total: products.length,
    excluded: excludedProducts.length
  });

  // Construction filtres standardisés
  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: products,
    ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
  };

  // CORRECTION: s'assurer que comparisonDateRange est valide pour évolution relative
  const hasValidComparison = Boolean(
    comparisonDateRange?.start && 
    comparisonDateRange?.end &&
    comparisonDateRange.start.trim() !== '' &&
    comparisonDateRange.end.trim() !== ''
  );

  console.log('🔍 [Hook] Pharmacies Analytics:', {
    analysisDateRange,
    comparisonDateRange,
    hasValidComparison,
    filtersCount: Object.keys(standardFilters).length
  });

  // Utilisation hook standardisé
  const {
    data,
    isLoading,
    error,
    isError,
    queryTime,
    cached,
    refetch,
    hasData
  } = useStandardFetch<PharmaciesAnalyticsResponse>('/api/pharmacies/analytics', {
    enabled: options.enabled,
    dateRange: options.dateRange || analysisDateRange,
    comparisonDateRange: options.comparisonDateRange || comparisonDateRange,
    includeComparison: hasValidComparison,
    filters: standardFilters
  });

  return {
    // Retour standardisé
    data,
    isLoading,
    error,
    isError,
    queryTime,
    cached,
    refetch,
    hasData,
    // Propriétés spécifiques facilement accessibles
    pharmacies: data?.pharmacies || [],
    count: data?.count || 0
  };
}