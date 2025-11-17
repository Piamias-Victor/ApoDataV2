// src/hooks/dashboard/useStockMetrics.ts
import { useMemo, useEffect } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';

interface StockMetricsResponse {
  readonly quantite_stock_actuel_total: number;
  readonly montant_stock_actuel_total: number;
  readonly stock_moyen_12_mois: number;
  readonly jours_de_stock_actuels: number | null;
  readonly nb_references_produits: number;
  readonly nb_pharmacies: number;
  readonly quantite_commandee: number;
  readonly quantite_receptionnee: number;
  readonly montant_commande_ht: number;
  readonly montant_receptionne_ht: number;
  readonly comparison?: {
    readonly quantite_stock_actuel_total: number;
    readonly montant_stock_actuel_total: number;
    readonly stock_moyen_12_mois: number;
    readonly jours_de_stock_actuels: number | null;
    readonly quantite_commandee: number;
    readonly quantite_receptionnee: number;
    readonly montant_commande_ht: number;
    readonly montant_receptionne_ht: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseStockMetricsOptions {
  readonly enabled?: boolean;
  readonly includeComparison?: boolean;
  readonly dateRange?: { start: string; end: string };
  readonly comparisonDateRange?: { start: string | null; end: string | null } | undefined;
  readonly filters?: {
    products?: string[];
    laboratories?: string[];  
    categories?: string[];
    pharmacies?: string[];
  };
}

interface UseStockMetricsReturn {
  readonly data: StockMetricsResponse | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
}

/**
 * Hook useStockMetrics - VERSION AVEC EXCLUSIONS
 * 
 * ✅ Calcule les codes finaux avec exclusions via useMemo
 * ✅ Support des filtres en options pour override
 */
export function useStockMetrics(
  options: UseStockMetricsOptions
): UseStockMetricsReturn {
  
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // 🔥 Récupération des données brutes du store
  const products = useFiltersStore((state) => state.products);
  const selectedLaboratories = useFiltersStore((state) => state.selectedLaboratories);
  const selectedCategories = useFiltersStore((state) => state.selectedCategories);
  const excludedProducts = useFiltersStore((state) => state.excludedProducts);

  // 🔥 Calcul des codes finaux avec useMemo (stable)
  const finalProductCodes = useMemo(() => {
    // Si filtres fournis en options, les utiliser directement
    if (options.filters?.products && options.filters.products.length > 0) {
      return options.filters.products;
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
    
    console.log('🎯 [useStockMetrics] Final product codes calculated:', {
      total: finalCodes.length,
      products: products.length,
      labs: selectedLaboratories.length,
      cats: selectedCategories.length,
      excluded: excludedProducts.length,
      overridden: !!(options.filters?.products)
    });
    
    return finalCodes;
  }, [products, selectedLaboratories, selectedCategories, excludedProducts, options.filters?.products]);

  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: finalProductCodes,
  };

  const effectivePharmacies = options.filters?.pharmacies || pharmacyFilter;
  if (effectivePharmacies.length > 0) {
    standardFilters.pharmacyIds = effectivePharmacies;
  }

  const result = useStandardFetch<StockMetricsResponse>('/api/stock-metrics', {
    enabled: options.enabled,
    dateRange: options.dateRange || analysisDateRange,
    comparisonDateRange: options.comparisonDateRange,
    includeComparison: options.includeComparison,
    filters: standardFilters
  });

  // 🔥 Force refetch quand les exclusions changent (sauf si override)
  useEffect(() => {
    if (!options.filters?.products) {
      console.log('🔄 [useStockMetrics] Exclusions changed, triggering refetch');
      result.refetch();
    }
  }, [excludedProducts.length, result.refetch, options.filters?.products]);

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