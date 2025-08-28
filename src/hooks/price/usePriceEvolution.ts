// src/hooks/price/usePriceEvolution.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';

interface PriceEvolutionMetrics {
  readonly evolution_prix_vente_pct: number;
  readonly evolution_prix_achat_pct: number;
  readonly evolution_marge_pct: number;
  readonly ecart_prix_vs_marche_pct: number;
  readonly nb_produits_analyses: number;
}

interface PriceEvolutionResponse {
  readonly metrics: PriceEvolutionMetrics;
  readonly queryTime: number;
  readonly cached: boolean;
}

interface PriceEvolutionRequest {
  readonly dateRange: {
    readonly start: string;
    readonly end: string;
  };
  readonly productCodes: string[];
  readonly laboratoryCodes: string[];
  readonly categoryCodes: string[];
  readonly pharmacyIds?: string[] | undefined;
}

interface UsePriceEvolutionOptions {
  readonly enabled?: boolean;
}

interface UsePriceEvolutionReturn {
  readonly metrics: PriceEvolutionMetrics | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
}

/**
 * Hook usePriceEvolution - Évolutions prix pharmaceutiques
 * 
 * Métriques calculées :
 * - Évolution prix vente (début -> fin période)
 * - Évolution prix achat (début -> fin période)
 * - Évolution % marge (différence absolue)
 * - Écart prix actuel vs marché concurrent
 * 
 * Logique sécurisée identique competitive-analysis
 */
export function usePriceEvolution(
  options: UsePriceEvolutionOptions = {}
): UsePriceEvolutionReturn {
  const { enabled = true } = options;
  
  const [metrics, setMetrics] = useState<PriceEvolutionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryTime, setQueryTime] = useState(0);
  const [cached, setCached] = useState(false);
  
  // Refs pour éviter boucles infinies
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');
  const forceRefreshRef = useRef(false);

  // Filtres du store Zustand - identique useCompetitiveAnalysis
  const dateRange = useFiltersStore((state) => state.analysisDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Fonction fetch avec useCallback
  const fetchPriceEvolution = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    console.log('🚀 [Hook] fetchPriceEvolution called', { forceRefresh, enabled });
    
    if (!enabled) {
      console.log('❌ [Hook] Hook disabled, stopping');
      return;
    }
    
    // Validation dates obligatoires
    const hasDateRange = dateRange.start && dateRange.end;
    
    console.log('📅 [Hook] Date validation:', {
      start: dateRange.start,
      end: dateRange.end,
      hasDateRange
    });
    
    console.log('📦 [Hook] Filters:', {
      productsCount: productsFilter.length,
      laboratoriesCount: laboratoriesFilter.length,
      categoriesCount: categoriesFilter.length,
      pharmacyCount: pharmacyFilter.length
    });
    
    if (!hasDateRange) {
      console.log('❌ [Hook] Missing date range, setting error');
      setMetrics(null);
      setError('Veuillez sélectionner une plage de dates dans les filtres');
      setIsLoading(false);
      return;
    }

    // Validation période minimale (au moins 7 jours pour calculer début/fin)
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff < 7) {
      console.log('❌ [Hook] Period too short for evolution calculation');
      setMetrics(null);
      setError('Période trop courte pour calculer les évolutions (minimum 7 jours)');
      setIsLoading(false);
      return;
    }

    // Préparation requête
    const requestBody: PriceEvolutionRequest = {
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      },
      productCodes: productsFilter,
      laboratoryCodes: laboratoriesFilter,
      categoryCodes: categoriesFilter,
      pharmacyIds: pharmacyFilter.length > 0 ? pharmacyFilter : undefined
    };

    console.log('📤 [Hook] Request body prepared:', requestBody);

    const requestKey = JSON.stringify(requestBody);
    
    // Éviter duplicatas SAUF forceRefresh
    if (!forceRefresh && requestKey === lastRequestRef.current && !error) {
      console.log('🔄 [Hook] Same request, skipping');
      return;
    }

    // Annuler requête précédente
    if (abortControllerRef.current) {
      console.log('⏹️ [Hook] Aborting previous request');
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    lastRequestRef.current = requestKey;

    console.log('⏳ [Hook] Starting API call...');
    setIsLoading(true);
    setError(null);

    try {
      // URL avec timestamp pour contournement cache
      const url = forceRefresh 
        ? `/api/price-evolution?refresh=${Date.now()}`
        : '/api/price-evolution';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      console.log('📡 [Hook] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ [Hook] Error response data:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PriceEvolutionResponse = await response.json();
      
      console.log('✅ [Hook] Success response:', {
        evolution_prix_vente: data.metrics.evolution_prix_vente_pct,
        evolution_prix_achat: data.metrics.evolution_prix_achat_pct,
        nb_produits_analyses: data.metrics.nb_produits_analyses,
        queryTime: data.queryTime,
        cached: data.cached
      });
      
      setMetrics(data.metrics);
      setQueryTime(data.queryTime);
      setCached(data.cached);
      setError(null);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('⏹️ [Hook] Request was aborted');
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.log('💥 [Hook] Error caught:', errorMessage);
      setError(errorMessage);
      setMetrics(null);
      setCached(false);
      setQueryTime(0);
    } finally {
      console.log('🏁 [Hook] Request completed');
      setIsLoading(false);
      forceRefreshRef.current = false;
    }
  }, [
    enabled,
    dateRange.start, 
    dateRange.end, 
    productsFilter, 
    laboratoriesFilter, 
    categoriesFilter, 
    pharmacyFilter,
    error
  ]);

  // Fonction refetch pour actualisation manuelle
  const refetch = useCallback(async (): Promise<void> => {
    console.log('🔄 [Hook] Manual refetch triggered');
    forceRefreshRef.current = true;
    await fetchPriceEvolution(true);
  }, [fetchPriceEvolution]);

  // Effect pour déclencher fetch automatique
  useEffect(() => {
    console.log('🔄 [Hook] useEffect triggered, enabled:', enabled);
    if (enabled) {
      fetchPriceEvolution(forceRefreshRef.current);
    }

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        console.log('🧹 [Hook] Cleanup: aborting request');
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, fetchPriceEvolution]);

  return {
    metrics,
    isLoading,
    error,
    isError: !!error,
    queryTime,
    cached,
    refetch,
    hasData: !!metrics
  };
}