// src/hooks/generic-groups/useGenericKpiMetrics.ts
import { useGenericGroupStore } from '@/stores/useGenericGroupStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { BaseHookReturn } from '@/hooks/common/types';

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

interface UseGenericKpiMetricsOptions {
  readonly enabled?: boolean;
  readonly includeComparison?: boolean;
  readonly dateRange: { start: string; end: string };
  readonly comparisonDateRange?: { start: string | null; end: string | null } | undefined;
}

interface UseGenericKpiMetricsReturn extends BaseHookReturn<KpiMetricsResponse> {}

export function useGenericKpiMetrics(
  options: UseGenericKpiMetricsOptions
): UseGenericKpiMetricsReturn {
  const productCodes = useGenericGroupStore((state) => state.productCodes);
  const selectedGroups = useGenericGroupStore((state) => state.selectedGroups);
  
  console.log('🎯 [useGenericKpiMetrics] Using generic group product codes:', {
    groupsCount: selectedGroups.length,
    groupNames: selectedGroups.map(g => g.generic_group),
    productCodesCount: productCodes.length,
    productCodes: productCodes.slice(0, 5)
  });

  const hasValidData = productCodes.length > 0;

  return useStandardFetch<KpiMetricsResponse>('/api/kpis', {
    enabled: options.enabled && hasValidData,
    dateRange: options.dateRange,
    comparisonDateRange: options.comparisonDateRange,
    includeComparison: options.includeComparison,
    filters: {
      productCodes: productCodes
    }
  });
}