// src/hooks/products/useProductsList.ts - VERSION CORRIGÉE PAGINATION
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';

interface ProductMetrics {
  readonly product_name: string;
  readonly code_ean: string;
  readonly avg_sell_price_ttc: number;
  readonly avg_buy_price_ht: number;
  readonly tva_rate: number;
  readonly avg_sell_price_ht: number;
  readonly margin_rate_percent: number;
  readonly unit_margin_ht: number;
  readonly total_margin_ht: number;
  readonly current_stock: number;
  readonly quantity_sold: number;
  readonly ca_ttc: number;
  readonly quantity_bought: number;
  readonly purchase_amount: number;
}

interface ProductsListResponse {
  readonly products: ProductMetrics[];
  readonly count: number;
  readonly queryTime: number;
  readonly cached: boolean;
}

interface ProductsListRequest {
  readonly dateRange: {
    readonly start: string;
    readonly end: string;
  };
  readonly productCodes: string[];
  readonly laboratoryCodes: string[];
  readonly categoryCodes: string[];
  readonly pharmacyIds?: string[] | undefined;
}

interface UseProductsListOptions {
  readonly enabled?: boolean;
}

interface UseProductsListReturn {
  readonly products: ProductMetrics[];
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
 * Hook useProductsList - CORRIGÉ pour pagination stable
 * 
 * Corrections :
 * - Dépendances useCallback stabilisées avec JSON.stringify
 * - Suppression de 'error' des dépendances qui causait les re-renders
 * - Produits mémorisés pour référence stable
 */
export function useProductsList(
  options: UseProductsListOptions = {}
): UseProductsListReturn {
  const { enabled = true } = options;
  
  const [products, setProducts] = useState<ProductMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryTime, setQueryTime] = useState(0);
  const [cached, setCached] = useState(false);
  
  // Refs pour éviter les boucles infinies
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');
  const forceRefreshRef = useRef(false);

  // Récupération des filtres depuis le store Zustand
  const dateRange = useFiltersStore((state) => state.analysisDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Mémorisation stable des filtres arrays pour éviter re-renders
  const stableFilters = useMemo(() => ({
    products: JSON.stringify(productsFilter),
    laboratories: JSON.stringify(laboratoriesFilter),
    categories: JSON.stringify(categoriesFilter),
    pharmacies: JSON.stringify(pharmacyFilter)
  }), [
    JSON.stringify(productsFilter),
    JSON.stringify(laboratoriesFilter), 
    JSON.stringify(categoriesFilter),
    JSON.stringify(pharmacyFilter)
  ]);

  // Fonction de fetch stable avec useCallback CORRIGÉ
  const fetchProducts = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    console.log('🚀 [Hook] fetchProducts called', { forceRefresh, enabled });
    
    if (!enabled) {
      console.log('❌ [Hook] Hook disabled, stopping');
      return;
    }
    
    // Validation des filtres requis - seulement les dates sont obligatoires
    const hasDateRange = dateRange.start && dateRange.end;
    
    console.log('📅 [Hook] Date validation:', {
      start: dateRange.start,
      end: dateRange.end,
      hasDateRange
    });
    
    console.log('📦 [Hook] Products filters:', {
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

    // Préparation de la requête
    const requestBody: ProductsListRequest = {
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
    
    // Éviter les requêtes duplicatas SAUF si forceRefresh
    if (!forceRefresh && requestKey === lastRequestRef.current && !error) {
      console.log('🔄 [Hook] Same request as last time and no error, skipping');
      return;
    }

    // Annuler la requête précédente
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
      // Ajouter timestamp pour forcer contournement cache
      const url = forceRefresh 
        ? `/api/products/list?refresh=${Date.now()}`
        : '/api/products/list';

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

      const data: ProductsListResponse = await response.json();
      
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
        return; // Requête annulée, ne pas mettre à jour l'état
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
    stableFilters.products,
    stableFilters.laboratories,
    stableFilters.categories,
    stableFilters.pharmacies
    // CORRIGÉ: Suppression de 'error' qui causait les re-renders constants
    // CORRIGÉ: Utilisation de stableFilters au lieu des arrays directement
  ]);

  // Fonction refetch pour forcer l'actualisation
  const refetch = useCallback(async (): Promise<void> => {
    console.log('🔄 [Hook] Manual refetch triggered');
    forceRefreshRef.current = true;
    await fetchProducts(true);
  }, [fetchProducts]);

  // Mémorisation stable des produits pour éviter re-renders du tableau
  const stableProducts = useMemo(() => {
    console.log('📝 [Hook] Memoizing products:', products.length);
    return products;
  }, [JSON.stringify(products.map(p => `${p.code_ean}-${p.product_name}`))]);

  // Effect pour déclencher le fetch automatiquement
  useEffect(() => {
    console.log('🔄 [Hook] useEffect triggered, enabled:', enabled);
    if (enabled) {
      fetchProducts(forceRefreshRef.current);
    }

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        console.log('🧹 [Hook] Cleanup: aborting request');
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, fetchProducts]);

  return {
    products: stableProducts, // CORRIGÉ: Utilise la version mémorisée
    isLoading,
    error,
    isError: !!error,
    queryTime,
    cached,
    count: stableProducts.length, // CORRIGÉ: Cohérent avec products
    refetch,
    hasData: stableProducts.length > 0 // CORRIGÉ: Cohérent avec products
  };
}