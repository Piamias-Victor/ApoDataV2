// src/hooks/competitive/useComparisonPricing.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import type { ComparisonElement } from '@/types/comparison';

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

interface UseComparisonPricingOptions {
  readonly enabled?: boolean;
  readonly elementA: ComparisonElement | null;
  readonly elementB: ComparisonElement | null;
}

interface UseComparisonPricingReturn {
  readonly productsA: CompetitiveMetrics[];
  readonly productsB: CompetitiveMetrics[];
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
 * Hook useComparisonPricing - Comparaison prix A vs B via API competitive-analysis
 * 
 * Fonctionnalités :
 * - 2 requêtes parallèles vers /api/competitive-analysis
 * - Mapping automatique ComparisonElement vers productCodes
 * - Utilise dates du store filters (analysisDateRange)
 * - États loading/error cohérents
 * - Abort controller pour cleanup
 * - Performance optimisée avec useCallback
 */
export function useComparisonPricing(
  options: UseComparisonPricingOptions
): UseComparisonPricingReturn {
  const { 
    enabled = true, 
    elementA,
    elementB
  } = options;

  // Récupération des dates depuis le store filters
  const analysisDateRange = useFiltersStore(state => state.analysisDateRange);
  const pharmacyFilter = useFiltersStore(state => state.pharmacy);

  // États
  const [productsA, setProductsA] = useState<CompetitiveMetrics[]>([]);
  const [productsB, setProductsB] = useState<CompetitiveMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryTimeA, setQueryTimeA] = useState(0);
  const [queryTimeB, setQueryTimeB] = useState(0);

  // Refs pour abort controller
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');

  // Fonction pour mapper ComparisonElement vers productCodes
  const mapElementToProductCodes = useCallback((element: ComparisonElement | null): string[] => {
    if (!element) return [];

    switch (element.type) {
      case 'product':
        // Pour les produits, utiliser l'ID directement (code_13_ref)
        return [element.id];
      
      case 'laboratory':
      case 'category':
        // Pour laboratoires/catégories, utiliser tous les codes produits
        return element.metadata.product_codes || [];
      
      default:
        return [];
    }
  }, []);

  // Fonction fetch pour un élément spécifique
  const fetchElementPricing = useCallback(async (
    element: ComparisonElement | null,
    signal: AbortSignal
  ): Promise<CompetitiveMetrics[]> => {
    if (!element) return [];

    const productCodes = mapElementToProductCodes(element);
    
    if (productCodes.length === 0) {
      console.warn('Aucun code produit trouvé pour l\'élément:', element.name);
      return [];
    }

    const requestBody: CompetitiveAnalysisRequest = {
      dateRange: analysisDateRange,
      productCodes,
      laboratoryCodes: [],
      categoryCodes: [],
      ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
    };

    console.log(`📡 [Hook] Fetching pricing for element ${element.name}:`, {
      element: element.name,
      type: element.type,
      productCodesCount: productCodes.length,
      productCodesSample: productCodes.slice(0, 5),
      dateRange: analysisDateRange,
      pharmacyFilter,
      requestBody
    });

    const response = await fetch('/api/competitive-analysis', {
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

    const data: CompetitiveAnalysisResponse = await response.json();
    
    console.log(`[Hook] API Response for ${element.name}:`, {
      element: element.name,
      totalProducts: data.products.length,
      sampleProducts: data.products.slice(0, 3).map(p => ({
        name: p.product_name,
        prix_vente_moyen_selection: p.prix_vente_moyen_selection,
        taux_marge_moyen_selection: p.taux_marge_moyen_selection,
        ecart_prix_vs_marche_pct: p.ecart_prix_vs_marche_pct
      })),
      productsWithSales: data.products.filter(p => p.prix_vente_moyen_selection > 0).length,
      productsWithMargin: data.products.filter(p => p.taux_marge_moyen_selection > 0).length
    });
    
    return data.products || [];
  }, [analysisDateRange, pharmacyFilter, mapElementToProductCodes]);

  // Fonction fetch principale
  const fetchComparisonPricing = useCallback(async (): Promise<void> => {
    if (!enabled) {
      console.log('❌ [Hook] Hook disabled');
      return;
    }

    // Validation dates obligatoires
    if (!analysisDateRange.start || !analysisDateRange.end) {
      console.log('❌ [Hook] Missing date range');
      setError('Veuillez sélectionner une plage de dates dans les filtres');
      setProductsA([]);
      setProductsB([]);
      return;
    }

    // Validation éléments
    if (!elementA && !elementB) {
      console.log('❌ [Hook] No elements to compare');
      setProductsA([]);
      setProductsB([]);
      setError(null);
      return;
    }

    // Génération clé de requête pour éviter duplicatas
    const requestKey = JSON.stringify({
      elementA: elementA?.id || null,
      elementB: elementB?.id || null,
      dateRange: analysisDateRange,
      pharmacyFilter
    });

    if (requestKey === lastRequestRef.current && !error) {
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

    console.log('⏳ [Hook] Starting pricing comparison...');
    setIsLoading(true);
    setError(null);

    try {
      const startTime = Date.now();

      // Requêtes parallèles pour A et B
      const [resultA, resultB] = await Promise.all([
        fetchElementPricing(elementA, abortControllerRef.current.signal),
        fetchElementPricing(elementB, abortControllerRef.current.signal)
      ]);

      const endTime = Date.now();
      const totalQueryTime = endTime - startTime;

      console.log('✅ [Hook] Pricing comparison completed:', {
        productsA: resultA.length,
        productsB: resultB.length,
        queryTime: totalQueryTime
      });

      setProductsA(resultA);
      setProductsB(resultB);
      setQueryTimeA(totalQueryTime / 2); // Approximation pour chaque élément
      setQueryTimeB(totalQueryTime / 2);
      setError(null);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('⏹️ [Hook] Request was aborted');
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('💥 [Hook] Pricing comparison error:', errorMessage);
      setError(errorMessage);
      setProductsA([]);
      setProductsB([]);
    } finally {
      console.log('🏁 [Hook] Pricing comparison finished');
      setIsLoading(false);
    }
  }, [
    enabled,
    elementA,
    elementB,
    analysisDateRange,
    pharmacyFilter,
    fetchElementPricing,
    error
  ]);

  // Fonction refetch pour actualisation manuelle
  const refetch = useCallback(async (): Promise<void> => {
    console.log('🔄 [Hook] Manual pricing refetch triggered');
    lastRequestRef.current = ''; // Force refresh
    await fetchComparisonPricing();
  }, [fetchComparisonPricing]);

  // Effect pour déclencher fetch automatique
  useEffect(() => {
    console.log('🔄 [Hook] useEffect triggered, enabled:', enabled);
    fetchComparisonPricing();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        console.log('🧹 [Hook] Cleanup: aborting request');
        abortControllerRef.current.abort();
      }
    };
  }, [fetchComparisonPricing]);

  return {
    productsA,
    productsB,
    isLoading,
    error,
    isError: !!error,
    queryTimeA,
    queryTimeB,
    refetch,
    hasDataA: productsA.length > 0,
    hasDataB: productsB.length > 0
  };
}