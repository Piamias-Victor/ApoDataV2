// src/hooks/laboratories/useLaboratoryMarketShareWithFilters.ts
import { useMemo } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useLaboratoryMarketShare } from '@/hooks/generic-groups/useLaboratoryMarketShare';

export function useLaboratoryMarketShareWithFilters() {
  // Récupération des filtres depuis le store principal
  const productsFilter = useFiltersStore(state => state.products);
  const laboratoriesFilter = useFiltersStore(state => state.laboratories);
  const categoriesFilter = useFiltersStore(state => state.categories);
  const analysisDateRange = useFiltersStore(state => state.analysisDateRange);
  
  // Fusion de tous les codes produits
  const allProductCodes = useMemo(() => {
    return Array.from(new Set([
      ...productsFilter,
      ...laboratoriesFilter,
      ...categoriesFilter
    ]));
  }, [productsFilter, laboratoriesFilter, categoriesFilter]);
  
  // Utilisation du hook existant
  return useLaboratoryMarketShare({
    enabled: allProductCodes.length > 0,
    productCodes: allProductCodes,
    dateRange: analysisDateRange,
    pageSize: 10
  });
}