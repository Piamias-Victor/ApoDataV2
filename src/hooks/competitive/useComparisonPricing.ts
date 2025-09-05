// src/hooks/competitive/useComparisonPricing.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';
import type { ComparisonElement } from '@/types/comparison';
import { useCallback, useEffect, useMemo } from 'react';

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

interface UseComparisonPricingOptions {
 readonly enabled?: boolean;
 readonly elementA: ComparisonElement | null;
 readonly elementB: ComparisonElement | null;
}

interface UseComparisonPricingReturn {
 readonly productsA: CompetitiveMetrics[];
 readonly productsB: CompetitiveMetrics[];
 readonly isLoading: boolean;
 readonly error: string | null;
 readonly isError: boolean;
 readonly queryTimeA: number;
 readonly queryTimeB: number;
 readonly refetch: () => Promise<void>;
 readonly hasDataA: boolean;
 readonly hasDataB: boolean;
}

export function useComparisonPricing(
 options: UseComparisonPricingOptions
): UseComparisonPricingReturn {
 const { 
   enabled = true, 
   elementA,
   elementB
 } = options;

 const analysisDateRange = useFiltersStore(state => state.analysisDateRange);
 const pharmacyFilter = useFiltersStore(state => state.pharmacy);

 // Fonction pour mapper ComparisonElement vers productCodes
 const mapElementToProductCodes = useCallback((element: ComparisonElement | null): string[] => {
   if (!element) return [];

   switch (element.type) {
     case 'product':
       return [element.id];
     case 'laboratory':
     case 'category':
       return element.metadata.product_codes || [];
     default:
       return [];
   }
 }, []);

 // Filtres pour l'élément A
 const filtersA = useMemo(() => {
   const productCodes = mapElementToProductCodes(elementA);
   const standardFilters: StandardFilters & Record<string, any> = {
     productCodes,
     laboratoryCodes: [],
     categoryCodes: []
   };
   
   if (pharmacyFilter.length > 0) {
     standardFilters.pharmacyIds = pharmacyFilter;
   }
   
   return standardFilters;
 }, [elementA, pharmacyFilter, mapElementToProductCodes]);

 // Filtres pour l'élément B
 const filtersB = useMemo(() => {
   const productCodes = mapElementToProductCodes(elementB);
   const standardFilters: StandardFilters & Record<string, any> = {
     productCodes,
     laboratoryCodes: [],
     categoryCodes: []
   };
   
   if (pharmacyFilter.length > 0) {
     standardFilters.pharmacyIds = pharmacyFilter;
   }
   
   return standardFilters;
 }, [elementB, pharmacyFilter, mapElementToProductCodes]);

 // Hook pour l'élément A
 const resultA = useStandardFetch<CompetitiveAnalysisResponse>('/api/competitive-analysis', {
   enabled: enabled && !!elementA && mapElementToProductCodes(elementA).length > 0,
   dateRange: analysisDateRange,
   filters: filtersA
 });

 // Hook pour l'élément B
 const resultB = useStandardFetch<CompetitiveAnalysisResponse>('/api/competitive-analysis', {
   enabled: enabled && !!elementB && mapElementToProductCodes(elementB).length > 0,
   dateRange: analysisDateRange,
   filters: filtersB
 });

 // États combinés
 const isLoading = resultA.isLoading || resultB.isLoading;
 const error = resultA.error || resultB.error;
 const isError = resultA.isError || resultB.isError;

 // Fonction refetch combinée
 const refetch = useCallback(async (): Promise<void> => {
   console.log('🔄 [Hook] Manual refetch triggered for pricing comparison');
   const promises = [];
   
   if (elementA && mapElementToProductCodes(elementA).length > 0) {
     promises.push(resultA.refetch());
   }
   if (elementB && mapElementToProductCodes(elementB).length > 0) {
     promises.push(resultB.refetch());
   }
   
   await Promise.all(promises);
 }, [elementA, elementB, resultA.refetch, resultB.refetch, mapElementToProductCodes]);

 // Log des changements pour debug
 useEffect(() => {
   if (enabled) {
     console.log('🎯 [Hook] Pricing comparison elements changed:', {
       elementA: elementA?.name,
       elementB: elementB?.name,
       productCodesA: mapElementToProductCodes(elementA).length,
       productCodesB: mapElementToProductCodes(elementB).length,
       dateRange: analysisDateRange
     });
   }
 }, [enabled, elementA?.name, elementB?.name, analysisDateRange, mapElementToProductCodes]);

 return {
   productsA: resultA.data?.products || [],
   productsB: resultB.data?.products || [],
   isLoading,
   error,
   isError,
   queryTimeA: resultA.queryTime,
   queryTimeB: resultB.queryTime,
   refetch,
   hasDataA: !!(resultA.data?.products && resultA.data.products.length > 0),
   hasDataB: !!(resultB.data?.products && resultB.data.products.length > 0)
 };
}