// src/hooks/ventes/useSalesKpiMetrics.ts
import { useMemo, useEffect } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';

interface SalesKpiMetricsResponse {
  readonly quantite_vendue: number;
  readonly ca_ttc: number;
  readonly part_marche_ca_pct: number;
  readonly part_marche_marge_pct: number;
  readonly nb_references_selection: number;
  readonly nb_references_80pct_ca: number;
  readonly montant_marge: number;
  readonly taux_marge_pct: number;
  readonly comparison?: {
    readonly quantite_vendue: number;
    readonly ca_ttc: number;
    readonly part_marche_ca_pct: number;
    readonly part_marche_marge_pct: number;
    readonly nb_references_selection: number;
    readonly nb_references_80pct_ca: number;
    readonly montant_marge: number;
    readonly taux_marge_pct: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseSalesKpiMetricsOptions {
  readonly enabled?: boolean | undefined;
  readonly includeComparison?: boolean | undefined;
  readonly dateRange?: { start: string; end: string } | undefined;
  readonly comparisonDateRange?: { start: string | null; end: string | null } | undefined;
  readonly filters?: {
    products?: string[];
    laboratories?: string[];
    categories?: string[];
    pharmacies?: string[];
  } | undefined;
}

interface UseSalesKpiMetricsReturn {
  readonly data: SalesKpiMetricsResponse | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
}

/**
 * Hook useSalesKpiMetrics - VERSION AVEC EXCLUSIONS
 * 
 * ✅ Calcule les codes finaux avec exclusions via useMemo
 */
export function useSalesKpiMetrics(
  options: UseSalesKpiMetricsOptions = {}
): UseSalesKpiMetricsReturn {
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
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
    
    console.log('🎯 [useSalesKpiMetrics] Final product codes calculated:', {
      total: finalCodes.length,
      products: products.length,
      labs: selectedLaboratories.length,
      cats: selectedCategories.length,
      excluded: excludedProducts.length
    });
    
    return finalCodes;
  }, [products, selectedLaboratories, selectedCategories, excludedProducts]);

  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: finalProductCodes,
    ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
  };

  const result = useStandardFetch<SalesKpiMetricsResponse>('/api/ventes/kpis', {
    enabled: options.enabled,
    dateRange: options.dateRange || analysisDateRange,
    comparisonDateRange: options.comparisonDateRange,
    includeComparison: options.includeComparison,
    filters: standardFilters
  });

  // 🔥 Force refetch quand les exclusions changent
  useEffect(() => {
    console.log('🔄 [useSalesKpiMetrics] Exclusions changed, triggering refetch');
    result.refetch();
  }, [excludedProducts.length, result.refetch]);

  return {
    data: result.data,
    isLoading: result.isLoading,
    error: result.error,
    isError: result.isError,
    queryTime: result.queryTime,
    cached: result.cached,
    refetch: result.refetch,
    hasData: result.hasData
  };
}