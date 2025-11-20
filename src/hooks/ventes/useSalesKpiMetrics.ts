// src/hooks/ventes/useSalesKpiMetrics.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';

interface SalesKpiMetricsResponse {
  readonly quantite_vendue: number;
  readonly ca_ttc: number;
  readonly part_marche_ca_pct: number;
  readonly part_marche_marge_pct: number;
  readonly nb_references_selection: number;
  readonly nb_references_80pct_ca: number;
  readonly montant_marge: number;
  readonly taux_marge_pct: number;
  readonly comparison?: {
    readonly quantite_vendue: number;
    readonly ca_ttc: number;
    readonly part_marche_ca_pct: number;
    readonly part_marche_marge_pct: number;
    readonly nb_references_selection: number;
    readonly nb_references_80pct_ca: number;
    readonly montant_marge: number;
    readonly taux_marge_pct: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseSalesKpiMetricsOptions {
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

interface UseSalesKpiMetricsReturn {
  readonly data: SalesKpiMetricsResponse | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
}

/**
 * Hook useSalesKpiMetrics - VERSION SIMPLIFIÉE
 * 
 * ✅ Utilise directement products du store (contient logique ET/OU + exclusions)
 */
export function useSalesKpiMetrics(
  options: UseSalesKpiMetricsOptions = {}
): UseSalesKpiMetricsReturn {
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // 🔥 Lecture directe de products (contient déjà logique ET/OU + exclusions)
  const products = useFiltersStore((state) => state.products);
  const excludedProducts = useFiltersStore((state) => state.excludedProducts);

  console.log('🎯 [useSalesKpiMetrics] Using products from store:', {
    total: products.length,
    excluded: excludedProducts.length
  });

  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: products, // 🔥 Directement products du store
    ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
  };

  const result = useStandardFetch<SalesKpiMetricsResponse>('/api/ventes/kpis', {
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