// src/hooks/laboratories/useLaboratoryMarketShareWithFilters.ts
import { useState, useEffect, useCallback, useRef } from 'react';
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
  readonly hasComparison: boolean;
}

/**
 * Hook useLaboratoryMarketShareWithFilters - VERSION SIMPLIFIÉE
 * 
 * ✅ Utilise directement products du store (contient logique ET/OU + exclusions)
 * ✅ Custom fetch avec pagination
 */
export function useLaboratoryMarketShareWithFilters(
  options: UseLaboratoryMarketShareOptions = {}
): UseLaboratoryMarketShareReturn {
  const [data, setData] = useState<LaboratoryMarketShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasComparison, setHasComparison] = useState(false);

  const { enabled = true, pageSize = 10 } = options;

  // ✅ Récupérer les propriétés du store
  const pharmacy = useFiltersStore((state) => state.pharmacy);
  const analysisDateRangeStart = useFiltersStore((state) => state.analysisDateRange.start);
  const analysisDateRangeEnd = useFiltersStore((state) => state.analysisDateRange.end);
  const comparisonDateRangeStart = useFiltersStore((state) => state.comparisonDateRange.start);
  const comparisonDateRangeEnd = useFiltersStore((state) => state.comparisonDateRange.end);

  // 🔥 Lecture directe de products (contient déjà logique ET/OU + exclusions)
  const products = useFiltersStore((state) => state.products);
  const excludedProducts = useFiltersStore((state) => state.excludedProducts);

  console.log('🎯 [useLaboratoryMarketShare] Using products from store:', {
    total: products.length,
    excluded: excludedProducts.length
  });

  // ✅ Ref pour abort controller
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (page: number) => {
    if (!enabled) return;

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    console.log('🔍 [fetchData] Calling API with filters:', {
      products: products.length,
      pharmacy: pharmacy.length,
      dateRange: `${analysisDateRangeStart} → ${analysisDateRangeEnd}`,
      page
    });

    try {
      const response = await fetch('/api/laboratory/market-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          filters: {
            productCodes: products, // 🔥 Directement products du store
            pharmacyIds: pharmacy,
            dateRange: {
              start: analysisDateRangeStart,
              end: analysisDateRangeEnd
            },
            comparisonDateRange: {
              start: comparisonDateRangeStart,
              end: comparisonDateRangeEnd
            }
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
      
      console.log('✅ [fetchData] Response received:', {
        totalLabs: result.pagination?.total,
        currentPage: result.pagination?.page,
        hasComparison: result.hasComparison
      });

      setData(result.laboratories || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotal(result.pagination?.total || 0);
      setCurrentPage(page);
      setHasComparison(result.hasComparison || false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('⛔ [fetchData] Request aborted');
        return;
      }
      console.error('❌ [fetchData] Error:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    enabled,
    products, // 🔥 Dépendance directe de products
    pharmacy,
    analysisDateRangeStart,
    analysisDateRangeEnd,
    comparisonDateRangeStart,
    comparisonDateRangeEnd,
    pageSize
  ]);

  // ✅ useEffect déclenché quand products change
  useEffect(() => {
    console.log('🎯 [useEffect] Products changed, fetching page 1');
    setCurrentPage(1);
    fetchData(1);
  }, [fetchData]);

  // ✅ Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
    hasComparison
  };
}