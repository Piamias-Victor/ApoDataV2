// src/hooks/dashboard/useKpiMetrics.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import { useMemo, useEffect } from 'react';
import type { BaseHookReturn, StandardFilters } from '@/hooks/common/types';

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
  readonly comparison?: {
    readonly ca_ttc: number;
    readonly montant_achat_ht: number;
    readonly montant_marge: number;
    readonly quantite_vendue: number;
    readonly quantite_achetee: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseKpiMetricsOptions {
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

interface UseKpiMetricsReturn extends BaseHookReturn<KpiMetricsResponse> {}

/**
 * Hook useKpiMetrics - VERSION AVEC EXCLUSIONS
 * 
 * ✅ Calcule les codes finaux avec exclusions via useMemo
 * ✅ Support des filtres en options pour override
 */
export function useKpiMetrics(
  options: UseKpiMetricsOptions
): UseKpiMetricsReturn {
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
    
    console.log('🎯 [useKpiMetrics] Final product codes calculated:', {
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
    ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
  };

  const result = useStandardFetch<KpiMetricsResponse>('/api/kpis', {
    enabled: options.enabled,
    dateRange: options.dateRange || analysisDateRange,
    comparisonDateRange: options.comparisonDateRange,
    includeComparison: options.includeComparison,
    filters: standardFilters
  });

  // 🔥 Force refetch quand les exclusions changent (sauf si override)
  useEffect(() => {
    if (!options.filters?.products) {
      console.log('🔄 [useKpiMetrics] Exclusions changed, triggering refetch');
      result.refetch();
    }
  }, [excludedProducts.length, result.refetch, options.filters?.products]);

  return result;
}