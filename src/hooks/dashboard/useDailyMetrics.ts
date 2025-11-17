// src/hooks/dashboard/useDailyMetrics.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import { useMemo, useEffect } from 'react';
import type { StandardFilters } from '@/hooks/common/types';

interface DailyMetricsEntry {
  date: string;
  quantite_vendue_jour: number;
  ca_ttc_jour: number;
  marge_jour: number;
  quantite_achat_jour: number;
  montant_achat_jour: number;
  stock_jour: number;
  cumul_quantite_vendue: number;
  cumul_quantite_achetee: number;
  cumul_ca_ttc: number;
  cumul_montant_achat: number;
  cumul_marge: number;
}

interface DailyMetricsResponse {
  data: DailyMetricsEntry[];
  queryTime: number;
  cached: boolean;
}

interface UseDailyMetricsOptions {
  enabled?: boolean | undefined;
  dateRange?: { start: string; end: string } | undefined;
  productCodes?: string[] | undefined;
  pharmacyId?: string | undefined;
}

interface UseDailyMetricsReturn {
  readonly data: DailyMetricsEntry[] | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
}

/**
 * Hook useDailyMetrics - VERSION AVEC EXCLUSIONS
 * 
 * ✅ Calcule les codes finaux avec exclusions via useMemo
 * ✅ Support des productCodes en options pour override
 */
export function useDailyMetrics(
  options: UseDailyMetricsOptions = {}
): UseDailyMetricsReturn {
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // 🔥 Récupération des données brutes du store
  const products = useFiltersStore((state) => state.products);
  const selectedLaboratories = useFiltersStore((state) => state.selectedLaboratories);
  const selectedCategories = useFiltersStore((state) => state.selectedCategories);
  const excludedProducts = useFiltersStore((state) => state.excludedProducts);

  // 🔥 Calcul des codes finaux avec useMemo (stable)
  const finalProductCodes = useMemo(() => {
    // Si productCodes fournis en options, les utiliser directement
    if (options.productCodes && options.productCodes.length > 0) {
      return options.productCodes;
    }

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
    
    console.log('🎯 [useDailyMetrics] Final product codes calculated:', {
      total: finalCodes.length,
      products: products.length,
      labs: selectedLaboratories.length,
      cats: selectedCategories.length,
      excluded: excludedProducts.length,
      overridden: !!options.productCodes
    });
    
    return finalCodes;
  }, [products, selectedLaboratories, selectedCategories, excludedProducts, options.productCodes]);

  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: finalProductCodes,
    ...(options.pharmacyId && { pharmacyId: options.pharmacyId }),
    ...(!options.pharmacyId && pharmacyFilter.length > 0 && { pharmacyId: pharmacyFilter[0] })
  };

  const {
    data: response,
    isLoading,
    error,
    isError,
    queryTime,
    cached,
    refetch,
    hasData
  } = useStandardFetch<DailyMetricsResponse>('/api/daily-metrics', {
    enabled: options.enabled,
    dateRange: options.dateRange || analysisDateRange,
    filters: standardFilters
  });

  // 🔥 Force refetch quand les exclusions changent (sauf si productCodes en override)
  useEffect(() => {
    if (!options.productCodes) {
      console.log('🔄 [useDailyMetrics] Exclusions changed, triggering refetch');
      refetch();
    }
  }, [excludedProducts.length, refetch, options.productCodes]);

  return {
    data: response?.data || null,
    isLoading,
    error,
    isError,
    queryTime,
    cached,
    refetch,
    hasData
  };
}