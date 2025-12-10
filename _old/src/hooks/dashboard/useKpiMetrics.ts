// src/hooks/dashboard/useKpiMetrics.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { BaseHookReturn, StandardFilters } from '@/hooks/common/types';

interface KpiMetricsResponse {
  readonly ca_ttc: number;
  readonly montant_achat_ht: number;
  readonly montant_marge: number;
  readonly pourcentage_marge: number;
  readonly valeur_stock_ht: number;
  readonly quantite_stock: number;
  readonly quantite_vendue: number;
  readonly quantite_achetee: number;
  readonly jours_de_stock: number | null;
  readonly nb_references_produits: number;
  readonly nb_pharmacies: number;
  readonly comparison?: {
    readonly ca_ttc: number;
    readonly montant_achat_ht: number;
    readonly montant_marge: number;
    readonly quantite_vendue: number;
    readonly quantite_achetee: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseKpiMetricsOptions {
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

interface UseKpiMetricsReturn extends BaseHookReturn<KpiMetricsResponse> {}

/**
 * Hook useKpiMetrics - VERSION SIMPLIFIÉE
 * 
 * ✅ Utilise directement products du store (contient logique ET/OU + exclusions)
 * ✅ Support des filtres en options pour override
 */
export function useKpiMetrics(
  options: UseKpiMetricsOptions
): UseKpiMetricsReturn {
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);
  
  // 🔥 Lecture directe de products (contient déjà logique ET/OU + exclusions)
  const products = useFiltersStore((state) => state.products);
  const excludedProducts = useFiltersStore((state) => state.excludedProducts);

  // Si filtres fournis en options, les utiliser directement
  const finalProductCodes = options.filters?.products || products;

  console.log('🎯 [useKpiMetrics] Using products from store:', {
    total: finalProductCodes.length,
    excluded: excludedProducts.length,
    overridden: !!(options.filters?.products)
  });

  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: finalProductCodes,
    ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
  };

  const result = useStandardFetch<KpiMetricsResponse>('/api/kpis', {
    enabled: options.enabled,
    dateRange: options.dateRange || analysisDateRange,
    comparisonDateRange: options.comparisonDateRange,
    includeComparison: options.includeComparison,
    filters: standardFilters
  });

  return result;
}