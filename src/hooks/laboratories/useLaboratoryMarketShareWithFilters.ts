// src/hooks/laboratory/useLaboratoryMarketShareWithFilters.ts
import { useState, useEffect, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import type { LaboratoryMarketShare } from '@/types/laboratory';

interface UseLaboratoryMarketShareOptions {
  readonly enabled?: boolean;
  readonly pageSize?: number;
}

interface UseLaboratoryMarketShareReturn {
  readonly data: LaboratoryMarketShare[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly total: number;
  readonly canPreviousPage: boolean;
  readonly canNextPage: boolean;
  readonly previousPage: () => void;
  readonly nextPage: () => void;
  readonly refetch: () => Promise<void>;
}

export function useLaboratoryMarketShareWithFilters(
  options: UseLaboratoryMarketShareOptions = {}
): UseLaboratoryMarketShareReturn {
  const [data, setData] = useState<LaboratoryMarketShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const { enabled = true, pageSize = 10 } = options;

  const {
    products,
    laboratories,
    categories,
    pharmacy,
    analysisDateRange
  } = useFiltersStore();

  const fetchData = useCallback(async (page: number) => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/laboratory/market-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            productCodes: products,
            laboratoryCodes: laboratories,
            categoryCodes: categories,
            pharmacyIds: pharmacy,
            dateRange: analysisDateRange
          },
          pagination: {
            page,
            pageSize
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result = await response.json();
      setData(result.laboratories || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotal(result.pagination?.total || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Erreur chargement parts de marché:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, products, laboratories, categories, pharmacy, analysisDateRange, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
  }, [products, laboratories, categories, pharmacy, analysisDateRange]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      fetchData(currentPage - 1);
    }
  }, [currentPage, fetchData]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      fetchData(currentPage + 1);
    }
  }, [currentPage, totalPages, fetchData]);

  const refetch = useCallback(async () => {
    await fetchData(currentPage);
  }, [currentPage, fetchData]);

  return {
    data,
    isLoading,
    error,
    currentPage,
    totalPages,
    total,
    canPreviousPage: currentPage > 1,
    canNextPage: currentPage < totalPages,
    previousPage,
    nextPage,
    refetch
  };
}