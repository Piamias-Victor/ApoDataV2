// src/hooks/dashboard/useStockMetrics.ts
import { useState, useCallback, useEffect, useRef } from 'react';

interface StockMetricsRequest {
  dateRange: { start: string; end: string; };
  comparisonDateRange?: { start: string; end: string; };
  productCodes?: string[];
  laboratoryCodes?: string[];
  categoryCodes?: string[];
  pharmacyIds?: string[];
}

interface StockMetricsResponse {
  readonly quantite_stock_actuel_total: number;
  readonly montant_stock_actuel_total: number;
  readonly stock_moyen_12_mois: number;
  readonly jours_de_stock_actuels: number | null;
  readonly nb_references_produits: number;
  readonly nb_pharmacies: number;
  readonly comparison?: {
    readonly quantite_stock_actuel_total: number;
    readonly montant_stock_actuel_total: number;
    readonly stock_moyen_12_mois: number;
    readonly jours_de_stock_actuels: number | null;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseStockMetricsOptions {
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

interface UseStockMetricsReturn {
  readonly data: StockMetricsResponse | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
}

/**
 * Hook useStockMetrics - Dashboard Stock Metrics avec comparaison complète
 * 
 * Fonctionnalités :
 * - Calculs stock temps réel : quantités, valeur, moyenne 12 mois, jours de stock
 * - Comparaison période complète avec toutes les métriques
 * - Cache intelligent avec force refresh
 * - Validation filtres (dates obligatoires)
 * - Zustand store integration
 * - Gestion erreurs robuste
 */
export function useStockMetrics(
  options: UseStockMetricsOptions
): UseStockMetricsReturn {
  const { 
    enabled = true, 
    includeComparison = false,
    dateRange,
    comparisonDateRange,
    filters = {}
  } = options;
  
  // Extraction des filtres avec defaults
  const { products = [], laboratories = [], categories = [], pharmacies = [] } = filters;
  
  const [data, setData] = useState<StockMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryTime, setQueryTime] = useState(0);
  const [cached, setCached] = useState(false);

  // Refs pour éviter les boucles infinies
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');
  const forceRefreshRef = useRef(false);

  // Fonction de fetch stable avec useCallback
  const fetchStockMetrics = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    console.log('🚀 [Hook] fetchStockMetrics called', { forceRefresh, enabled });
    
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

    // Construction d'objet avec spread operator
    const requestBody: StockMetricsRequest = {
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

    console.log('📡 [Hook] Starting Stock Metrics fetch request', {
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
      
      const response = await fetch('/api/stock-metrics', {
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

      const result: StockMetricsResponse = await response.json();
      const totalTime = Date.now() - startTime;

      console.log('✅ [Hook] Stock metrics fetched successfully', {
        quantite_stock: result.quantite_stock_actuel_total,
        montant_stock: result.montant_stock_actuel_total,
        stock_moyen: result.stock_moyen_12_mois,
        jours_stock: result.jours_de_stock_actuels,
        nb_references: result.nb_references_produits,
        nb_pharmacies: result.nb_pharmacies,
        hasComparison: !!result.comparison,
        comparisonHasStock: result.comparison ? {
          quantite_stock: result.comparison.quantite_stock_actuel_total,
          montant_stock: result.comparison.montant_stock_actuel_total,
          stock_moyen: result.comparison.stock_moyen_12_mois,
          jours_stock: result.comparison.jours_de_stock_actuels
        } : null,
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
        
        console.error('❌ [Hook] Stock metrics fetch failed:', err.message);
        setError(err.message);
      } else {
        console.error('❌ [Hook] Unknown error:', err);
        setError('Erreur inattendue lors du chargement des métriques de stock');
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
    JSON.stringify(products), // Deep comparison pour arrays
    JSON.stringify(laboratories),
    JSON.stringify(categories),
    JSON.stringify(pharmacies)
  ]);

  // Fonction refetch publique
  const refetch = useCallback(async (): Promise<void> => {
    console.log('🔄 [Hook] Manual refetch triggered');
    await fetchStockMetrics(true);
  }, [fetchStockMetrics]);

  // Effet pour déclencher le fetch automatique dès qu'une dépendance change
  useEffect(() => {
    if (enabled) {
      console.log('🎯 [Hook] Auto-fetch triggered by dependency change', {
        dateRange,
        comparisonDateRange,
        filters: { products, laboratories, categories, pharmacies },
        includeComparison
      });
      fetchStockMetrics(false);
    }
  }, [
    enabled,
    includeComparison,
    dateRange.start,
    dateRange.end,
    comparisonDateRange?.start,
    comparisonDateRange?.end,
    JSON.stringify(products), // Stringify pour deep comparison des arrays
    JSON.stringify(laboratories),
    JSON.stringify(categories), 
    JSON.stringify(pharmacies),
    fetchStockMetrics
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