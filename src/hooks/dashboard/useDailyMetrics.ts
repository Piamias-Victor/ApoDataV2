// src/hooks/dashboard/useDailyMetrics.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';

interface DailyMetricsEntry {
 date: string;
 quantite_vendue_jour: number;
 ca_ttc_jour: number;
 marge_jour: number;
 quantite_achat_jour: number;
 montant_achat_jour: number;
 stock_jour: number;
 cumul_quantite_vendue: number;
 cumul_quantite_achetee: number;
 cumul_ca_ttc: number;
 cumul_montant_achat: number;
 cumul_marge: number;
}

interface DailyMetricsResponse {
 data: DailyMetricsEntry[];
 queryTime: number;
 cached: boolean;
}

interface UseDailyMetricsOptions {
 enabled?: boolean | undefined;
 dateRange?: { start: string; end: string } | undefined;
 productCodes?: string[] | undefined;
 pharmacyId?: string | undefined;
}

interface UseDailyMetricsReturn {
 readonly data: DailyMetricsEntry[] | null;
 readonly isLoading: boolean;
 readonly error: string | null;
 readonly isError: boolean;
 readonly queryTime: number;
 readonly cached: boolean;
 readonly refetch: () => Promise<void>;
 readonly hasData: boolean;
}

export function useDailyMetrics(
 options: UseDailyMetricsOptions = {}
): UseDailyMetricsReturn {
 const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
 const productsFilter = useFiltersStore((state) => state.products);
 const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

 const standardFilters: StandardFilters & Record<string, any> = {
   productCodes: options.productCodes || productsFilter,
   ...(options.pharmacyId && { pharmacyId: options.pharmacyId }),
   ...(!options.pharmacyId && pharmacyFilter.length > 0 && { pharmacyId: pharmacyFilter[0] })
 };

 const {
   data: response,
   isLoading,
   error,
   isError,
   queryTime,
   cached,
   refetch,
   hasData
 } = useStandardFetch<DailyMetricsResponse>('/api/daily-metrics', {
   enabled: options.enabled,
   dateRange: options.dateRange || analysisDateRange,
   filters: standardFilters
 });

 return {
   data: response?.data || null,
   isLoading,
   error,
   isError,
   queryTime,
   cached,
   refetch,
   hasData
 };
}