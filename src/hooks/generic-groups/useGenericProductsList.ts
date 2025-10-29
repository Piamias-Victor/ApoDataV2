// src/hooks/generic-groups/useGenericProductsList.ts
import { useState, useEffect, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useGenericGroupStore } from '@/stores/useGenericGroupStore'; // 🔥 NOUVEAU

export interface GenericProductMetrics {
  readonly laboratory_name: string;
  readonly product_name: string;
  readonly code_ean: string;
  readonly prix_brut_grossiste: number | null;
  readonly avg_buy_price_ht: number;
  readonly remise_percent: number;
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
  readonly showGlobalTop?: boolean;
  readonly autoFetch?: boolean;
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
  readonly isGlobalMode: boolean;
  readonly manualFetch: () => void;
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
  const [sortColumn, setSortColumn] = useState('quantity_sold');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isGlobalMode, setIsGlobalMode] = useState(false);
  const [hasLoadedGlobal, setHasLoadedGlobal] = useState(false);
  const [priceFiltersSnapshot, setPriceFiltersSnapshot] = useState<string>(''); // 🔥 NOUVEAU

  // Récupération du filtre pharmacy depuis le store
  const pharmacyIds = useFiltersStore(state => state.pharmacy);
  
  // 🔥 NOUVEAU - Récupération des priceFilters
  const priceFilters = useGenericGroupStore(state => state.priceFilters);

  const { 
    enabled, 
    productCodes, 
    dateRange, 
    pageSize = 50,
    showGlobalTop = false,
    autoFetch = true
  } = options;

  const fetchData = useCallback(async (
    page: number, 
    forceGlobal = false,
    customSort?: { column: string; direction: 'asc' | 'desc' },
    customSearch?: string
  ) => {
    const shouldUseGlobalMode = forceGlobal || hasLoadedGlobal || (showGlobalTop && productCodes.length === 0);
    
    if (!enabled || (!shouldUseGlobalMode && productCodes.length === 0)) {
      setData([]);
      setIsGlobalMode(false);
      setHasLoadedGlobal(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsGlobalMode(shouldUseGlobalMode);

    try {
      const response = await fetch('/api/generic-groups/products-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange,
          productCodes: shouldUseGlobalMode ? [] : productCodes,
          pharmacyIds,
          page,
          pageSize,
          searchQuery: customSearch !== undefined ? customSearch : searchQuery,
          sortColumn: customSort?.column || sortColumn,
          sortDirection: customSort?.direction || sortDirection,
          showGlobalTop: shouldUseGlobalMode
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
      
      if (shouldUseGlobalMode) {
        setHasLoadedGlobal(true);
      }
    } catch (err) {
      console.error('Erreur chargement produits génériques:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, productCodes, dateRange, pageSize, searchQuery, sortColumn, sortDirection, showGlobalTop, pharmacyIds, hasLoadedGlobal]);

  // 🔥 NOUVEAU - Surveiller les changements de priceFilters
  useEffect(() => {
    const newSnapshot = JSON.stringify(priceFilters);
    if (newSnapshot !== priceFiltersSnapshot) {
      console.log('💰 [useGenericProductsList] Price filters changed, refetching...');
      setPriceFiltersSnapshot(newSnapshot);
      if (enabled && autoFetch) {
        fetchData(1);
      }
    }
  }, [priceFilters, priceFiltersSnapshot, enabled, autoFetch, fetchData]);

  // useEffect principal - 🔥 MODIFIÉ
  useEffect(() => {
    if (autoFetch) {
      fetchData(1);
    }
  }, [autoFetch, productCodes, dateRange.start, dateRange.end, pharmacyIds, showGlobalTop]); // 🔥 dateRange décomposé

  // Reset hasLoadedGlobal quand productCodes change
  useEffect(() => {
    if (productCodes.length > 0) {
      setHasLoadedGlobal(false);
    }
  }, [productCodes.length]);

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

  const manualFetch = useCallback(() => {
    fetchData(1, true);
  }, [fetchData]);

  const search = useCallback((query: string) => {
    setSearchQuery(query);
    fetchData(1, false, undefined, query);
  }, [fetchData]);

  const sort = useCallback((column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
    fetchData(1, false, { column, direction });
  }, [fetchData]);
  

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
    sort,
    isGlobalMode,
    manualFetch
  };
}