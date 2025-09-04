// src/hooks/common/useStandardFetch.ts
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// Types génériques standardisés
interface StandardOptions<TFilters = any> {
  readonly enabled?: boolean | undefined;
  readonly filters?: TFilters | undefined;
  readonly dateRange?: {
    readonly start: string;
    readonly end: string;
  } | undefined;
  readonly comparisonDateRange?: {
    readonly start: string | null;
    readonly end: string | null;
  } | undefined;
  readonly includeComparison?: boolean | undefined;
  readonly forceRefresh?: boolean | undefined;
}

interface StandardReturn<T> {
  readonly data: T | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
}

/**
 * Hook générique standardisé pour tous les appels API
 * 
 * Pattern unique obligatoire :
 * - useCallback pour fetchData avec dependencies stabilisées
 * - useEffect avec [enabled, fetchData] uniquement
 * - AbortController pour cleanup
 * - Error handling unifié
 * - Cache strategy cohérente
 */
export function useStandardFetch<T, TFilters = any>(
  endpoint: string,
  options: StandardOptions<TFilters> = {}
): StandardReturn<T> {
  const {
    enabled = true,
    filters = {} as TFilters,
    dateRange,
    comparisonDateRange,
    includeComparison = false,
    forceRefresh = false
  } = options;

  // États standardisés
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryTime, setQueryTime] = useState(0);
  const [cached, setCached] = useState(false);

  // Refs standardisés pour tous les hooks
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');
  const forceRefreshRef = useRef(forceRefresh);

  // Stabilisation des filtres avec useMemo (plus de JSON.stringify dans useEffect)
  const stableFilters = useMemo(() => 
    JSON.stringify(filters)
  , [filters]);

  // Stabilisation dateRange
  const stableDateRange = useMemo(() => 
    dateRange ? `${dateRange.start}-${dateRange.end}` : null
  , [dateRange?.start, dateRange?.end]);

  // Stabilisation comparisonDateRange
  const stableComparisonRange = useMemo(() => 
    comparisonDateRange && comparisonDateRange.start && comparisonDateRange.end
      ? `${comparisonDateRange.start}-${comparisonDateRange.end}`
      : null
  , [comparisonDateRange?.start, comparisonDateRange?.end]);

  // Construction body standardisée
  const requestBody = useMemo((): Record<string, any> => {
    const body: Record<string, any> = {};

    // Dates obligatoires si présentes
    if (dateRange) {
      body.dateRange = dateRange;
    }

    // Comparaison optionnelle
    if (includeComparison && comparisonDateRange?.start && comparisonDateRange?.end) {
      body.comparisonDateRange = comparisonDateRange;
    }

    // Filtres si présents (structure flexible)
    if (filters && typeof filters === 'object') {
      Object.assign(body, filters);
    }

    return body;
  }, [dateRange, comparisonDateRange, includeComparison, stableFilters]);

  // PATTERN STANDARDISÉ : fetchData avec useCallback
  const fetchData = useCallback(async (forceRefreshParam: boolean = false): Promise<void> => {
    if (!enabled) return;

    // Update force refresh ref
    forceRefreshRef.current = forceRefreshParam;

    // Clé de requête unique pour éviter duplicatas
    const requestKey = JSON.stringify({
      endpoint,
      body: requestBody,
      forceRefresh: forceRefreshRef.current
    });

    // Skip si même requête et pas d'erreur (sauf forceRefresh)
    if (!forceRefreshParam && requestKey === lastRequestRef.current && !error) {
      console.log(`🔄 [${endpoint}] Same request, skipping`);
      return;
    }

    // Annuler requête précédente
    if (abortControllerRef.current) {
      console.log(`⏹️ [${endpoint}] Aborting previous request`);
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    lastRequestRef.current = requestKey;

    console.log(`⏳ [${endpoint}] Starting fetch...`, { body: requestBody, forceRefresh: forceRefreshParam });
    
    setIsLoading(true);
    setError(null);

    try {
      const startTime = performance.now();

      // URL avec timestamp pour forceRefresh
      const url = forceRefreshParam 
        ? `${endpoint}?refresh=${Date.now()}`
        : endpoint;

      // Configuration fetch
      const fetchConfig: RequestInit = {
        method: Object.keys(requestBody).length > 0 ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
      };

      // Body seulement si POST et données présentes
      if (fetchConfig.method === 'POST' && Object.keys(requestBody).length > 0) {
        fetchConfig.body = JSON.stringify(requestBody);
      }

      const response = await fetch(url, fetchConfig);

      console.log(`📡 [${endpoint}] Response:`, {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const endTime = performance.now();
      const totalTime = Math.round(endTime - startTime);

      console.log(`✅ [${endpoint}] Success:`, {
        queryTime: result.queryTime || 0,
        totalTime,
        cached: result.cached || false,
        hasData: !!result
      });

      setData(result);
      setQueryTime(result.queryTime || 0);
      setCached(result.cached && !forceRefreshRef.current);
      setError(null);

    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.log(`⛔ [${endpoint}] Request aborted`);
          return;
        }
        
        console.error(`❌ [${endpoint}] Fetch failed:`, err.message);
        setError(err.message);
      } else {
        console.error(`❌ [${endpoint}] Unknown error:`, err);
        setError(`Erreur inattendue lors du chargement`);
      }
      
      setData(null);
      setCached(false);
    } finally {
      setIsLoading(false);
      forceRefreshRef.current = false;
    }

  }, [
    enabled,
    endpoint,
    stableFilters,
    stableDateRange,
    stableComparisonRange,
    includeComparison,
    error // Garder pour retry si erreur
  ]);

  // Fonction refetch publique standardisée
  const refetch = useCallback(async (): Promise<void> => {
    console.log(`🔄 [${endpoint}] Manual refetch triggered`);
    await fetchData(true);
  }, [fetchData]);

  // PATTERN STANDARDISÉ : useEffect avec [enabled, fetchData] uniquement
  useEffect(() => {
    if (enabled) {
      console.log(`🎯 [${endpoint}] Auto-fetch triggered by dependency change`);
      fetchData(false);
    }
  }, [enabled, fetchData]);

  // Cleanup standardisé
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        console.log(`🧹 [${endpoint}] Cleanup: aborting request`);
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
    hasData: !!data
  };
}