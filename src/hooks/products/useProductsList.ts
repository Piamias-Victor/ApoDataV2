// src/hooks/products/useProductsList.ts
import { useState, useEffect, useRef, useCallback } from 'react';
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
 * Hook useProductsList - Liste produits avec métriques pharmaceutiques
 * 
 * Features :
 * - Cache intelligent Upstash (12h)
 * - Fusion automatique des filtres (produits + labos + catégories)
 * - Sécurité RBAC intégrée (auto-filtrage pharmacie)
 * - Performance <200ms target avec cache
 * - Métriques avancées : marges, stock, CA, évolutions
 * - Top 1000 produits par quantité vendue
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

  // Récupération des filtres depuis le store Zustand
  const dateRange = useFiltersStore((state) => state.analysisDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Fonction de fetch stable avec useCallback
  const fetchProducts = useCallback(async (): Promise<void> => {
    console.log('🚀 [Hook] fetchProducts called');
    
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
      console.log('❌ [Hook] Missing date range, stopping');
      setProducts([]);
      setError('Filtres requis : dates (début et fin)');
      return;
    }

    // Si aucun produit/labo/catégorie sélectionné, on fait la requête quand même (tous les produits)
    // const hasProductsFilter = productsFilter.length > 0 || 
    //                          laboratoriesFilter.length > 0 || 
    //                          categoriesFilter.length > 0;

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
    
    // Éviter les requêtes duplicatas
    if (requestKey === lastRequestRef.current && !error) {
      console.log('🔄 [Hook] Same request as last time, skipping');
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
      const response = await fetch('/api/products/list', {
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

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('⏹️ [Hook] Request was aborted');
        return; // Requête annulée, ne pas mettre à jour l'état
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.log('💥 [Hook] Error caught:', errorMessage);
      setError(errorMessage);
      setProducts([]);
    } finally {
      console.log('🏁 [Hook] Request completed');
      setIsLoading(false);
    }
  }, [
    dateRange.start, 
    dateRange.end, 
    productsFilter, 
    laboratoriesFilter, 
    categoriesFilter, 
    pharmacyFilter,
    error // Inclus pour permettre retry
  ]);

  // Effect pour déclencher le fetch automatiquement
  useEffect(() => {
    console.log('🔄 [Hook] useEffect triggered, enabled:', enabled);
    if (enabled) {
      fetchProducts();
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
    products,
    isLoading,
    error,
    isError: !!error,
    queryTime,
    cached,
    count: products.length,
    refetch: fetchProducts,
    hasData: products.length > 0
  };
}

/**
 * Hook utilitaire pour formater les métriques produits
 */
export function useFormattedProductMetrics(product: ProductMetrics) {
  return {
    // Prix formatés
    sellPriceTTC: new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(product.avg_sell_price_ttc || 0),

    sellPriceHT: new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(product.avg_sell_price_ht || 0),

    buyPriceHT: new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(product.avg_buy_price_ht || 0),

    // CA et marges
    caTTC: new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(product.ca_ttc || 0),

    totalMarginHT: new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(product.total_margin_ht || 0),

    marginRate: `${Number(product.margin_rate_percent || 0).toFixed(1)}%`,

    // Quantités
    quantitySold: new Intl.NumberFormat('fr-FR').format(product.quantity_sold || 0),
    quantityBought: new Intl.NumberFormat('fr-FR').format(product.quantity_bought || 0),
    currentStock: new Intl.NumberFormat('fr-FR').format(product.current_stock || 0),

    // TVA
    tvaRate: `${Number(product.tva_rate || 0).toFixed(1)}%`,

    // Status marges (pour indicateurs visuels)
    marginStatus: Number(product.margin_rate_percent || 0) >= 30 ? 'high' as const : 
                 Number(product.margin_rate_percent || 0) >= 15 ? 'medium' as const : 'low' as const
  };
}

/**
 * Hook pour statistiques globales de la liste
 */
export function useProductsListStats(products: ProductMetrics[]) {
  if (products.length === 0) {
    return {
      totalCA: 0,
      totalMargin: 0,
      avgMarginRate: 0,
      totalQuantitySold: 0,
      totalStock: 0
    };
  }

  const totalCA = products.reduce((sum, p) => sum + p.ca_ttc, 0);
  const totalMargin = products.reduce((sum, p) => sum + p.total_margin_ht, 0);
  const totalQuantitySold = products.reduce((sum, p) => sum + p.quantity_sold, 0);
  const totalStock = products.reduce((sum, p) => sum + p.current_stock, 0);
  
  const validMargins = products.filter(p => p.margin_rate_percent > 0);
  const avgMarginRate = validMargins.length > 0
    ? validMargins.reduce((sum, p) => sum + p.margin_rate_percent, 0) / validMargins.length
    : 0;

  return {
    totalCA,
    totalMargin,
    avgMarginRate,
    totalQuantitySold,
    totalStock
  };
}