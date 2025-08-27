// src/hooks/dashboard/useKpiMetrics.ts
import { useState, useCallback, useEffect, useRef } from 'react';

// Types mutables avec toutes propriétés optionnelles
interface KpiRequest {
  dateRange: { start: string; end: string; };
  comparisonDateRange?: { start: string; end: string; };
  productCodes?: string[];
  laboratoryCodes?: string[];
  categoryCodes?: string[];
  pharmacyIds?: string[];
}

interface KpiMetricsResponse {
  readonly ca_ttc: number;
  readonly montant_achat_ht: number;
  readonly montant_marge: number;
  readonly pourcentage_marge: number;
  readonly valeur_stock_ht: number;
  readonly quantite_stock: number;
  readonly quantite_vendue: number;
  readonly quantite_achetee: number;
  readonly jours_de_stock: number | null;
  readonly nb_references_produits: number;
  readonly nb_pharmacies: number;
  readonly comparison?: {
    readonly ca_ttc: number;
    readonly montant_achat_ht: number;
    readonly montant_marge: number;
    readonly quantite_vendue: number;
    readonly quantite_achetee: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseKpiMetricsOptions {
  readonly enabled?: boolean;
  readonly includeComparison?: boolean;
  readonly dateRange: { start: string; end: string };
  readonly comparisonDateRange?: { start: string | null; end: string | null } | undefined;  // CORRIGÉ : autorise null
  readonly filters?: {
    products?: string[];
    laboratories?: string[];  
    categories?: string[];
    pharmacies?: string[];
  };
}

interface UseKpiMetricsReturn {
  readonly data: KpiMetricsResponse | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
}

/**
 * Hook useKpiMetrics - Dashboard KPI Metrics avec comparaison complète
 * 
 * Fonctionnalités :
 * - Calculs KPI temps réel : CA, marge, stock, quantités, ACHAT
 * - Comparaison période complète (inclut montant_achat_ht + quantite_achetee)
 * - Cache intelligent avec force refresh
 * - Validation filtres (dates obligatoires)
 * - Zustand store integration
 * - Gestion erreurs robuste
 */
export function useKpiMetrics(
  options: UseKpiMetricsOptions
): UseKpiMetricsReturn {
  const { 
    enabled = true, 
    includeComparison = false,
    dateRange,
    comparisonDateRange,
    filters = {}
  } = options;
  
  // Extraction des filtres avec defaults
  const { products = [], laboratories = [], categories = [], pharmacies = [] } = filters;
  
  const [data, setData] = useState<KpiMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryTime, setQueryTime] = useState(0);
  const [cached, setCached] = useState(false);

  // Refs pour éviter les boucles infinies
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');
  const forceRefreshRef = useRef(false);

  // Fonction de fetch stable avec useCallback
  const fetchKpiMetrics = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    console.log('🚀 [Hook] fetchKpiMetrics called', { forceRefresh, enabled });
    
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
    const requestBody: KpiRequest = {
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

    console.log('📡 [Hook] Starting KPI fetch request', {
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
      
      const response = await fetch('/api/kpis', {
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

      const result: KpiMetricsResponse = await response.json();
      const totalTime = Date.now() - startTime;

      console.log('✅ [Hook] KPI metrics fetched successfully', {
        ca_ttc: result.ca_ttc,
        montant_achat_ht: result.montant_achat_ht,
        quantite_achetee: result.quantite_achetee,
        nb_references: result.nb_references_produits,
        nb_pharmacies: result.nb_pharmacies,
        hasComparison: !!result.comparison,
        comparisonHasAchat: result.comparison ? {
          montant_achat_ht: result.comparison.montant_achat_ht,
          quantite_achetee: result.comparison.quantite_achetee
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
        
        console.error('❌ [Hook] KPI fetch failed:', err.message);
        setError(err.message);
      } else {
        console.error('❌ [Hook] Unknown error:', err);
        setError('Erreur inattendue lors du chargement des KPI');
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
    await fetchKpiMetrics(true);
  }, [fetchKpiMetrics]);

  // Effet pour déclencher le fetch automatique dès qu'une dépendance change
  useEffect(() => {
    if (enabled) {
      console.log('🎯 [Hook] Auto-fetch triggered by dependency change', {
        dateRange,
        comparisonDateRange,
        filters: { products, laboratories, categories, pharmacies },
        includeComparison
      });
      fetchKpiMetrics(false);
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
    fetchKpiMetrics
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