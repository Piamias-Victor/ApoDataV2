// src/hooks/products/useProductsList.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { BaseHookOptions, BaseHookReturn, StandardFilters } from '@/hooks/common/types';

// Types spécifiques produits
interface ProductMetrics {
  readonly product_name: string;
  readonly code_ean: string;
  readonly avg_sell_price_ttc: number;
  readonly avg_buy_price_ht: number;
  readonly tva_rate: number;
  readonly avg_sell_price_ht: number;
  readonly margin_rate_percent: number;
  readonly unit_margin_ht: number;
  readonly total_margin_ht: number;
  readonly current_stock: number;
  readonly quantity_sold: number;
  readonly ca_ttc: number;
  readonly quantity_bought: number;
  readonly purchase_amount: number;
}

interface ProductsListResponse {
  readonly products: ProductMetrics[];
  readonly count: number;
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseProductsListOptions extends BaseHookOptions {
  // Options spécifiques si nécessaires
}

interface UseProductsListReturn extends BaseHookReturn<ProductsListResponse> {
  // Propriétés spécifiques produits
  readonly products: ProductMetrics[];
  readonly count: number;
}

/**
 * Hook useProductsList - VERSION STANDARDISÉE
 * 
 * Utilise le pattern useStandardFetch avec :
 * - Filtres depuis le store Zustand
 * - Pattern uniforme pour tous les hooks
 * - Gestion d'erreur standardisée
 * - Cache strategy cohérente
 */
export function useProductsList(
  options: UseProductsListOptions = {}
): UseProductsListReturn {
  // Récupération filtres depuis le store (pattern standardisé)
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Construction filtres standardisés
  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: productsFilter,
    laboratoryCodes: laboratoriesFilter,
    categoryCodes: categoriesFilter,
    ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
  };

  // Utilisation hook standardisé
  const {
    data,
    isLoading,
    error,
    isError,
    queryTime,
    cached,
    refetch,
    hasData
  } = useStandardFetch<ProductsListResponse>('/api/products/list', {
    enabled: options.enabled,
    dateRange: options.dateRange || analysisDateRange,
    comparisonDateRange: options.comparisonDateRange,
    includeComparison: options.includeComparison,
    filters: standardFilters
  });

  return {
    // Retour standardisé
    data,
    isLoading,
    error,
    isError,
    queryTime,
    cached,
    refetch,
    hasData,
    // Propriétés spécifiques facilement accessibles
    products: data?.products || [],
    count: data?.count || 0
  };
}