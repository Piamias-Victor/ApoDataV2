// src/hooks/ruptures/useOrderReceptionMetrics.ts
import { useMemo, useEffect } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { BaseHookReturn, StandardFilters } from '@/hooks/common/types';

interface OrderReceptionMetricsResponse {
  readonly quantite_commandee: number;
  readonly quantite_receptionnee: number;
  readonly montant_commande_ht: number;
  readonly montant_receptionne_ht: number;
  readonly delta_quantite: number;
  readonly delta_montant: number;
  readonly taux_reception_quantite: number;
  readonly taux_reception_montant: number;
  readonly nb_commandes: number;
  readonly nb_lignes_commandes: number;
  readonly nb_fournisseurs: number;
  readonly nb_references_total: number;
  readonly nb_references_rupture: number;
  readonly taux_references_rupture: number;
  readonly delai_moyen_reception_jours: number | null;
  readonly comparison?: {
    readonly quantite_commandee: number;
    readonly quantite_receptionnee: number;
    readonly montant_commande_ht: number;
    readonly montant_receptionne_ht: number;
    readonly delta_quantite: number;
    readonly delta_montant: number;
    readonly nb_references_total: number;
    readonly nb_references_rupture: number;
    readonly taux_references_rupture: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseOrderReceptionMetricsOptions {
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

interface UseOrderReceptionMetricsReturn extends BaseHookReturn<OrderReceptionMetricsResponse> {}

/**
 * Hook useOrderReceptionMetrics - VERSION AVEC EXCLUSIONS
 * 
 * ✅ Calcule les codes finaux avec exclusions via useMemo
 */
export function useOrderReceptionMetrics(
  options: UseOrderReceptionMetricsOptions = {}
): UseOrderReceptionMetricsReturn {
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
    
    console.log('🎯 [useOrderReceptionMetrics] Final product codes calculated:', {
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

  const result = useStandardFetch<OrderReceptionMetricsResponse>('/api/ruptures/order-reception-metrics', {
    enabled: options.enabled,
    dateRange: options.dateRange || analysisDateRange,
    comparisonDateRange: options.comparisonDateRange,
    includeComparison: options.includeComparison,
    filters: standardFilters
  });

  // 🔥 Force refetch quand les exclusions changent
  useEffect(() => {
    console.log('🔄 [useOrderReceptionMetrics] Exclusions changed, triggering refetch');
    result.refetch();
  }, [excludedProducts.length, result.refetch]);

  return result;
}