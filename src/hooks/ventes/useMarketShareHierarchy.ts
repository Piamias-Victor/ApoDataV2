// src/hooks/ventes/useMarketShareHierarchy.ts
import { useState, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';

interface HierarchySegment {
 readonly segment_name: string;
 readonly ca_selection: number;
 readonly part_marche_ca_pct: number;
 readonly marge_selection: number;
 readonly part_marche_marge_pct: number;
 readonly ca_total_segment: number;
 readonly marge_total_segment: number;
 readonly top_brand_labs: {
   readonly brand_lab: string;
   readonly ca_brand_lab: number;
   readonly marge_brand_lab: number;
 }[];
}

interface MarketShareHierarchyResponse {
 readonly segments: HierarchySegment[];
 readonly hierarchyLevel: string;
 readonly pagination: {
   readonly currentPage: number;
   readonly totalPages: number;
   readonly totalSegments: number;
 };
 readonly queryTime: number;
 readonly cached: boolean;
}

interface UseMarketShareHierarchyOptions {
 readonly enabled?: boolean | undefined;
 readonly dateRange?: { start: string; end: string } | undefined;
 readonly hierarchyLevel: 'universe' | 'category' | 'family';
 readonly page?: number | undefined;
 readonly limit?: number | undefined;
 readonly filters?: {
   products?: string[];
   laboratories?: string[];
   categories?: string[];
   pharmacies?: string[];
 } | undefined;
}

interface UseMarketShareHierarchyReturn {
 readonly data: MarketShareHierarchyResponse | null;
 readonly isLoading: boolean;
 readonly error: string | null;
 readonly isError: boolean;
 readonly queryTime: number;
 readonly cached: boolean;
 readonly refetch: () => Promise<void>;
 readonly hasData: boolean;
 readonly currentPage: number;
 readonly totalPages: number;
 readonly totalSegments: number;
 readonly canPreviousPage: boolean;
 readonly canNextPage: boolean;
 readonly previousPage: () => void;
 readonly nextPage: () => void;
 readonly setPage: (page: number) => void;
}

export function useMarketShareHierarchy(
 options: UseMarketShareHierarchyOptions
): UseMarketShareHierarchyReturn {
 const [currentPage, setCurrentPage] = useState(options.page || 1);

 const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
 const productsFilter = useFiltersStore((state) => state.products);
 const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
 const categoriesFilter = useFiltersStore((state) => state.categories);
 const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

 const standardFilters: StandardFilters & Record<string, any> = {
   productCodes: productsFilter,
   laboratoryCodes: laboratoriesFilter,
   categoryCodes: categoriesFilter,
   hierarchyLevel: options.hierarchyLevel,
   page: currentPage,
   limit: options.limit || 5,
   ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
 };

 const {
   data,
   isLoading,
   error,
   isError,
   queryTime,
   cached,
   refetch: baseRefetch,
   hasData
 } = useStandardFetch<MarketShareHierarchyResponse>('/api/ventes/market-share-hierarchy', {
   enabled: options.enabled,
   dateRange: options.dateRange || analysisDateRange,
   filters: standardFilters
 });

 const refetch = useCallback(async () => {
   await baseRefetch();
 }, [baseRefetch]);

 const setPage = useCallback((page: number) => {
   setCurrentPage(page);
 }, []);

 const previousPage = useCallback(() => {
   if (currentPage > 1) {
     setCurrentPage(currentPage - 1);
   }
 }, [currentPage]);

 const nextPage = useCallback(() => {
   const maxPage = data?.pagination.totalPages || 1;
   if (currentPage < maxPage) {
     setCurrentPage(currentPage + 1);
   }
 }, [currentPage, data?.pagination.totalPages]);

 return {
   data,
   isLoading,
   error,
   isError,
   queryTime,
   cached,
   refetch,
   hasData,
   currentPage,
   totalPages: data?.pagination.totalPages || 0,
   totalSegments: data?.pagination.totalSegments || 0,
   canPreviousPage: currentPage > 1,
   canNextPage: currentPage < (data?.pagination.totalPages || 0),
   previousPage,
   nextPage,
   setPage
 };
}