// src/hooks/generic-groups/useGenericProductsList.ts
import { useState, useEffect, useCallback } from 'react';

export interface GenericProductMetrics {
  readonly laboratory_name: string;
  readonly product_name: string;
  readonly code_ean: string;
  readonly avg_buy_price_ht: number;
  readonly quantity_bought: number;
  readonly ca_achats: number;
  readonly quantity_sold: number;
  readonly ca_ventes: number;
  readonly margin_rate_percent: number;
}

interface UseGenericProductsListOptions {
  readonly enabled: boolean;
  readonly productCodes: string[];
  readonly dateRange: { start: string; end: string };
  readonly pageSize?: number;
}

interface UseGenericProductsListReturn {
  readonly data: GenericProductMetrics[];
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
  readonly search: (query: string) => void;
  readonly sort: (column: string, direction: 'asc' | 'desc') => void;
}

export function useGenericProductsList(
  options: UseGenericProductsListOptions
): UseGenericProductsListReturn {
  const [data, setData] = useState<GenericProductMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('ca_ventes');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { enabled, productCodes, dateRange, pageSize = 50 } = options;

  const fetchData = useCallback(async (page: number) => {
    if (!enabled || productCodes.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generic-groups/products-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange,
          productCodes,
          page,
          pageSize,
          searchQuery,
          sortColumn,
          sortDirection
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result = await response.json();
      setData(result.products);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
      setCurrentPage(page);
    } catch (err) {
      console.error('Erreur chargement produits génériques:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, productCodes, dateRange, pageSize, searchQuery, sortColumn, sortDirection]);

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

  const search = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const sort = useCallback((column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
    setCurrentPage(1);
  }, []);

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
    search,
    sort
  };
}