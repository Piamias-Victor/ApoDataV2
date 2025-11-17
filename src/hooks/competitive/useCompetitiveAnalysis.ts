// src/hooks/competitive/useCompetitiveAnalysis.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import { useMemo, useEffect } from 'react';
import type { StandardFilters } from '@/hooks/common/types';

interface CompetitiveMetrics {
  readonly product_name: string;
  readonly code_ean: string;
  readonly prix_vente_min_global: number;
  readonly prix_vente_max_global: number;
  readonly prix_vente_moyen_global: number;
  readonly nb_pharmacies_vendant: number;
  readonly prix_vente_moyen_selection: number;
  readonly prix_achat_moyen_ht: number;
  readonly quantite_vendue_selection: number;
  readonly taux_marge_moyen_selection: number;
  readonly ecart_prix_vs_marche_pct: number;
}

interface CompetitiveAnalysisResponse {
  readonly products: CompetitiveMetrics[];
  readonly count: number;
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseCompetitiveAnalysisOptions {
  readonly enabled?: boolean;
}

interface UseCompetitiveAnalysisReturn {
  readonly products: CompetitiveMetrics[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly count: number;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
}

/**
 * Hook useCompetitiveAnalysis - VERSION AVEC EXCLUSIONS
 * 
 * Logique sécurisée :
 * - Admin SANS pharmacie → mes prix = marché global
 * - Admin AVEC pharmacie(s) → marché exclu sélection
 * - User → marché exclu ma pharmacie
 * 
 * ✅ Calcule les codes finaux avec exclusions via useMemo
 */
export function useCompetitiveAnalysis(
  options: UseCompetitiveAnalysisOptions = {}
): UseCompetitiveAnalysisReturn {
  
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
    
    console.log('🎯 [useCompetitiveAnalysis] Final product codes calculated:', {
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

  const result = useStandardFetch<CompetitiveAnalysisResponse>('/api/competitive-analysis', {
    enabled: options.enabled,
    dateRange: analysisDateRange,
    filters: standardFilters
  });

  // 🔥 Force refetch quand les exclusions changent
  useEffect(() => {
    console.log('🔄 [useCompetitiveAnalysis] Exclusions changed, triggering refetch');
    result.refetch();
  }, [excludedProducts.length, result.refetch]);

  return {
    products: result.data?.products || [],
    isLoading: result.isLoading,
    error: result.error,
    isError: result.isError,
    queryTime: result.data?.queryTime || 0,
    cached: result.data?.cached || false,
    count: result.data?.count || 0,
    refetch: result.refetch,
    hasData: (result.data?.products?.length || 0) > 0
  };
}