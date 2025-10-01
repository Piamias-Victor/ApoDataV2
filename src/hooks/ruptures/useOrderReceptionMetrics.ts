// src/hooks/ruptures/useOrderReceptionMetrics.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { BaseHookReturn, StandardFilters } from '@/hooks/common/types';

interface OrderReceptionMetricsResponse {
  readonly quantite_commandee: number;
  readonly quantite_receptionnee: number;
  readonly montant_commande_ht: number;
  readonly montant_receptionne_ht: number;
  readonly delta_quantite: number;
  readonly delta_montant: number;
  readonly taux_reception_quantite: number;
  readonly taux_reception_montant: number;
  readonly nb_commandes: number;
  readonly nb_lignes_commandes: number;
  readonly nb_fournisseurs: number;
  readonly nb_references_total: number;
  readonly nb_references_rupture: number;
  readonly taux_references_rupture: number;
  readonly delai_moyen_reception_jours: number | null;
  readonly comparison?: {
    readonly quantite_commandee: number;
    readonly quantite_receptionnee: number;
    readonly montant_commande_ht: number;
    readonly montant_receptionne_ht: number;
    readonly delta_quantite: number;
    readonly delta_montant: number;
    readonly nb_references_total: number;
    readonly nb_references_rupture: number;
    readonly taux_references_rupture: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseOrderReceptionMetricsOptions {
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

interface UseOrderReceptionMetricsReturn extends BaseHookReturn<OrderReceptionMetricsResponse> {}

export function useOrderReceptionMetrics(
  options: UseOrderReceptionMetricsOptions = {}
): UseOrderReceptionMetricsReturn {
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: productsFilter,
    laboratoryCodes: laboratoriesFilter,
    categoryCodes: categoriesFilter,
    ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
  };

  return useStandardFetch<OrderReceptionMetricsResponse>('/api/ruptures/order-reception-metrics', {
    enabled: options.enabled,
    dateRange: options.dateRange || analysisDateRange,
    comparisonDateRange: options.comparisonDateRange,
    includeComparison: options.includeComparison,
    filters: standardFilters
  });
}