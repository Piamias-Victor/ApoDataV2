// src/hooks/pharmacies/usePharmaciesKpiMetrics.ts
import { useMemo, useEffect } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { BaseHookReturn, StandardFilters } from '@/hooks/common/types';

interface PharmaciesKpiMetricsResponse {
  readonly nb_pharmacies_vendeuses: number;
  readonly pct_pharmacies_vendeuses_selection: number;
  readonly nb_pharmacies_80pct_ca: number;
  readonly pct_pharmacies_80pct_ca: number;
  readonly ca_moyen_pharmacie: number;
  readonly ca_median_pharmacie: number;
  readonly quantite_moyenne_pharmacie: number;
  readonly quantite_mediane_pharmacie: number;
  readonly taux_penetration_produit_pct: number;
  readonly pharmacies_avec_produit: number;
  readonly total_pharmacies_reseau: number;
  readonly ca_total: number;
  readonly quantite_totale: number;
  readonly nb_pharmacies_vendeuses_total: number;
  readonly comparison?: {
    readonly nb_pharmacies_vendeuses: number;
    readonly pct_pharmacies_vendeuses_selection: number;
    readonly nb_pharmacies_80pct_ca: number;
    readonly pct_pharmacies_80pct_ca: number;
    readonly ca_moyen_pharmacie: number;
    readonly ca_median_pharmacie: number;
    readonly quantite_moyenne_pharmacie: number;
    readonly quantite_mediane_pharmacie: number;
    readonly taux_penetration_produit_pct: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UsePharmaciesKpiMetricsOptions {
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

interface UsePharmaciesKpiMetricsReturn extends BaseHookReturn<PharmaciesKpiMetricsResponse> {}

/**
 * Hook usePharmaciesKpiMetrics - VERSION AVEC EXCLUSIONS
 * 
 * ✅ Calcule les codes finaux avec exclusions via useMemo
 */
export function usePharmaciesKpiMetrics(
  options: UsePharmaciesKpiMetricsOptions
): UsePharmaciesKpiMetricsReturn {
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
    
    console.log('🎯 [usePharmaciesKpiMetrics] Final product codes calculated:', {
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

  const result = useStandardFetch<PharmaciesKpiMetricsResponse>('/api/pharmacies/kpis', {
    enabled: options.enabled,
    dateRange: options.dateRange || analysisDateRange,
    comparisonDateRange: options.comparisonDateRange,
    includeComparison: options.includeComparison,
    filters: standardFilters
  });

  // 🔥 Force refetch quand les exclusions changent
  useEffect(() => {
    console.log('🔄 [usePharmaciesKpiMetrics] Exclusions changed, triggering refetch');
    result.refetch();
  }, [excludedProducts.length, result.refetch]);

  return result;
}