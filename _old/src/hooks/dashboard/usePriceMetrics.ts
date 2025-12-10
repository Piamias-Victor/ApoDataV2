// src/hooks/dashboard/usePriceMetrics.ts
import { useMemo, useEffect } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';

interface UsePriceMetricsOptions {
  enabled?: boolean;
  dateRange?: { start: string; end: string };
  productCodes?: string[];
  pharmacyId?: string | undefined;
}

interface PriceMetricsEntry {
  mois: string;
  quantite_vendue_mois: number;
  prix_vente_ttc_moyen: number;
  prix_achat_ht_moyen: number;
  taux_marge_moyen_pourcentage: number;
}

interface PriceMetricsResponse {
  data: PriceMetricsEntry[];
  queryTime: number;
  cached: boolean;
}

interface UsePriceMetricsReturn {
  data: PriceMetricsEntry[] | null;
  isLoading: boolean;
  error: string | null;
  isError: boolean;
  refetch: () => Promise<void>;
  hasData: boolean;
  queryTime: number;
  cached: boolean;
}

/**
 * Hook usePriceMetrics - VERSION AVEC EXCLUSIONS
 * 
 * ✅ Calcule les codes finaux avec exclusions via useMemo
 * ✅ Support des productCodes en options pour override
 */
export function usePriceMetrics(options: UsePriceMetricsOptions): UsePriceMetricsReturn {
  const {
    enabled = true,
    dateRange,
    productCodes = [],
    pharmacyId
  } = options;

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
    if (productCodes.length > 0) {
      return productCodes;
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
    
    console.log('🎯 [usePriceMetrics] Final product codes calculated:', {
      total: finalCodes.length,
      products: products.length,
      labs: selectedLaboratories.length,
      cats: selectedCategories.length,
      excluded: excludedProducts.length,
      overridden: productCodes.length > 0
    });
    
    return finalCodes;
  }, [products, selectedLaboratories, selectedCategories, excludedProducts, productCodes]);

  // Construction des filtres
  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: finalProductCodes,
  };

  // Ajout conditionnel du pharmacyId
  const effectivePharmacyId = pharmacyId || (pharmacyFilter.length > 0 ? pharmacyFilter[0] : undefined);
  if (effectivePharmacyId) {
    standardFilters.pharmacyId = effectivePharmacyId;
  }

  const result = useStandardFetch<PriceMetricsResponse>('/api/price-metrics', {
    enabled,
    dateRange: dateRange || analysisDateRange,
    filters: standardFilters
  });

  // 🔥 Force refetch quand les exclusions changent (sauf si productCodes en override)
  useEffect(() => {
    if (productCodes.length === 0) {
      console.log('🔄 [usePriceMetrics] Exclusions changed, triggering refetch');
      result.refetch();
    }
  }, [excludedProducts.length, result.refetch, productCodes.length]);

  return {
    data: result.data?.data || null,
    isLoading: result.isLoading,
    error: result.error,
    isError: result.isError,
    refetch: result.refetch,
    hasData: !!(result.data?.data && result.data.data.length > 0),
    queryTime: result.data?.queryTime || 0,
    cached: result.data?.cached || false
  };
}