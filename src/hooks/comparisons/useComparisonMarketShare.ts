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
  readonly top_brand_labs: Array<{
    brand_lab: string;
    ca_brand_lab: number;
  }>;
}

interface MarketShareResponse {
  readonly segments: MarketShareSegment[];
  readonly pagination: {
    totalSegments: number;
    totalPages: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseComparisonMarketShareOptions {
  readonly enabled?: boolean;
  readonly elementA: ComparisonElement | null;
  readonly elementB: ComparisonElement | null;
  readonly elementC?: ComparisonElement | null;
  readonly hierarchyLevel: 'universe' | 'category' | 'family';
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

  // Fonction pour mapper ComparisonElement vers productCodes
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

  // Filtres pour l'élément A
  const filtersA = useMemo(() => {
    const productCodes = mapElementToProductCodes(elementA);
    const standardFilters: StandardFilters & Record<string, any> = {
      productCodes,
      laboratoryCodes: [],
      categoryCodes: [],
      hierarchyLevel,
      page: currentPage,
      limit
    };
    
    if (pharmacyFilter.length > 0) {
      standardFilters.pharmacyIds = pharmacyFilter;
    }
    
    return standardFilters;
  }, [elementA, hierarchyLevel, currentPage, limit, pharmacyFilter, mapElementToProductCodes]);

  // Filtres pour l'élément B
  const filtersB = useMemo(() => {
    const productCodes = mapElementToProductCodes(elementB);
    const standardFilters: StandardFilters & Record<string, any> = {
      productCodes,
      laboratoryCodes: [],
      categoryCodes: [],
      hierarchyLevel,
      page: currentPage,
      limit
    };
    
    if (pharmacyFilter.length > 0) {
      standardFilters.pharmacyIds = pharmacyFilter;
    }
    
    return standardFilters;
  }, [elementB, hierarchyLevel, currentPage, limit, pharmacyFilter, mapElementToProductCodes]);

  // Filtres pour l'élément C
  const filtersC = useMemo(() => {
    const productCodes = mapElementToProductCodes(elementC);
    const standardFilters: StandardFilters & Record<string, any> = {
      productCodes,
      laboratoryCodes: [],
      categoryCodes: [],
      hierarchyLevel,
      page: currentPage,
      limit
    };
    
    if (pharmacyFilter.length > 0) {
      standardFilters.pharmacyIds = pharmacyFilter;
    }
    
    return standardFilters;
  }, [elementC, hierarchyLevel, currentPage, limit, pharmacyFilter, mapElementToProductCodes]);

  // Hook pour l'élément A
  const resultA = useStandardFetch<MarketShareResponse>('/api/ventes/market-share-hierarchy', {
    enabled: enabled && !!elementA && mapElementToProductCodes(elementA).length > 0,
    dateRange: analysisDateRange,
    filters: filtersA
  });

  // Hook pour l'élément B
  const resultB = useStandardFetch<MarketShareResponse>('/api/ventes/market-share-hierarchy', {
    enabled: enabled && !!elementB && mapElementToProductCodes(elementB).length > 0,
    dateRange: analysisDateRange,
    filters: filtersB
  });

  // Hook pour l'élément C
  const resultC = useStandardFetch<MarketShareResponse>('/api/ventes/market-share-hierarchy', {
    enabled: enabled && !!elementC && mapElementToProductCodes(elementC).length > 0,
    dateRange: analysisDateRange,
    filters: filtersC
  });

  // États combinés
  const isLoading = resultA.isLoading || resultB.isLoading || resultC.isLoading;
  const error = resultA.error || resultB.error || resultC.error;
  const isError = resultA.isError || resultB.isError || resultC.isError;

  // Pagination
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

  // Fonction refetch combinée
  const refetch = useCallback(async (): Promise<void> => {
    console.log('🔄 [Hook] Manual refetch triggered for market share comparison');
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
  }, [elementA, elementB, elementC, resultA.refetch, resultB.refetch, resultC.refetch, mapElementToProductCodes]);

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