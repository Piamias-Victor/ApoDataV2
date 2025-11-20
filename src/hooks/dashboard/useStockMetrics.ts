// src/hooks/dashboard/useStockMetrics.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';

interface StockMetricsResponse {
  readonly quantite_stock_actuel_total: number;
  readonly montant_stock_actuel_total: number;
  readonly stock_moyen_12_mois: number;
  readonly jours_de_stock_actuels: number | null;
  readonly nb_references_produits: number;
  readonly nb_pharmacies: number;
  readonly quantite_commandee: number;
  readonly quantite_receptionnee: number;
  readonly montant_commande_ht: number;
  readonly montant_receptionne_ht: number;
  readonly comparison?: {
    readonly quantite_stock_actuel_total: number;
    readonly montant_stock_actuel_total: number;
    readonly stock_moyen_12_mois: number;
    readonly jours_de_stock_actuels: number | null;
    readonly quantite_commandee: number;
    readonly quantite_receptionnee: number;
    readonly montant_commande_ht: number;
    readonly montant_receptionne_ht: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseStockMetricsOptions {
  readonly enabled?: boolean;
  readonly includeComparison?: boolean;
  readonly dateRange?: { start: string; end: string };
  readonly comparisonDateRange?: { start: string | null; end: string | null } | undefined;
  readonly filters?: {
    products?: string[];
    laboratories?: string[];  
    categories?: string[];
    pharmacies?: string[];
  };
}

interface UseStockMetricsReturn {
  readonly data: StockMetricsResponse | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
}

/**
 * Hook useStockMetrics - VERSION SIMPLIFIÉE
 * 
 * ✅ Utilise directement products du store (contient logique ET/OU + exclusions)
 * ✅ Support des filtres en options pour override
 */
export function useStockMetrics(
  options: UseStockMetricsOptions
): UseStockMetricsReturn {
  
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // 🔥 Lecture directe de products (contient déjà logique ET/OU + exclusions)
  const products = useFiltersStore((state) => state.products);
  const excludedProducts = useFiltersStore((state) => state.excludedProducts);

  // Si filtres fournis en options, les utiliser directement
  const finalProductCodes = options.filters?.products || products;

  console.log('🎯 [useStockMetrics] Using products from store:', {
    total: finalProductCodes.length,
    excluded: excludedProducts.length,
    overridden: !!(options.filters?.products)
  });

  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: finalProductCodes,
  };

  const effectivePharmacies = options.filters?.pharmacies || pharmacyFilter;
  if (effectivePharmacies.length > 0) {
    standardFilters.pharmacyIds = effectivePharmacies;
  }

  const result = useStandardFetch<StockMetricsResponse>('/api/stock-metrics', {
    enabled: options.enabled,
    dateRange: options.dateRange || analysisDateRange,
    comparisonDateRange: options.comparisonDateRange,
    includeComparison: options.includeComparison,
    filters: standardFilters
  });

  return {
    data: result.data,
    isLoading: result.isLoading,
    error: result.error,
    isError: result.isError,
    queryTime: result.queryTime,
    cached: result.cached,
    refetch: result.refetch,
    hasData: result.hasData
  };
}