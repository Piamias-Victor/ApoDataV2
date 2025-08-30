// src/hooks/comparisons/useComparisonMarketShare.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import type { ComparisonElement } from '@/types/comparison';

interface MarketShareHierarchyRequest {
  dateRange: { start: string; end: string; };
  productCodes?: string[];
  laboratoryCodes?: string[];
  categoryCodes?: string[];
  pharmacyIds?: string[];
  hierarchyLevel: 'universe' | 'category' | 'family';
  page?: number;
  limit?: number;
}

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

interface UseComparisonMarketShareOptions {
  readonly enabled?: boolean;
  readonly elementA: ComparisonElement | null;
  readonly elementB: ComparisonElement | null;
  readonly hierarchyLevel: 'universe' | 'category' | 'family';
  readonly page?: number;
  readonly limit?: number;
}

interface UseComparisonMarketShareReturn {
  readonly dataA: MarketShareHierarchyResponse | null;
  readonly dataB: MarketShareHierarchyResponse | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTimeA: number;
  readonly queryTimeB: number;
  readonly refetch: () => Promise<void>;
  readonly hasDataA: boolean;
  readonly hasDataB: boolean;
  readonly currentPage: number;
  readonly setPage: (page: number) => void;
  readonly canPreviousPage: boolean;
  readonly canNextPage: boolean;
  readonly previousPage: () => void;
  readonly nextPage: () => void;
}

/**
 * Hook useComparisonMarketShare - Parts de marché comparées A vs B
 * 
 * Fonctionnalités :
 * - 2 requêtes parallèles vers /api/ventes/market-share-hierarchy
 * - Mapping automatique ComparisonElement vers productCodes
 * - Pagination synchronisée pour A et B
 * - États loading/error unifiés
 * - Performance optimisée avec abort controllers
 */
export function useComparisonMarketShare(
  options: UseComparisonMarketShareOptions
): UseComparisonMarketShareReturn {
  const { 
    enabled = true,
    elementA,
    elementB,
    hierarchyLevel,
    page: initialPage = 1,
    limit = 5
  } = options;

  // Store filters pour dates et pharmacies
  const analysisDateRange = useFiltersStore(state => state.analysisDateRange);
  const pharmacyFilter = useFiltersStore(state => state.pharmacy);

  // États
  const [dataA, setDataA] = useState<MarketShareHierarchyResponse | null>(null);
  const [dataB, setDataB] = useState<MarketShareHierarchyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryTimeA, setQueryTimeA] = useState(0);
  const [queryTimeB, setQueryTimeB] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Refs pour cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper: mapping element vers codes produits
  const getProductCodes = useCallback((element: ComparisonElement | null): string[] => {
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

  // Helper: construction requête API
  const buildRequest = useCallback((
    element: ComparisonElement, 
    page: number
  ): MarketShareHierarchyRequest => {
    const productCodes = getProductCodes(element);
    
    return {
      dateRange: {
        start: analysisDateRange.start,
        end: analysisDateRange.end
      },
      hierarchyLevel,
      page,
      limit,
      productCodes,
      ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
    };
  }, [getProductCodes, analysisDateRange, hierarchyLevel, limit, pharmacyFilter]);

  // Fonction fetch principale avec 2 requêtes parallèles
  const fetchMarketShareData = useCallback(async (targetPage: number = currentPage): Promise<void> => {
    if (!enabled) return;

    const hasValidDates = analysisDateRange.start && analysisDateRange.end;
    if (!hasValidDates) {
      setDataA(null);
      setDataB(null);
      setError('Veuillez sélectionner une plage de dates dans les filtres');
      return;
    }

    if (!elementA && !elementB) {
      setDataA(null);
      setDataB(null);
      setError(null);
      return;
    }

    // Annuler requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    console.log('🎯 [ComparisonMarketShare] Starting parallel fetch:', {
      hierarchyLevel,
      targetPage,
      elementA: elementA?.name,
      elementB: elementB?.name
    });

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const requests: Promise<MarketShareHierarchyResponse>[] = [];
      
      // Requête A si élément présent
      if (elementA) {
        const requestBodyA = buildRequest(elementA, targetPage);
        const promiseA = fetch('/api/ventes/market-share-hierarchy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBodyA),
          signal: abortControllerRef.current.signal
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error A: ${errorData.error || response.statusText}`);
          }
          return response.json();
        });
        
        requests.push(promiseA);
      }

      // Requête B si élément présent
      if (elementB) {
        const requestBodyB = buildRequest(elementB, targetPage);
        const promiseB = fetch('/api/ventes/market-share-hierarchy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBodyB),
          signal: abortControllerRef.current.signal
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error B: ${errorData.error || response.statusText}`);
          }
          return response.json();
        });

        requests.push(promiseB);
      }

      // Exécution parallèle
      const results = await Promise.allSettled(requests);
      
      // Traitement résultats A
      let resultA: MarketShareHierarchyResponse | null = null;
      let queryA = 0;
      if (elementA && results[0]) {
        if (results[0].status === 'fulfilled') {
          resultA = results[0].value;
          queryA = resultA.queryTime;
        } else {
          console.error('❌ Market Share A failed:', results[0].reason);
          throw new Error(results[0].reason?.message || 'Erreur requête élément A');
        }
      }

      // Traitement résultats B  
      let resultB: MarketShareHierarchyResponse | null = null;
      let queryB = 0;
      const resultBIndex = elementA && elementB ? 1 : 0;
      if (elementB && results[resultBIndex]) {
        if (results[resultBIndex].status === 'fulfilled') {
          resultB = results[resultBIndex].value;
          queryB = resultB.queryTime;
        } else {
          console.error('❌ Market Share B failed:', results[resultBIndex].reason);
          throw new Error(results[resultBIndex].reason?.message || 'Erreur requête élément B');
        }
      }

      console.log('✅ [ComparisonMarketShare] Parallel fetch completed:', {
        segmentsA: resultA?.segments.length || 0,
        segmentsB: resultB?.segments.length || 0,
        queryTimeA: queryA,
        queryTimeB: queryB,
        hierarchyLevel
      });

      // MAJ états
      setDataA(resultA);
      setDataB(resultB);
      setQueryTimeA(queryA);
      setQueryTimeB(queryB);
      setCurrentPage(targetPage);
      setError(null);

    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.log('⛔ [ComparisonMarketShare] Request aborted');
          return;
        }
        
        console.error('❌ [ComparisonMarketShare] Fetch failed:', err.message);
        setError(err.message);
      } else {
        console.error('❌ [ComparisonMarketShare] Unknown error:', err);
        setError('Erreur inattendue lors du chargement des parts de marché');
      }
      
      setDataA(null);
      setDataB(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    analysisDateRange,
    hierarchyLevel,
    elementA,
    elementB,
    currentPage,
    buildRequest
  ]);

  // Fonction refetch publique
  const refetch = useCallback(async (): Promise<void> => {
    console.log('🔄 [ComparisonMarketShare] Manual refetch triggered');
    await fetchMarketShareData(currentPage);
  }, [fetchMarketShareData, currentPage]);

  // Pagination handlers
  const setPage = useCallback((page: number) => {
    console.log('📄 [ComparisonMarketShare] Setting page:', page);
    setCurrentPage(page);
  }, []);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setPage(currentPage - 1);
    }
  }, [currentPage, setPage]);

  const nextPage = useCallback(() => {
    const maxPagesA = dataA?.pagination.totalPages || 0;
    const maxPagesB = dataB?.pagination.totalPages || 0;
    const maxPages = Math.max(maxPagesA, maxPagesB);
    
    if (currentPage < maxPages) {
      setPage(currentPage + 1);
    }
  }, [currentPage, dataA, dataB, setPage]);

  // Auto-fetch sur changements de dépendances
  useEffect(() => {
    if (enabled && (elementA || elementB)) {
      console.log('🎯 [ComparisonMarketShare] Auto-fetch triggered:', {
        hierarchyLevel,
        currentPage,
        elementA: elementA?.name,
        elementB: elementB?.name
      });
      fetchMarketShareData(currentPage);
    }
  }, [
    enabled,
    elementA,
    elementB,
    hierarchyLevel,
    currentPage,
    analysisDateRange.start,
    analysisDateRange.end,
    JSON.stringify(pharmacyFilter),
    fetchMarketShareData
  ]);

  // Cleanup à la destruction
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        console.log('🧹 [ComparisonMarketShare] Cleanup: aborting request');
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Computed values
  const maxPagesA = dataA?.pagination.totalPages || 0;
  const maxPagesB = dataB?.pagination.totalPages || 0;
  const maxPages = Math.max(maxPagesA, maxPagesB);

  return {
    dataA,
    dataB,
    isLoading,
    error,
    isError: !!error,
    queryTimeA,
    queryTimeB,
    refetch,
    hasDataA: !!dataA,
    hasDataB: !!dataB,
    currentPage,
    setPage,
    canPreviousPage: currentPage > 1,
    canNextPage: currentPage < maxPages,
    previousPage,
    nextPage
  };
}