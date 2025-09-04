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

export function useKpiMetrics(
 options: UseKpiMetricsOptions
): UseKpiMetricsReturn {
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

 return useStandardFetch<KpiMetricsResponse>('/api/kpis', {
   enabled: options.enabled,
   dateRange: options.dateRange || analysisDateRange,
   comparisonDateRange: options.comparisonDateRange,
   includeComparison: options.includeComparison,
   filters: standardFilters
 });
}