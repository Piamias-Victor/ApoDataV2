// src/hooks/dashboard/useComparisonKpis.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import type { ComparisonElement } from '@/types/comparison';

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
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseComparisonKpisOptions {
  readonly enabled?: boolean;
  readonly elementA: ComparisonElement | null;
  readonly elementB: ComparisonElement | null;
}

interface UseComparisonKpisReturn {
  readonly dataA: KpiMetricsResponse | null;
  readonly dataB: KpiMetricsResponse | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTimeA: number;
  readonly queryTimeB: number;
  readonly refetch: () => Promise<void>;
  readonly hasDataA: boolean;
  readonly hasDataB: boolean;
}

/**
 * Hook useComparisonKpis - Comparaison KPI A vs B
 * 
 * Fonctionnalités :
 * - 2 requêtes parallèles vers /api/kpis
 * - Mapping automatique ComparisonElement vers filtres API
 * - Utilise dates du store filters (analysisDateRange)
 * - États loading/error cohérents
 * - Abort controller pour cleanup
 * - Performance optimisée avec useCallback
 */
export function useComparisonKpis(
  options: UseComparisonKpisOptions
): UseComparisonKpisReturn {
  const { 
    enabled = true, 
    elementA,
    elementB
  } = options;

  // Récupération des dates depuis le store filters
  const analysisDateRange = useFiltersStore(state => state.analysisDateRange);
  const pharmacyFilter = useFiltersStore(state => state.pharmacy);

  // États
  const [dataA, setDataA] = useState<KpiMetricsResponse | null>(null);
  const [dataB, setDataB] = useState<KpiMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryTimeA, setQueryTimeA] = useState(0);
  const [queryTimeB, setQueryTimeB] = useState(0);

  // Refs pour abort controller
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');

  // Fonction pour mapper ComparisonElement vers filtres API
  const mapElementToFilters = useCallback((element: ComparisonElement | null) => {
    if (!element) return {};

    switch (element.type) {
      case 'product':
        // Pour les produits, utiliser le code_13_ref directement
        return { productCodes: [element.id] };
      
      case 'laboratory':
        // Pour les laboratoires, utiliser TOUS les codes produits du laboratoire
        return { productCodes: element.metadata.product_codes || [] };
      
      case 'category':
        // Pour les catégories, utiliser TOUS les codes produits de la catégorie
        return { productCodes: element.metadata.product_codes || [] };
      
      default:
        return {};
    }
  }, []);

  // Fonction fetch KPI pour un élément
  const fetchElementKpis = useCallback(async (
    element: ComparisonElement | null,
    signal: AbortSignal
  ): Promise<KpiMetricsResponse | null> => {
    if (!element) return null;

    const elementFilters = mapElementToFilters(element);
    
    const requestBody = {
      dateRange: analysisDateRange,
      ...elementFilters,
      ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
    };

    console.log(`📡 [Hook] Fetching KPIs for element ${element.name}:`, {
      element: element.name,
      type: element.type,
      dateRange: analysisDateRange,
      filters: elementFilters
    });

    const response = await fetch('/api/kpis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }, [analysisDateRange, pharmacyFilter, mapElementToFilters]);

  // Fonction fetch principale
  const fetchComparisonKpis = useCallback(async (): Promise<void> => {
    if (!enabled) {
      console.log('❌ [Hook] Hook disabled, stopping');
      return;
    }

    // Validation : au moins un élément requis
    if (!elementA && !elementB) {
      console.log('❌ [Hook] No elements to compare');
      setDataA(null);
      setDataB(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Validation dates
    if (!analysisDateRange.start || !analysisDateRange.end) {
      console.log('❌ [Hook] Missing analysis date range');
      setError('Veuillez sélectionner une plage de dates dans les filtres');
      setIsLoading(false);
      return;
    }

    // Vérifier si requête identique
    const requestKey = JSON.stringify({
      elementA: elementA?.id,
      elementB: elementB?.id,
      dateRange: analysisDateRange,
      pharmacy: pharmacyFilter
    });

    if (requestKey === lastRequestRef.current) {
      console.log('🔄 [Hook] Request identical, skipping');
      return;
    }

    // Annuler requête précédente
    if (abortControllerRef.current) {
      console.log('⛔ [Hook] Aborting previous request');
      abortControllerRef.current.abort();
    }

    console.log('🚀 [Hook] Starting comparison KPIs fetch', {
      elementA: elementA?.name,
      elementB: elementB?.name,
      dateRange: analysisDateRange
    });

    abortControllerRef.current = new AbortController();
    lastRequestRef.current = requestKey;

    setIsLoading(true);
    setError(null);

    try {
      const startTime = Date.now();

      // Lancer les 2 requêtes en parallèle
      const [resultA, resultB] = await Promise.all([
        fetchElementKpis(elementA, abortControllerRef.current.signal),
        fetchElementKpis(elementB, abortControllerRef.current.signal)
      ]);

      const totalTime = Date.now() - startTime;

      console.log('✅ [Hook] Comparison KPIs fetched successfully', {
        elementA: elementA?.name,
        elementB: elementB?.name,
        dataA: resultA ? {
          ca_ttc: resultA.ca_ttc,
          montant_marge: resultA.montant_marge,
          nb_references: resultA.nb_references_produits
        } : null,
        dataB: resultB ? {
          ca_ttc: resultB.ca_ttc,
          montant_marge: resultB.montant_marge,
          nb_references: resultB.nb_references_produits
        } : null,
        totalTime
      });

      setDataA(resultA);
      setDataB(resultB);
      setQueryTimeA(resultA?.queryTime || 0);
      setQueryTimeB(resultB?.queryTime || 0);
      setError(null);

    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.log('⛔ [Hook] Request aborted');
          return;
        }
        
        console.error('❌ [Hook] Comparison KPIs fetch failed:', err.message);
        setError(err.message);
      } else {
        console.error('❌ [Hook] Unknown error:', err);
        setError('Erreur inattendue lors du chargement des KPI de comparaison');
      }
      
      setDataA(null);
      setDataB(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    elementA?.id,
    elementB?.id,
    analysisDateRange.start,
    analysisDateRange.end,
    JSON.stringify(pharmacyFilter),
    fetchElementKpis
  ]);

  // Fonction refetch publique
  const refetch = useCallback(async (): Promise<void> => {
    console.log('🔄 [Hook] Manual refetch triggered');
    lastRequestRef.current = ''; // Force refresh
    await fetchComparisonKpis();
  }, [fetchComparisonKpis]);

  // Effet pour déclencher le fetch automatique
  useEffect(() => {
    if (enabled) {
      console.log('🎯 [Hook] Auto-fetch triggered by dependency change', {
        elementA: elementA?.name,
        elementB: elementB?.name,
        dateRange: analysisDateRange
      });
      fetchComparisonKpis();
    }
  }, [
    enabled,
    elementA?.id,
    elementB?.id,
    analysisDateRange.start,
    analysisDateRange.end,
    JSON.stringify(pharmacyFilter),
    fetchComparisonKpis
  ]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        console.log('🧹 [Hook] Cleanup: aborting request');
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
    hasDataB: !!dataB
  };
}