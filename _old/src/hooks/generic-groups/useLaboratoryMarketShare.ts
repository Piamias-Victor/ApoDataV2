// src/hooks/generic-groups/useLaboratoryMarketShare.ts
import { useState, useEffect, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useGenericGroupStore } from '@/stores/useGenericGroupStore'; // 🔥 NOUVEAU
import type { LaboratoryMarketShare } from '@/types/laboratory';

interface UseLaboratoryMarketShareOptions {
  readonly enabled: boolean;
  readonly productCodes: string[];
  readonly dateRange: { start: string; end: string };
  readonly pageSize?: number;
  readonly autoFetch?: boolean;
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
  readonly manualFetch: () => Promise<void>;
  readonly fetchAll: () => Promise<LaboratoryMarketShare[]>;
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
  const [hasLoadedGlobal, setHasLoadedGlobal] = useState(false);
  const [productCodesSnapshot, setProductCodesSnapshot] = useState<string>('');

  // 🔥 NOUVEAU - Récupérer pharmacyIds
  const pharmacyIds = useFiltersStore(state => state.pharmacy);

  // 🔥 NOUVEAU - Vérifier filtres actifs
  const hasActiveSelections = useGenericGroupStore(state =>
    state.selectedGroups.length > 0 ||
    state.selectedProducts.length > 0 ||
    state.selectedLaboratories.length > 0
  );
  const hasPriceFilters = useGenericGroupStore(state => state.hasPriceFilters());
  const hasTvaFilters = useGenericGroupStore(state => state.tvaRates.length > 0);
  const hasGenericStatusFilter = useGenericGroupStore(state => state.genericStatus !== 'BOTH');

  const hasAnyActiveFilters = hasActiveSelections || hasPriceFilters || hasTvaFilters || hasGenericStatusFilter;

  const { enabled, productCodes, dateRange, pageSize = 10, autoFetch = true } = options;

  const fetchData = useCallback(async (page: number, forceGlobal = false) => {
    if (!enabled) return;

    // 🔥 MODIFIÉ - Logique similaire à useGenericProductsList
    const shouldUseGlobalMode = forceGlobal || hasLoadedGlobal;

    if (!shouldUseGlobalMode && productCodes.length === 0) {
      if (hasAnyActiveFilters) {
        // Filtres actifs mais 0 résultat → afficher tableau vide
        console.log('⚠️ [useLaboratoryMarketShare] Filters active but 0 results');
        setData([]);
        setTotal(0);
        setTotalPages(0);
        setIsGlobalMode(false);
        setHasLoadedGlobal(false);
        return;
      } else {
        // Aucun filtre → ne rien afficher
        setData([]);
        setIsGlobalMode(false);
        setHasLoadedGlobal(false);
        return;
      }
    }

    console.log('🔄 [useLaboratoryMarketShare] Fetching with:', {
      productCodesCount: productCodes.length,
      pharmacyIds,
      shouldUseGlobalMode,
      hasAnyActiveFilters
    });

    setIsLoading(true);
    setError(null);
    setIsGlobalMode(shouldUseGlobalMode);

    try {
      const response = await fetch('/api/generic-groups/laboratory-market-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange,
          productCodes: shouldUseGlobalMode ? [] : productCodes,
          pharmacyIds, // 🔥 AJOUT
          page,
          pageSize
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result = await response.json();

      console.log('✅ [useLaboratoryMarketShare] Fetched:', {
        laboratoriesCount: result.laboratories.length,
        total: result.pagination.total
      });

      setData(result.laboratories);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
      setCurrentPage(page);
      setIsGlobalMode(result.isGlobalMode || false);

      if (shouldUseGlobalMode) {
        setHasLoadedGlobal(true);
      }
    } catch (err) {
      console.error('❌ [useLaboratoryMarketShare] Error:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, productCodes, dateRange, pageSize, pharmacyIds, hasAnyActiveFilters, hasLoadedGlobal]);

  // 🔥 NOUVEAU - Surveiller changements productCodes
  useEffect(() => {
    const newSnapshot = JSON.stringify(productCodes);
    if (newSnapshot !== productCodesSnapshot) {
      console.log('🔄 [useLaboratoryMarketShare] ProductCodes changed:', {
        count: productCodes.length,
        hasAnyActiveFilters
      });
      setProductCodesSnapshot(newSnapshot);
      if (enabled && autoFetch) {
        fetchData(1);
      }
    }
  }, [productCodes, productCodesSnapshot, enabled, autoFetch, hasAnyActiveFilters, fetchData]);

  // Premier chargement uniquement
  useEffect(() => {
    if (autoFetch && productCodesSnapshot === '') {
      console.log('🚀 [useLaboratoryMarketShare] Initial load');
      fetchData(1);
    }
  }, [autoFetch, pharmacyIds, productCodesSnapshot, fetchData]);

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

  const manualFetch = useCallback(async () => {
    console.log('🔄 [useLaboratoryMarketShare] Manual fetch triggered');
    await fetchData(1, true);
  }, [fetchData]);

  const fetchAll = useCallback(async (): Promise<LaboratoryMarketShare[]> => {
    if (!enabled) return [];

    const shouldUseGlobalMode = hasLoadedGlobal;

    if (!shouldUseGlobalMode && productCodes.length === 0) {
      if (hasAnyActiveFilters) {
        return [];
      } else {
        return [];
      }
    }

    try {
      const response = await fetch('/api/generic-groups/laboratory-market-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange,
          productCodes: shouldUseGlobalMode ? [] : productCodes,
          pharmacyIds,
          page: 1,
          pageSize: 100000 // Fetch all
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result = await response.json();
      return result.laboratories;
    } catch (err) {
      console.error('❌ [useLaboratoryMarketShare] Error fetching all:', err);
      return [];
    }
  }, [enabled, productCodes, dateRange, pharmacyIds, hasAnyActiveFilters, hasLoadedGlobal]);

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
    isGlobalMode,
    manualFetch,
    fetchAll
  };
}