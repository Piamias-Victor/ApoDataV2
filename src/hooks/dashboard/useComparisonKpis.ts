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
}

interface UseComparisonKpisReturn {
  readonly dataA: KpiMetricsResponse | null;
  readonly dataB: KpiMetricsResponse | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTimeA: number;
  readonly queryTimeB: number;
  readonly refetch: () => Promise<void>;
  readonly hasDataA: boolean;
  readonly hasDataB: boolean;
}

export function useComparisonKpis(
  options: UseComparisonKpisOptions
): UseComparisonKpisReturn {
  const { 
    enabled = true, 
    elementA,
    elementB
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

  // Hook pour l'élément A
  const resultA = useStandardFetch<KpiMetricsResponse>('/api/kpis', {
    enabled: enabled && !!elementA,
    dateRange: analysisDateRange,
    filters: filtersA
  });

  // Hook pour l'élément B
  const resultB = useStandardFetch<KpiMetricsResponse>('/api/kpis', {
    enabled: enabled && !!elementB,
    dateRange: analysisDateRange,
    filters: filtersB
  });

  // États combinés
  const isLoading = resultA.isLoading || resultB.isLoading;
  const error = resultA.error || resultB.error;
  const isError = resultA.isError || resultB.isError;

  // Fonction refetch combinée
  const refetch = useCallback(async (): Promise<void> => {
    console.log('🔄 [Hook] Manual refetch triggered for comparison');
    const promises = [];
    
    if (elementA) promises.push(resultA.refetch());
    if (elementB) promises.push(resultB.refetch());
    
    await Promise.all(promises);
  }, [elementA, elementB, resultA.refetch, resultB.refetch]);

  // Log des changements pour debug
  useEffect(() => {
    if (enabled) {
      console.log('🎯 [Hook] Comparison elements changed:', {
        elementA: elementA?.name,
        elementB: elementB?.name,
        dateRange: analysisDateRange
      });
    }
  }, [enabled, elementA?.name, elementB?.name, analysisDateRange]);

  return {
    dataA: resultA.data,
    dataB: resultB.data,
    isLoading,
    error,
    isError,
    queryTimeA: resultA.queryTime,
    queryTimeB: resultB.queryTime,
    refetch,
    hasDataA: resultA.hasData,
    hasDataB: resultB.hasData
  };
}