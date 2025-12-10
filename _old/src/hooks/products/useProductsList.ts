// src/hooks/products/useProductsList.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { BaseHookOptions, BaseHookReturn, StandardFilters } from '@/hooks/common/types';

// Types spécifiques produits
export interface ProductMetrics {
  readonly product_name: string;
  readonly code_ean: string;
  readonly bcb_lab: string | null;
  readonly avg_sell_price_ttc: number;
  readonly avg_buy_price_ht: number;
  readonly margin_rate_percent: number;
  readonly unit_margin_ht: number;
  readonly total_margin_ht: number;
  readonly current_stock: number;
  readonly quantity_sold: number;
  readonly ca_ttc: number;
  readonly quantity_bought: number;
  readonly purchase_amount: number;
  readonly quantity_sold_comparison: number | null;
  readonly ca_ttc_comparison: number | null;
  readonly quantity_bought_comparison: number | null;
  readonly purchase_amount_comparison: number | null;
}

// Type de la réponse API (avec strings)
interface ProductMetricsRaw {
  readonly product_name: string;
  readonly code_ean: string;
  readonly bcb_lab: string | null;
  readonly avg_sell_price_ttc: string | number;
  readonly avg_buy_price_ht: string | number;
  readonly margin_rate_percent: string | number;
  readonly unit_margin_ht: string | number;
  readonly total_margin_ht: string | number;
  readonly current_stock: string | number;
  readonly quantity_sold: string | number;
  readonly ca_ttc: string | number;
  readonly quantity_bought: string | number;
  readonly purchase_amount: string | number;
  readonly quantity_sold_comparison: string | number | null;
  readonly ca_ttc_comparison: string | number | null;
  readonly quantity_bought_comparison: string | number | null;
  readonly purchase_amount_comparison: string | number | null;
}

interface ProductsListResponseRaw {
  readonly products: ProductMetricsRaw[];
  readonly count: number;
  readonly queryTime: number;
  readonly cached: boolean;
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
 * Convertit un produit brut (avec strings) en produit typé (avec numbers)
 */
function convertProductMetrics(raw: ProductMetricsRaw): ProductMetrics {
  return {
    product_name: raw.product_name,
    code_ean: raw.code_ean,
    bcb_lab: raw.bcb_lab,
    avg_sell_price_ttc: Number(raw.avg_sell_price_ttc) || 0,
    avg_buy_price_ht: Number(raw.avg_buy_price_ht) || 0,
    margin_rate_percent: Number(raw.margin_rate_percent) || 0,
    unit_margin_ht: Number(raw.unit_margin_ht) || 0,
    total_margin_ht: Number(raw.total_margin_ht) || 0,
    current_stock: Number(raw.current_stock) || 0,
    quantity_sold: Number(raw.quantity_sold) || 0,
    ca_ttc: Number(raw.ca_ttc) || 0,
    quantity_bought: Number(raw.quantity_bought) || 0,
    purchase_amount: Number(raw.purchase_amount) || 0,
    quantity_sold_comparison: raw.quantity_sold_comparison !== null
      ? Number(raw.quantity_sold_comparison) || 0
      : null,
    ca_ttc_comparison: raw.ca_ttc_comparison !== null
      ? Number(raw.ca_ttc_comparison) || 0
      : null,
    quantity_bought_comparison: raw.quantity_bought_comparison !== null
      ? Number(raw.quantity_bought_comparison) || 0
      : null,
    purchase_amount_comparison: raw.purchase_amount_comparison !== null
      ? Number(raw.purchase_amount_comparison) || 0
      : null
  };
}

/**
 * Hook useProductsList - VERSION SIMPLIFIÉE
 * 
 * ✅ Utilise directement products du store (contient codes finaux avec logique ET/OU)
 * ✅ Réactivité automatique via useStandardFetch (pas de useEffect manuel)
 */
export function useProductsList(
  options: UseProductsListOptions = {}
): UseProductsListReturn {
  // Récupération filtres depuis le store
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // 🔥 Récupérer directement products (contient déjà les codes finaux)
  const products = useFiltersStore((state) => state.products);

  console.log('🎯 [useProductsList] Using final product codes from store:', {
    total: products.length
  });

  // Construction filtres standardisés
  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: products, // 🔥 Directement products du store
    ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
  };

  // Utilisation hook standardisé (reçoit des strings)
  const {
    data: rawData,
    isLoading,
    error,
    isError,
    queryTime,
    cached,
    refetch,
    hasData
  } = useStandardFetch<ProductsListResponseRaw>('/api/products/list', {
    enabled: options.enabled,
    dateRange: options.dateRange || analysisDateRange,
    comparisonDateRange: options.comparisonDateRange || comparisonDateRange,
    includeComparison: true,
    filters: standardFilters,
    forceRefresh: false
  });

  // Conversion des données (strings → numbers)
  const convertedData: ProductsListResponse | null = rawData ? {
    products: rawData.products.map(convertProductMetrics),
    count: rawData.count,
    queryTime: rawData.queryTime,
    cached: rawData.cached
  } : null;

  return {
    // Retour standardisé avec données converties
    data: convertedData,
    isLoading,
    error,
    isError,
    queryTime,
    cached,
    refetch,
    hasData,
    // Propriétés spécifiques facilement accessibles
    products: convertedData?.products || [],
    count: convertedData?.count || 0
  };
}