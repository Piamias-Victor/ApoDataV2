// src/hooks/pharmacies/usePharmaciesAnalytics.ts
import { useMemo, useEffect } from 'react';
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
 * Hook usePharmaciesAnalytics - VERSION AVEC EXCLUSIONS
 * 
 * ✅ Calcule les codes finaux avec exclusions via useMemo
 */
export function usePharmaciesAnalytics(
  options: UsePharmaciesAnalyticsOptions = {}
): UsePharmaciesAnalyticsReturn {
  // Récupération filtres depuis le store (pattern standardisé)
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // 🔥 Récupération des données brutes du store
  const products = useFiltersStore((state) => state.products);
  const selectedLaboratories = useFiltersStore((state) => state.selectedLaboratories);
  const selectedCategories = useFiltersStore((state) => state.selectedCategories);
  const excludedProducts = useFiltersStore((state) => state.excludedProducts);

  // 🔥 Calcul des codes finaux avec useMemo (stable)
  const finalProductCodes = useMemo(() => {
    const allCodes = new Set<string>();
    const excludedSet = new Set(excludedProducts);
    
    // Ajouter produits manuels (après exclusion)
    products.forEach(code => {
      if (!excludedSet.has(code)) {
        allCodes.add(code);
      }
    });
    
    // Ajouter codes des labos (après exclusion)
    selectedLaboratories.forEach(lab => {
      lab.productCodes.forEach(code => {
        if (!excludedSet.has(code)) {
          allCodes.add(code);
        }
      });
    });
    
    // Ajouter codes des catégories (après exclusion)
    selectedCategories.forEach(cat => {
      cat.productCodes.forEach(code => {
        if (!excludedSet.has(code)) {
          allCodes.add(code);
        }
      });
    });
    
    const finalCodes = Array.from(allCodes);
    
    console.log('🎯 [usePharmaciesAnalytics] Final product codes calculated:', {
      total: finalCodes.length,
      products: products.length,
      labs: selectedLaboratories.length,
      cats: selectedCategories.length,
      excluded: excludedProducts.length
    });
    
    return finalCodes;
  }, [products, selectedLaboratories, selectedCategories, excludedProducts]);

  // Construction filtres standardisés
  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: finalProductCodes,
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

  // 🔥 Force refetch quand les exclusions changent
  useEffect(() => {
    console.log('🔄 [usePharmaciesAnalytics] Exclusions changed, triggering refetch');
    refetch();
  }, [excludedProducts.length, refetch]);

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