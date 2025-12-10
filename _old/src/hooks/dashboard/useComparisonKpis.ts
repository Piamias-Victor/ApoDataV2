// src/hooks/dashboard/useComparisonKpis.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';
import type { ComparisonElement } from '@/types/comparison';
import { useCallback, useEffect, useMemo } from 'react';

interface KpiMetricsResponse {
  readonly ca_ttc: number;
  readonly montant_achat_ht: number;
  readonly montant_marge: number;
  readonly pourcentage_marge: number;
  readonly valeur_stock_ht: number;
  readonly quantite_stock: number;
  readonly quantite_vendue: number;
  readonly quantite_achetee: number;
  readonly jours_de_stock: number | null;
  readonly nb_references_produits: number;
  readonly nb_pharmacies: number;
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseComparisonKpisOptions {
  readonly enabled?: boolean;
  readonly elementA: ComparisonElement | null;
  readonly elementB: ComparisonElement | null;
  readonly elementC: ComparisonElement | null;
}

interface UseComparisonKpisReturn {
  readonly dataA: KpiMetricsResponse | null;
  readonly dataB: KpiMetricsResponse | null;
  readonly dataC: KpiMetricsResponse | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTimeA: number;
  readonly queryTimeB: number;
  readonly queryTimeC: number;
  readonly refetch: () => Promise<void>;
  readonly hasDataA: boolean;
  readonly hasDataB: boolean;
  readonly hasDataC: boolean;
  readonly selectedCount: number;
}

export function useComparisonKpis(
  options: UseComparisonKpisOptions
): UseComparisonKpisReturn {
  const { 
    enabled = true, 
    elementA,
    elementB,
    elementC
  } = options;

  const analysisDateRange = useFiltersStore(state => state.analysisDateRange);
  const pharmacyFilter = useFiltersStore(state => state.pharmacy);

  // Fonction pour mapper ComparisonElement vers filtres API
  const mapElementToFilters = useCallback((element: ComparisonElement | null) => {
    if (!element) return {};

    switch (element.type) {
      case 'product':
        return { productCodes: [element.id] };
      case 'laboratory':
        return { productCodes: element.metadata.product_codes || [] };
      case 'category':
        return { productCodes: element.metadata.product_codes || [] };
      default:
        return {};
    }
  }, []);

  // Filtres pour l'élément A
  const filtersA = useMemo(() => {
    const baseFilters = mapElementToFilters(elementA);
    const standardFilters: StandardFilters & Record<string, any> = {
      ...baseFilters
    };
    
    if (pharmacyFilter.length > 0) {
      standardFilters.pharmacyIds = pharmacyFilter;
    }
    
    return standardFilters;
  }, [elementA, pharmacyFilter, mapElementToFilters]);

  // Filtres pour l'élément B
  const filtersB = useMemo(() => {
    const baseFilters = mapElementToFilters(elementB);
    const standardFilters: StandardFilters & Record<string, any> = {
      ...baseFilters
    };
    
    if (pharmacyFilter.length > 0) {
      standardFilters.pharmacyIds = pharmacyFilter;
    }
    
    return standardFilters;
  }, [elementB, pharmacyFilter, mapElementToFilters]);

  // Filtres pour l'élément C
  const filtersC = useMemo(() => {
    const baseFilters = mapElementToFilters(elementC);
    const standardFilters: StandardFilters & Record<string, any> = {
      ...baseFilters
    };
    
    if (pharmacyFilter.length > 0) {
      standardFilters.pharmacyIds = pharmacyFilter;
    }
    
    return standardFilters;
  }, [elementC, pharmacyFilter, mapElementToFilters]);

  // Hooks pour chaque élément
  const resultA = useStandardFetch<KpiMetricsResponse>('/api/kpis', {
    enabled: enabled && !!elementA,
    dateRange: analysisDateRange,
    filters: filtersA
  });

  const resultB = useStandardFetch<KpiMetricsResponse>('/api/kpis', {
    enabled: enabled && !!elementB,
    dateRange: analysisDateRange,
    filters: filtersB
  });

  const resultC = useStandardFetch<KpiMetricsResponse>('/api/kpis', {
    enabled: enabled && !!elementC,
    dateRange: analysisDateRange,
    filters: filtersC
  });

  // États combinés
  const isLoading = resultA.isLoading || resultB.isLoading || resultC.isLoading;
  const error = resultA.error || resultB.error || resultC.error;
  const isError = resultA.isError || resultB.isError || resultC.isError;
  const selectedCount = [elementA, elementB, elementC].filter(Boolean).length;

  // Fonction refetch combinée
  const refetch = useCallback(async (): Promise<void> => {
    console.log('🔄 [Hook] Manual refetch triggered for comparison');
    const promises = [];
    
    if (elementA) promises.push(resultA.refetch());
    if (elementB) promises.push(resultB.refetch());
    if (elementC) promises.push(resultC.refetch());
    
    await Promise.all(promises);
  }, [elementA, elementB, elementC, resultA.refetch, resultB.refetch, resultC.refetch]);

  // Log des changements pour debug
  useEffect(() => {
    if (enabled) {
      console.log('🎯 [Hook] Comparison elements changed:', {
        elementA: elementA?.name,
        elementB: elementB?.name,
        elementC: elementC?.name,
        selectedCount,
        dateRange: analysisDateRange
      });
    }
  }, [enabled, elementA?.name, elementB?.name, elementC?.name, selectedCount, analysisDateRange]);

  return {
    dataA: resultA.data,
    dataB: resultB.data,
    dataC: resultC.data,
    isLoading,
    error,
    isError,
    queryTimeA: resultA.queryTime,
    queryTimeB: resultB.queryTime,
    queryTimeC: resultC.queryTime,
    refetch,
    hasDataA: resultA.hasData,
    hasDataB: resultB.hasData,
    hasDataC: resultC.hasData,
    selectedCount
  };
}