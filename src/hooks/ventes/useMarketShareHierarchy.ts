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

type BCBHierarchyLevel = 
  | 'bcb_segment_l0' 
  | 'bcb_segment_l1' 
  | 'bcb_segment_l2' 
  | 'bcb_segment_l3' 
  | 'bcb_segment_l4' 
  | 'bcb_segment_l5' 
  | 'bcb_family';

interface UseMarketShareHierarchyOptions {
  readonly enabled?: boolean | undefined;
  readonly dateRange?: { start: string; end: string } | undefined;
  readonly hierarchyLevel: BCBHierarchyLevel;
  readonly page?: number | undefined;
  readonly limit?: number | undefined;
  readonly filters?: {
    products?: string[];
    bcbSegments?: string[];
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

  // Fusion de tous les codes produits (products + laboratories + categories)
  const allProductCodes = Array.from(new Set([
    ...productsFilter,
    ...laboratoriesFilter,
    ...categoriesFilter
  ]));

  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: allProductCodes,
    bcbSegmentCodes: [], // On ne passe plus les catégories séparément car elles sont dans productCodes
    hierarchyLevel: options.hierarchyLevel,
    page: currentPage,
    limit: options.limit || 5,
    ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter }),
    ...(options.filters?.products && { 
      productCodes: [...allProductCodes, ...options.filters.products] 
    }),
    ...(options.filters?.bcbSegments && { 
      bcbSegmentCodes: options.filters.bcbSegments 
    }),
    ...(options.filters?.pharmacies && { 
      pharmacyIds: [...pharmacyFilter, ...options.filters.pharmacies] 
    })
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