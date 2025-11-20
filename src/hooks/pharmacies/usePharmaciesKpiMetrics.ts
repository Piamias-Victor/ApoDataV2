// src/hooks/pharmacies/usePharmaciesKpiMetrics.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { BaseHookReturn, StandardFilters } from '@/hooks/common/types';

interface PharmaciesKpiMetricsResponse {
  readonly nb_pharmacies_vendeuses: number;
  readonly pct_pharmacies_vendeuses_selection: number;
  readonly nb_pharmacies_80pct_ca: number;
  readonly pct_pharmacies_80pct_ca: number;
  readonly ca_moyen_pharmacie: number;
  readonly ca_median_pharmacie: number;
  readonly quantite_moyenne_pharmacie: number;
  readonly quantite_mediane_pharmacie: number;
  readonly taux_penetration_produit_pct: number;
  readonly pharmacies_avec_produit: number;
  readonly total_pharmacies_reseau: number;
  readonly ca_total: number;
  readonly quantite_totale: number;
  readonly nb_pharmacies_vendeuses_total: number;
  readonly comparison?: {
    readonly nb_pharmacies_vendeuses: number;
    readonly pct_pharmacies_vendeuses_selection: number;
    readonly nb_pharmacies_80pct_ca: number;
    readonly pct_pharmacies_80pct_ca: number;
    readonly ca_moyen_pharmacie: number;
    readonly ca_median_pharmacie: number;
    readonly quantite_moyenne_pharmacie: number;
    readonly quantite_mediane_pharmacie: number;
    readonly taux_penetration_produit_pct: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UsePharmaciesKpiMetricsOptions {
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

interface UsePharmaciesKpiMetricsReturn extends BaseHookReturn<PharmaciesKpiMetricsResponse> {}

/**
 * Hook usePharmaciesKpiMetrics - VERSION SIMPLIFIÉE
 * 
 * ✅ Utilise directement products du store (contient logique ET/OU + exclusions)
 */
export function usePharmaciesKpiMetrics(
  options: UsePharmaciesKpiMetricsOptions
): UsePharmaciesKpiMetricsReturn {
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // 🔥 Lecture directe de products (contient déjà logique ET/OU + exclusions)
  const products = useFiltersStore((state) => state.products);
  const excludedProducts = useFiltersStore((state) => state.excludedProducts);

  console.log('🎯 [usePharmaciesKpiMetrics] Using products from store:', {
    total: products.length,
    excluded: excludedProducts.length
  });

  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: products,
    ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
  };

  const result = useStandardFetch<PharmaciesKpiMetricsResponse>('/api/pharmacies/kpis', {
    enabled: options.enabled,
    dateRange: options.dateRange || analysisDateRange,
    comparisonDateRange: options.comparisonDateRange,
    includeComparison: options.includeComparison,
    filters: standardFilters
  });

  return result;
}