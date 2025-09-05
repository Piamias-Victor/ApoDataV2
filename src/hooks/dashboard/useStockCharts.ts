// src/hooks/dashboard/useStockCharts.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';

interface UseStockChartsOptions {
 enabled?: boolean;
 dateRange?: { start: string; end: string };
 productCodes?: string[];
 pharmacyId?: string | undefined;
}

interface StockChartsEntry {
 periode: string;
 quantite_stock: number;
 jours_stock: number | null;
 quantite_vendue: number;
}

interface StockChartsResponse {
 data: StockChartsEntry[];
 queryTime: number;
 cached: boolean;
}

interface UseStockChartsReturn {
 data: StockChartsEntry[] | null;
 isLoading: boolean;
 error: string | null;
 isError: boolean;
 refetch: () => Promise<void>;
 hasData: boolean;
 queryTime: number;
 cached: boolean;
}

/**
* Hook useStockCharts - VERSION STANDARDISÉE
*/
export function useStockCharts(options: UseStockChartsOptions): UseStockChartsReturn {
 const {
   enabled = true,
   dateRange,
   productCodes = [],
   pharmacyId
 } = options;

 const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
 const productsFilter = useFiltersStore((state) => state.products);
 const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

 // Construction des filtres
 const standardFilters: StandardFilters & Record<string, any> = {
   productCodes: productCodes.length > 0 ? productCodes : productsFilter,
 };

 // Ajout conditionnel du pharmacyId
 const effectivePharmacyId = pharmacyId || (pharmacyFilter.length > 0 ? pharmacyFilter[0] : undefined);
 if (effectivePharmacyId) {
   standardFilters.pharmacyId = effectivePharmacyId;
 }

 const result = useStandardFetch<StockChartsResponse>('/api/stock-charts', {
   enabled,
   dateRange: dateRange || analysisDateRange,
   filters: standardFilters
 });

 return {
   data: result.data?.data || null,
   isLoading: result.isLoading,
   error: result.error,
   isError: result.isError,
   refetch: result.refetch,
   hasData: !!(result.data?.data && result.data.data.length > 0),
   queryTime: result.data?.queryTime || 0,
   cached: result.data?.cached || false
 };
}