// src/hooks/pharmacies/usePharmaciesAnalytics.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { BaseHookOptions, BaseHookReturn, StandardFilters } from '@/hooks/common/types';
import { PharmacyMetrics } from '@/components/organisms/PharmaciesTable/types';

// Types spécifiques pharmacies analytics


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
 * Hook usePharmaciesAnalytics - VERSION STANDARDISÉE
 * 
 * Utilise le pattern useStandardFetch avec :
 * - Filtres depuis le store Zustand
 * - Pattern uniforme pour tous les hooks
 * - Gestion d'erreur standardisée
 * - Cache strategy cohérente
 * - Admin uniquement (sécurité API côté serveur)
 * - Évolution relative calculée côté API (performance optimisée)
 */
export function usePharmaciesAnalytics(
  options: UsePharmaciesAnalyticsOptions = {}
): UsePharmaciesAnalyticsReturn {
  // Récupération filtres depuis le store (pattern standardisé)
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Construction filtres standardisés
  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: productsFilter,
    laboratoryCodes: laboratoriesFilter,
    categoryCodes: categoriesFilter,
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
    includeComparison: hasValidComparison, // Maintenant c'est un boolean
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