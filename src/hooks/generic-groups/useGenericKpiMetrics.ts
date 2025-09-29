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

/**
 * Hook dédié pour récupérer les KPIs d'un groupe générique
 * Utilise UNIQUEMENT les productCodes du useGenericGroupStore
 * N'utilise PAS les filtres globaux du useFiltersStore
 */
export function useGenericKpiMetrics(
  options: UseGenericKpiMetricsOptions
): UseGenericKpiMetricsReturn {
  // Récupération directe des codes produits depuis GenericGroupStore
  const productCodes = useGenericGroupStore((state) => state.productCodes);
  const selectedGroup = useGenericGroupStore((state) => state.selectedGroup);
  
  console.log('🎯 [useGenericKpiMetrics] Using generic group product codes:', {
    groupName: selectedGroup?.generic_group,
    productCodesCount: productCodes.length,
    productCodes: productCodes.slice(0, 5) // Log premiers codes pour debug
  });

  // Vérification que nous avons des codes produits
  const hasValidData = productCodes.length > 0;

  return useStandardFetch<KpiMetricsResponse>('/api/kpis', {
    enabled: options.enabled && hasValidData,
    dateRange: options.dateRange,
    comparisonDateRange: options.comparisonDateRange,
    includeComparison: options.includeComparison,
    filters: {
      productCodes: productCodes,
      // Pas de filtres laboratoires/catégories/pharmacies
      // pour avoir les KPIs complets du groupe générique
    }
  });
}