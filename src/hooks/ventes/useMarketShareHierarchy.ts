// src/hooks/ventes/useMarketShareHierarchy.ts
import { useState, useCallback, useEffect, useRef } from 'react';

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

interface UseMarketShareHierarchyOptions {
  readonly enabled?: boolean;
  readonly dateRange: { start: string; end: string };
  readonly hierarchyLevel: 'universe' | 'category' | 'family';
  readonly page?: number;
  readonly limit?: number;
  readonly filters?: {
    products?: string[];
    laboratories?: string[];
    categories?: string[];
    pharmacies?: string[];
  };
}

interface UseMarketShareHierarchyReturn {
  readonly data: MarketShareHierarchyResponse | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalSegments: number;
  readonly canPreviousPage: boolean;
  readonly canNextPage: boolean;
  readonly previousPage: () => void;
  readonly nextPage: () => void;
  readonly setPage: (page: number) => void;
}

/**
 * Hook useMarketShareHierarchy - Parts de marché par hiérarchie produits
 * 
 * Fonctionnalités :
 * - Calcul parts de marché CA et Marge par univers/catégorie/famille
 * - Pagination intégrée (5 segments par page)
 * - Tri par CA sélection décroissant
 * - Cache intelligent
 * - Validation filtres
 */
export function useMarketShareHierarchy(
  options: UseMarketShareHierarchyOptions
): UseMarketShareHierarchyReturn {
  const { 
    enabled = true,
    dateRange,
    hierarchyLevel,
    page: initialPage = 1,
    limit = 5,
    filters = {}
  } = options;
  
  const { products = [], laboratories = [], categories = [], pharmacies = [] } = filters;
  
  const [data, setData] = useState<MarketShareHierarchyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryTime, setQueryTime] = useState(0);
  const [cached, setCached] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Refs pour éviter les boucles infinies
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');

  // Fonction de fetch avec cache et pagination
  const fetchMarketShareHierarchy = useCallback(async (
    targetPage: number = currentPage,
    forceRefresh: boolean = false
  ): Promise<void> => {
    console.log('🎯 [Hook] fetchMarketShareHierarchy called', { 
      enabled, 
      hierarchyLevel, 
      targetPage, 
      forceRefresh 
    });
    
    if (!enabled) {
      console.log('❌ [Hook] Hook disabled, stopping');
      return;
    }
    
    // Validation des dates obligatoires
    const hasDateRange = dateRange.start && dateRange.end;
    
    console.log('📅 [Hook] Date validation:', {
      start: dateRange.start,
      end: dateRange.end,
      hasDateRange,
      hierarchyLevel
    });
    
    if (!hasDateRange) {
      console.log('❌ [Hook] Missing date range, setting error');
      setData(null);
      setError('Veuillez sélectionner une plage de dates dans les filtres');
      setIsLoading(false);
      return;
    }

    // Construction requête
    const requestBody: MarketShareHierarchyRequest = {
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      },
      hierarchyLevel,
      page: targetPage,
      limit,
      ...(products.length > 0 && { productCodes: products }),
      ...(laboratories.length > 0 && { laboratoryCodes: laboratories }),
      ...(categories.length > 0 && { categoryCodes: categories }),
      ...(pharmacies.length > 0 && { pharmacyIds: pharmacies })
    };

    const requestKey = JSON.stringify(requestBody) + (forceRefresh ? '_force' : '');
    
    // Éviter requêtes duplicatas
    if (requestKey === lastRequestRef.current && !forceRefresh) {
      console.log('🔄 [Hook] Request identical, skipping');
      return;
    }

    // Annuler requête précédente
    if (abortControllerRef.current) {
      console.log('⛔ [Hook] Aborting previous request');
      abortControllerRef.current.abort();
    }

    console.log('📡 [Hook] Starting Market Share Hierarchy fetch', {
      hierarchyLevel,
      page: targetPage,
      limit,
      filtersCount: {
        products: products.length,
        laboratories: laboratories.length,
        categories: categories.length,
        pharmacies: pharmacies.length
      },
      forceRefresh
    });

    abortControllerRef.current = new AbortController();
    lastRequestRef.current = requestKey;
    
    setIsLoading(true);
    setError(null);

    try {
      const startTime = Date.now();
      
      const response = await fetch('/api/ventes/market-share-hierarchy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(forceRefresh && { 'Cache-Control': 'no-cache' })
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: MarketShareHierarchyResponse = await response.json();
      const totalTime = Date.now() - startTime;

      console.log('✅ [Hook] Market Share Hierarchy fetched successfully', {
        hierarchyLevel: result.hierarchyLevel,
        segmentsCount: result.segments.length,
        currentPage: result.pagination.currentPage,
        totalPages: result.pagination.totalPages,
        totalSegments: result.pagination.totalSegments,
        topSegment: result.segments[0]?.segment_name,
        queryTime: result.queryTime,
        totalTime
      });

      setData(result);
      setCurrentPage(result.pagination.currentPage);
      setQueryTime(result.queryTime);
      setCached(result.cached && !forceRefresh);
      setError(null);

    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.log('⛔ [Hook] Request aborted');
          return;
        }
        
        console.error('❌ [Hook] Market Share Hierarchy fetch failed:', err.message);
        setError(err.message);
      } else {
        console.error('❌ [Hook] Unknown error:', err);
        setError('Erreur inattendue lors du chargement des parts de marché');
      }
      
      setData(null);
      setCached(false);
    } finally {
      setIsLoading(false);
    }

  }, [
    enabled,
    dateRange.start,
    dateRange.end,
    hierarchyLevel,
    limit,
    JSON.stringify(products),
    JSON.stringify(laboratories),
    JSON.stringify(categories),
    JSON.stringify(pharmacies),
    currentPage
  ]);

  // Fonction refetch publique
  const refetch = useCallback(async (): Promise<void> => {
    console.log('🔄 [Hook] Manual refetch triggered');
    await fetchMarketShareHierarchy(currentPage, true);
  }, [fetchMarketShareHierarchy, currentPage]);

  // Pagination handlers
  const setPage = useCallback((page: number) => {
    console.log('📄 [Hook] Setting page:', page);
    setCurrentPage(page);
  }, []);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setPage(currentPage - 1);
    }
  }, [currentPage, setPage]);

  const nextPage = useCallback(() => {
    const maxPage = data?.pagination.totalPages || 1;
    if (currentPage < maxPage) {
      setPage(currentPage + 1);
    }
  }, [currentPage, data?.pagination.totalPages, setPage]);

  // Effet pour déclencher le fetch automatique
  useEffect(() => {
    if (enabled) {
      console.log('🎯 [Hook] Auto-fetch triggered by dependency change', {
        dateRange,
        hierarchyLevel,
        currentPage,
        filters: { products, laboratories, categories, pharmacies }
      });
      fetchMarketShareHierarchy(currentPage, false);
    }
  }, [
    enabled,
    dateRange.start,
    dateRange.end,
    hierarchyLevel,
    currentPage,
    limit,
    JSON.stringify(products),
    JSON.stringify(laboratories),
    JSON.stringify(categories),
    JSON.stringify(pharmacies),
    fetchMarketShareHierarchy
  ]);

  // Cleanup à la destruction
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        console.log('🧹 [Hook] Cleanup: aborting request');
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    isError: !!error,
    queryTime,
    cached,
    refetch,
    hasData: !!data,
    currentPage,
    totalPages: data?.pagination.totalPages || 0,
    totalSegments: data?.pagination.totalSegments || 0,
    canPreviousPage: currentPage > 1,
    canNextPage: currentPage < (data?.pagination.totalPages || 0),
    previousPage,
    nextPage,
    setPage
  };
}