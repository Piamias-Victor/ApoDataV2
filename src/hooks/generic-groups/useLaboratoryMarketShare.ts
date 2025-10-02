// src/hooks/generic-groups/useLaboratoryMarketShare.ts
import { useState, useEffect, useCallback } from 'react';

export interface LaboratoryMarketShare {
  readonly laboratory_name: string;
  readonly ca_selection: number;
  readonly ca_total_group: number;
  readonly part_marche_ca_pct: number;
  readonly marge_selection: number;
  readonly marge_total_group: number;
  readonly part_marche_marge_pct: number;
  readonly product_count: number;
  readonly is_referent: boolean;
}

interface UseLaboratoryMarketShareOptions {
  readonly enabled: boolean;
  readonly productCodes: string[];
  readonly dateRange: { start: string; end: string };
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
  readonly isGlobalMode: boolean;
}

export function useLaboratoryMarketShare(
  options: UseLaboratoryMarketShareOptions
): UseLaboratoryMarketShareReturn {
  const [data, setData] = useState<LaboratoryMarketShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isGlobalMode, setIsGlobalMode] = useState(false);

  const { enabled, productCodes, dateRange, pageSize = 10 } = options;

  const fetchData = useCallback(async (page: number) => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generic-groups/laboratory-market-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange,
          productCodes,
          page,
          pageSize
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result = await response.json();
      setData(result.laboratories);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
      setCurrentPage(page);
      setIsGlobalMode(result.isGlobalMode || false);
    } catch (err) {
      console.error('Erreur chargement parts de marché:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, productCodes, dateRange, pageSize]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

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
    refetch,
    isGlobalMode
  };
}