// src/hooks/generic-groups/useGenericProductsList.ts
import { useState, useEffect, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useGenericGroupStore } from '@/stores/useGenericGroupStore'; // 🔥 AJOUTER

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
  const [productCodesSnapshot, setProductCodesSnapshot] = useState<string>('');

  const pharmacyIds = useFiltersStore(state => state.pharmacy);
  
  // 🔥 NOUVEAU - Récupérer les états de filtres du store
  const hasActiveSelections = useGenericGroupStore(state => 
    state.selectedGroups.length > 0 || 
    state.selectedProducts.length > 0 || 
    state.selectedLaboratories.length > 0
  );
  const hasPriceFilters = useGenericGroupStore(state => state.hasPriceFilters());
  const hasTvaFilters = useGenericGroupStore(state => state.tvaRates.length > 0);
  const hasGenericStatusFilter = useGenericGroupStore(state => state.genericStatus !== 'BOTH');
  
  // 🔥 CALCULER si des filtres sont actifs
  const hasAnyActiveFilters = hasActiveSelections || hasPriceFilters || hasTvaFilters || hasGenericStatusFilter;

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
    // 🔥 MODIFIÉ - Ne pas passer en mode global si des filtres sont actifs
    const shouldUseGlobalMode = forceGlobal || hasLoadedGlobal || (showGlobalTop && productCodes.length === 0 && !hasAnyActiveFilters);
    
    // 🔥 MODIFIÉ - Si filtres actifs mais 0 résultats, afficher tableau vide au lieu de mode global
    if (!enabled) {
      return;
    }
    
    if (!shouldUseGlobalMode && productCodes.length === 0) {
      if (hasAnyActiveFilters) {
        // Filtres actifs mais 0 résultat → afficher tableau vide
        console.log('⚠️ [useGenericProductsList] Filters active but 0 results');
        setData([]);
        setTotal(0);
        setTotalPages(0);
        setIsGlobalMode(false);
        setHasLoadedGlobal(false);
        return;
      } else {
        // Aucun filtre → ne rien afficher (attendre action utilisateur)
        setData([]);
        setIsGlobalMode(false);
        setHasLoadedGlobal(false);
        return;
      }
    }

    console.log('🔄 [useGenericProductsList] Fetching with productCodes:', {
      count: productCodes.length,
      shouldUseGlobalMode,
      hasAnyActiveFilters,
      sample: productCodes.slice(0, 3)
    });

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
      
      console.log('✅ [useGenericProductsList] Fetched products:', {
        productsCount: result.products.length,
        total: result.pagination.total,
        page: result.pagination.currentPage
      });

      setData(result.products);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
      setCurrentPage(page);
      
      if (shouldUseGlobalMode) {
        setHasLoadedGlobal(true);
      }
    } catch (err) {
      console.error('❌ [useGenericProductsList] Error:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, productCodes, dateRange, pageSize, searchQuery, sortColumn, sortDirection, showGlobalTop, pharmacyIds, hasLoadedGlobal, hasAnyActiveFilters]);

  // Surveiller changements productCodes avec snapshot
  useEffect(() => {
    const newSnapshot = JSON.stringify(productCodes);
    if (newSnapshot !== productCodesSnapshot) {
      console.log('🔄 [useGenericProductsList] ProductCodes changed:', {
        count: productCodes.length,
        hasAnyActiveFilters
      });
      setProductCodesSnapshot(newSnapshot);
      if (enabled && autoFetch) {
        fetchData(1);
      }
    }
  }, [productCodes, productCodesSnapshot, enabled, autoFetch, hasAnyActiveFilters, fetchData]);

  // useEffect principal - Premier chargement uniquement
  useEffect(() => {
    if (autoFetch && productCodesSnapshot === '') {
      console.log('🚀 [useGenericProductsList] Initial load');
      fetchData(1);
    }
  }, [autoFetch, pharmacyIds, showGlobalTop, productCodesSnapshot, fetchData]);

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
    console.log('🔄 [useGenericProductsList] Manual fetch triggered');
    fetchData(1, true);
  }, [fetchData]);

  const search = useCallback((query: string) => {
    console.log('🔍 [useGenericProductsList] Search:', query);
    setSearchQuery(query);
    fetchData(1, false, undefined, query);
  }, [fetchData]);

  const sort = useCallback((column: string, direction: 'asc' | 'desc') => {
    console.log('🔄 [useGenericProductsList] Sort:', { column, direction });
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