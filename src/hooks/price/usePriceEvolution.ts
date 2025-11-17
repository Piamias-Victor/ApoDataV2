// src/hooks/price/usePriceEvolution.ts
import { useMemo, useEffect } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';

interface PriceEvolutionMetrics {
  readonly evolution_prix_vente_pct: number;
  readonly evolution_prix_achat_pct: number;
  readonly evolution_marge_pct: number;
  readonly ecart_prix_vs_marche_pct: number;
  readonly nb_produits_analyses: number;
}

interface PriceEvolutionResponse {
  readonly metrics: PriceEvolutionMetrics;
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UsePriceEvolutionOptions {
  readonly enabled?: boolean;
}

interface UsePriceEvolutionReturn {
  readonly metrics: PriceEvolutionMetrics | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
}

/**
 * Hook usePriceEvolution - VERSION AVEC EXCLUSIONS
 * 
 * ✅ Calcule les codes finaux avec exclusions via useMemo
 */
export function usePriceEvolution(
  options: UsePriceEvolutionOptions = {}
): UsePriceEvolutionReturn {
  
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
    
    console.log('🎯 [usePriceEvolution] Final product codes calculated:', {
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

  const result = useStandardFetch<PriceEvolutionResponse>('/api/price-evolution', {
    enabled: options.enabled,
    dateRange: analysisDateRange,
    filters: standardFilters
  });

  // 🔥 Force refetch quand les exclusions changent
  useEffect(() => {
    console.log('🔄 [usePriceEvolution] Exclusions changed, triggering refetch');
    result.refetch();
  }, [excludedProducts.length, result.refetch]);

  return {
    metrics: result.data?.metrics || null,
    isLoading: result.isLoading,
    error: result.error,
    isError: result.isError,
    queryTime: result.data?.queryTime || 0,
    cached: result.data?.cached || false,
    refetch: result.refetch,
    hasData: !!result.data?.metrics
  };
}