// src/hooks/competitive/useCompetitiveAnalysis.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';

interface CompetitiveMetrics {
  readonly product_name: string;
  readonly code_ean: string;
  readonly prix_vente_min_global: number;
  readonly prix_vente_max_global: number;
  readonly prix_vente_moyen_global: number;
  readonly nb_pharmacies_vendant: number;
  readonly prix_vente_moyen_selection: number;
  readonly prix_achat_moyen_ht: number;
  readonly quantite_vendue_selection: number;
  readonly taux_marge_moyen_selection: number;
  readonly ecart_prix_vs_marche_pct: number;
}

interface CompetitiveAnalysisResponse {
  readonly products: CompetitiveMetrics[];
  readonly count: number;
  readonly queryTime: number;
  readonly cached: boolean;
}

interface CompetitiveAnalysisRequest {
  readonly dateRange: {
    readonly start: string;
    readonly end: string;
  };
  readonly productCodes: string[];
  readonly laboratoryCodes: string[];
  readonly categoryCodes: string[];
  readonly pharmacyIds?: string[] | undefined;
}

interface UseCompetitiveAnalysisOptions {
  readonly enabled?: boolean;
}

interface UseCompetitiveAnalysisReturn {
  readonly products: CompetitiveMetrics[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly count: number;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
}

/**
 * Hook useCompetitiveAnalysis - Analyse concurrentielle pharmaceutique
 * 
 * Logique sécurisée :
 * - Admin SANS pharmacie → mes prix = marché global
 * - Admin AVEC pharmacie(s) → marché exclu sélection
 * - User → marché exclu ma pharmacie
 * 
 * Réutilise logique ProductsList (cache, filtres, performance)
 */
export function useCompetitiveAnalysis(
  options: UseCompetitiveAnalysisOptions = {}
): UseCompetitiveAnalysisReturn {
  const { enabled = true } = options;
  
  const [products, setProducts] = useState<CompetitiveMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryTime, setQueryTime] = useState(0);
  const [cached, setCached] = useState(false);
  
  // Refs pour éviter boucles infinies
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');
  const forceRefreshRef = useRef(false);

  // Filtres du store Zustand - identique useProductsList
  const dateRange = useFiltersStore((state) => state.analysisDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Fonction fetch avec useCallback
  const fetchCompetitiveAnalysis = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    console.log('🚀 [Hook] fetchCompetitiveAnalysis called', { forceRefresh, enabled });
    
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
      setProducts([]);
      setError('Veuillez sélectionner une plage de dates dans les filtres');
      setIsLoading(false);
      return;
    }

    // Préparation requête - identique useProductsList
    const requestBody: CompetitiveAnalysisRequest = {
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
        ? `/api/competitive-analysis?refresh=${Date.now()}`
        : '/api/competitive-analysis';

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

      const data: CompetitiveAnalysisResponse = await response.json();
      
      console.log('✅ [Hook] Success response:', {
        productsCount: data.products.length,
        queryTime: data.queryTime,
        cached: data.cached
      });
      
      setProducts(data.products);
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
      setProducts([]);
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
    await fetchCompetitiveAnalysis(true);
  }, [fetchCompetitiveAnalysis]);

  // Effect pour déclencher fetch automatique
  useEffect(() => {
    console.log('🔄 [Hook] useEffect triggered, enabled:', enabled);
    if (enabled) {
      fetchCompetitiveAnalysis(forceRefreshRef.current);
    }

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        console.log('🧹 [Hook] Cleanup: aborting request');
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, fetchCompetitiveAnalysis]);

  return {
    products,
    isLoading,
    error,
    isError: !!error,
    queryTime,
    cached,
    count: products.length,
    refetch,
    hasData: products.length > 0
  };
}