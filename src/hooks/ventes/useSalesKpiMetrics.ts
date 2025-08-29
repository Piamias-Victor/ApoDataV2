// src/hooks/ventes/useSalesKpiMetrics.ts
import { useState, useCallback, useEffect, useRef } from 'react';

interface SalesKpiRequest {
  dateRange: { start: string; end: string; };
  comparisonDateRange?: { start: string; end: string; };
  productCodes?: string[];
  laboratoryCodes?: string[];
  categoryCodes?: string[];
  pharmacyIds?: string[];
}

interface SalesKpiMetricsResponse {
  readonly quantite_vendue: number;
  readonly ca_ttc: number;
  readonly part_marche_ca_pct: number;
  readonly part_marche_marge_pct: number;
  readonly nb_references_selection: number;
  readonly nb_references_80pct_ca: number;
  readonly montant_marge: number;
  readonly taux_marge_pct: number;
  readonly comparison?: {
    readonly quantite_vendue: number;
    readonly ca_ttc: number;
    readonly part_marche_ca_pct: number;
    readonly part_marche_marge_pct: number;
    readonly nb_references_selection: number;
    readonly nb_references_80pct_ca: number;
    readonly montant_marge: number;
    readonly taux_marge_pct: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseSalesKpiMetricsOptions {
  readonly enabled?: boolean;
  readonly includeComparison?: boolean;
  readonly dateRange: { start: string; end: string };
  readonly comparisonDateRange?: { start: string | null; end: string | null } | undefined;
  readonly filters?: {
    products?: string[];
    laboratories?: string[];  
    categories?: string[];
    pharmacies?: string[];
  };
}

interface UseSalesKpiMetricsReturn {
  readonly data: SalesKpiMetricsResponse | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
}

/**
 * Hook useSalesKpiMetrics - KPI métriques ventes avec parts de marché
 * 
 * Fonctionnalités :
 * - 4 KPI cards : Quantités + CA, Parts de marché, Références, Marge
 * - Comparaison période complète
 * - Cache intelligent
 * - Validation filtres
 * - Zustand store integration
 */
export function useSalesKpiMetrics(
  options: UseSalesKpiMetricsOptions
): UseSalesKpiMetricsReturn {
  const { 
    enabled = true, 
    includeComparison = false,
    dateRange,
    comparisonDateRange,
    filters = {}
  } = options;
  
  const { products = [], laboratories = [], categories = [], pharmacies = [] } = filters;
  
  const [data, setData] = useState<SalesKpiMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryTime, setQueryTime] = useState(0);
  const [cached, setCached] = useState(false);

  // Refs pour éviter les boucles infinies
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');
  const forceRefreshRef = useRef(false);

  // Fonction de fetch stable avec useCallback
  const fetchSalesKpiMetrics = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    console.log('🚀 [Hook] fetchSalesKpiMetrics called', { forceRefresh, enabled });
    
    if (!enabled) {
      console.log('❌ [Hook] Hook disabled, stopping');
      return;
    }
    
    // Validation des filtres requis - dates obligatoires
    const hasDateRange = dateRange.start && dateRange.end;
    
    console.log('📅 [Hook] Date validation:', {
      start: dateRange.start,
      end: dateRange.end,
      hasDateRange,
      includeComparison,
      hasComparisonRange: comparisonDateRange?.start && comparisonDateRange?.end
    });
    
    if (!hasDateRange) {
      console.log('❌ [Hook] Missing date range, setting error');
      setData(null);
      setError('Veuillez sélectionner une plage de dates dans les filtres');
      setIsLoading(false);
      return;
    }

    // Construction de l'objet requête
    const requestBody: SalesKpiRequest = {
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      },
      ...(products.length > 0 && { productCodes: products }),
      ...(laboratories.length > 0 && { laboratoryCodes: laboratories }),
      ...(categories.length > 0 && { categoryCodes: categories }),
      ...(pharmacies.length > 0 && { pharmacyIds: pharmacies }),
      ...(includeComparison && 
          comparisonDateRange?.start && 
          comparisonDateRange?.end && {
        comparisonDateRange: {
          start: comparisonDateRange.start,
          end: comparisonDateRange.end
        }
      })
    };

    const requestKey = JSON.stringify(requestBody) + (forceRefresh ? '_force' : '');
    
    // Éviter les requêtes duplicatas
    if (requestKey === lastRequestRef.current && !forceRefresh) {
      console.log('🔄 [Hook] Request identical, skipping');
      return;
    }

    // Annuler requête précédente si en cours
    if (abortControllerRef.current) {
      console.log('⛔ [Hook] Aborting previous request');
      abortControllerRef.current.abort();
    }

    console.log('📡 [Hook] Starting Sales KPI fetch request', {
      dateRange: requestBody.dateRange,
      hasComparison: !!requestBody.comparisonDateRange,
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
    forceRefreshRef.current = forceRefresh;
    
    setIsLoading(true);
    setError(null);

    try {
      const startTime = Date.now();
      
      const response = await fetch('/api/ventes/kpis', {
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

      const result: SalesKpiMetricsResponse = await response.json();
      const totalTime = Date.now() - startTime;

      console.log('✅ [Hook] Sales KPI metrics fetched successfully', {
        quantite_vendue: result.quantite_vendue,
        ca_ttc: result.ca_ttc,
        part_marche_ca_pct: result.part_marche_ca_pct,
        part_marche_marge_pct: result.part_marche_marge_pct,
        nb_references_selection: result.nb_references_selection,
        nb_references_80pct_ca: result.nb_references_80pct_ca,
        hasComparison: !!result.comparison,
        cached: result.cached,
        queryTime: result.queryTime,
        totalTime,
        forceRefresh: forceRefreshRef.current
      });

      setData(result);
      setQueryTime(result.queryTime);
      setCached(result.cached && !forceRefreshRef.current);
      setError(null);

    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.log('⛔ [Hook] Request aborted');
          return;
        }
        
        console.error('❌ [Hook] Sales KPI fetch failed:', err.message);
        setError(err.message);
      } else {
        console.error('❌ [Hook] Unknown error:', err);
        setError('Erreur inattendue lors du chargement des KPI ventes');
      }
      
      setData(null);
      setCached(false);
    } finally {
      setIsLoading(false);
      forceRefreshRef.current = false;
    }

  }, [
    enabled,
    includeComparison,
    dateRange.start,
    dateRange.end,
    comparisonDateRange?.start,
    comparisonDateRange?.end,
    JSON.stringify(products),
    JSON.stringify(laboratories),
    JSON.stringify(categories),
    JSON.stringify(pharmacies)
  ]);

  // Fonction refetch publique
  const refetch = useCallback(async (): Promise<void> => {
    console.log('🔄 [Hook] Manual refetch triggered');
    await fetchSalesKpiMetrics(true);
  }, [fetchSalesKpiMetrics]);

  // Effet pour déclencher le fetch automatique
  useEffect(() => {
    if (enabled) {
      console.log('🎯 [Hook] Auto-fetch triggered by dependency change', {
        dateRange,
        comparisonDateRange,
        filters: { products, laboratories, categories, pharmacies },
        includeComparison
      });
      fetchSalesKpiMetrics(false);
    }
  }, [
    enabled,
    includeComparison,
    dateRange.start,
    dateRange.end,
    comparisonDateRange?.start,
    comparisonDateRange?.end,
    JSON.stringify(products),
    JSON.stringify(laboratories),
    JSON.stringify(categories), 
    JSON.stringify(pharmacies),
    fetchSalesKpiMetrics
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
    hasData: !!data
  };
}