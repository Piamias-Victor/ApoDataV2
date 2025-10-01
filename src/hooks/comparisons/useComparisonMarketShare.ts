// src/hooks/comparisons/useComparisonMarketShare.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';
import type { ComparisonElement } from '@/types/comparison';
import { useState, useCallback, useMemo } from 'react';

interface MarketShareSegment {
  readonly segment_name: string;
  readonly part_marche_ca_pct: number;
  readonly part_marche_marge_pct: number;
  readonly ca_selection: number;
  readonly ca_total_segment: number;
  readonly marge_selection: number;
  readonly marge_total_segment: number;
  readonly top_brand_labs: Array<{
    brand_lab: string;
    ca_brand_lab: number;
    marge_brand_lab: number;
  }>;
}

interface MarketShareResponse {
  readonly segments: MarketShareSegment[];
  readonly hierarchyLevel: string;
  readonly pagination: {
    totalSegments: number;
    totalPages: number;
    currentPage: number;
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

interface UseComparisonMarketShareOptions {
  readonly enabled?: boolean;
  readonly elementA: ComparisonElement | null;
  readonly elementB: ComparisonElement | null;
  readonly elementC?: ComparisonElement | null;
  readonly hierarchyLevel: BCBHierarchyLevel;
  readonly page?: number;
  readonly limit?: number;
}

interface UseComparisonMarketShareReturn {
  readonly dataA: MarketShareResponse | null;
  readonly dataB: MarketShareResponse | null;
  readonly dataC: MarketShareResponse | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly refetch: () => Promise<void>;
  readonly hasDataA: boolean;
  readonly hasDataB: boolean;
  readonly hasDataC: boolean;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly canPreviousPage: boolean;
  readonly canNextPage: boolean;
  readonly previousPage: () => void;
  readonly nextPage: () => void;
}

export function useComparisonMarketShare(
  options: UseComparisonMarketShareOptions
): UseComparisonMarketShareReturn {
  const {
    enabled = true,
    elementA,
    elementB,
    elementC = null,
    hierarchyLevel,
    page = 1,
    limit = 5
  } = options;

  const [currentPage, setCurrentPage] = useState(page);
  const analysisDateRange = useFiltersStore(state => state.analysisDateRange);
  const pharmacyFilter = useFiltersStore(state => state.pharmacy);

  const mapElementToProductCodes = useCallback((element: ComparisonElement | null): string[] => {
    if (!element) return [];
    switch (element.type) {
      case 'product':
        return [element.id];
      case 'laboratory':
      case 'category':
        return element.metadata.product_codes || [];
      default:
        return [];
    }
  }, []);

  const createFilters = useCallback((element: ComparisonElement | null) => {
    const productCodes = mapElementToProductCodes(element);
    const standardFilters: StandardFilters & Record<string, any> = {
      productCodes,
      hierarchyLevel,
      page: currentPage,
      limit
    };
    
    if (pharmacyFilter.length > 0) {
      standardFilters.pharmacyIds = pharmacyFilter;
    }
    
    return standardFilters;
  }, [mapElementToProductCodes, hierarchyLevel, currentPage, limit, pharmacyFilter]);

  const filtersA = useMemo(() => createFilters(elementA), [elementA, createFilters]);
  const filtersB = useMemo(() => createFilters(elementB), [elementB, createFilters]);
  const filtersC = useMemo(() => createFilters(elementC), [elementC, createFilters]);

  const resultA = useStandardFetch<MarketShareResponse>('/api/ventes/market-share-hierarchy', {
    enabled: enabled && !!elementA && mapElementToProductCodes(elementA).length > 0,
    dateRange: analysisDateRange,
    filters: filtersA
  });

  const resultB = useStandardFetch<MarketShareResponse>('/api/ventes/market-share-hierarchy', {
    enabled: enabled && !!elementB && mapElementToProductCodes(elementB).length > 0,
    dateRange: analysisDateRange,
    filters: filtersB
  });

  const resultC = useStandardFetch<MarketShareResponse>('/api/ventes/market-share-hierarchy', {
    enabled: enabled && !!elementC && mapElementToProductCodes(elementC).length > 0,
    dateRange: analysisDateRange,
    filters: filtersC
  });

  const isLoading = resultA.isLoading || resultB.isLoading || resultC.isLoading;
  const error = resultA.error || resultB.error || resultC.error;
  const isError = resultA.isError || resultB.isError || resultC.isError;

  const totalPages = Math.max(
    resultA.data?.pagination.totalPages || 0,
    resultB.data?.pagination.totalPages || 0,
    resultC.data?.pagination.totalPages || 0
  );

  const canPreviousPage = currentPage > 1;
  const canNextPage = currentPage < totalPages;

  const previousPage = useCallback(() => {
    if (canPreviousPage) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage, canPreviousPage]);

  const nextPage = useCallback(() => {
    if (canNextPage) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, canNextPage]);

  const refetch = useCallback(async (): Promise<void> => {
    const promises = [];
    
    if (elementA && mapElementToProductCodes(elementA).length > 0) {
      promises.push(resultA.refetch());
    }
    if (elementB && mapElementToProductCodes(elementB).length > 0) {
      promises.push(resultB.refetch());
    }
    if (elementC && mapElementToProductCodes(elementC).length > 0) {
      promises.push(resultC.refetch());
    }
    
    await Promise.all(promises);
  }, [elementA, elementB, elementC, resultA, resultB, resultC, mapElementToProductCodes]);

  return {
    dataA: resultA.data,
    dataB: resultB.data,
    dataC: resultC.data,
    isLoading,
    error,
    isError,
    refetch,
    hasDataA: resultA.hasData,
    hasDataB: resultB.hasData,
    hasDataC: resultC.hasData,
    currentPage,
    totalPages,
    canPreviousPage,
    canNextPage,
    previousPage,
    nextPage
  };
}