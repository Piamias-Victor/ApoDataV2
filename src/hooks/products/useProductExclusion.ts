// src/hooks/products/useProductExclusion.ts
import { useState, useEffect, useCallback } from 'react';
import { useFiltersStore, type SelectedProduct } from '@/stores/useFiltersStore';

export interface Product {
  readonly code_13_ref: string;
  readonly name: string;
  readonly brand_lab?: string;
  readonly universe?: string;
}

interface SearchResponse {
  readonly products: Product[];
  readonly count: number;
  readonly queryTime: number;
  readonly searchType?: 'keywords' | 'code_start' | 'code_end';
}

interface BulkSearchResponse {
  readonly found: Product[];
  readonly notFound: string[];
  readonly totalSearched: number;
  readonly queryTime: number;
}

interface UseProductExclusionReturn {
  readonly products: Product[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
  readonly selectedProducts: Set<string>;
  readonly toggleProduct: (code: string) => void;
  readonly clearSelection: () => void;
  readonly applyExclusions: () => void;
  readonly clearExclusions: () => void;
  readonly pendingProductCodes: Set<string>;
  readonly getExcludedProductsFromStore: () => SelectedProduct[];

  // Fonctions bulk
  readonly bulkSearchProducts: (codes: string[]) => Promise<BulkSearchResponse>;
  readonly isBulkSearching: boolean;
  readonly bulkSelectProducts: (products: Product[]) => void;
}

/**
 * Hook useProductExclusion - VERSION EXCLUSION
 * 
 * Identique à useProductSearch mais pour les exclusions
 * Utilise les mêmes APIs, même logique, mais stocke dans excludedProducts
 */
export function useProductExclusion(): UseProductExclusionReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBulkSearching, setIsBulkSearching] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [pendingProductCodes, setPendingProductCodes] = useState<Set<string>>(new Set());
  const [previousStoreCodes, setPreviousStoreCodes] = useState<Set<string>>(new Set());

  // 🔥 DIFFÉRENCE : Accès aux exclusions au lieu des produits normaux
  const storedExcludedCodes = useFiltersStore(state => state.excludedProducts);
  const storedExcludedProducts = useFiltersStore(state => state.selectedExcludedProducts);
  const setExcludedProductsWithNames = useFiltersStore(state => state.setExcludedProductsWithNames);
  const clearExcludedProducts = useFiltersStore(state => state.clearExcludedProducts);

  // Initialisation depuis le store
  useEffect(() => {
    console.log('🔄 [useProductExclusion] Initializing from store:', storedExcludedCodes.length);

    const storedCodesSet = new Set(storedExcludedCodes);
    setPendingProductCodes(storedCodesSet);
    setPreviousStoreCodes(storedCodesSet);
  }, []);

  // Mise à jour des codes pending
  useEffect(() => {
    const allPendingCodes = new Set(previousStoreCodes);

    selectedProducts.forEach(code => {
      allPendingCodes.add(code);
    });

    setPendingProductCodes(allPendingCodes);
    console.log('🚫 [useProductExclusion] Updated pending exclusions:', {
      fromStore: previousStoreCodes.size,
      fromNewSelections: allPendingCodes.size - previousStoreCodes.size,
      total: allPendingCodes.size
    });
  }, [selectedProducts, previousStoreCodes]);

  const getExcludedProductsFromStore = useCallback((): SelectedProduct[] => {
    console.log('📖 [useProductExclusion] Reading excluded products from store:', storedExcludedProducts.length);
    return storedExcludedProducts;
  }, [storedExcludedProducts]);

  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    const trimmedQuery = query.trim();
    setIsLoading(true);
    setError(null);

    try {
      const startTime = Date.now();
      const response = await fetch('/api/products/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmedQuery, limit: 100 })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      const queryTime = Date.now() - startTime;

      console.log('✅ [useProductExclusion] Search success:', {
        query: trimmedQuery,
        count: data.count,
        time: `${queryTime}ms`
      });

      setProducts(data.products);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ [useProductExclusion] Search error:', err);
      setError(message);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const toggleProduct = useCallback((code: string) => {
    setSelectedProducts(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(code)) {
        newSelection.delete(code);
        console.log('➖ [useProductExclusion] Removed from selection:', code);
      } else {
        newSelection.add(code);
        console.log('➕ [useProductExclusion] Added to selection:', code);
      }
      return newSelection;
    });
  }, []);

  const clearSelection = useCallback(() => {
    console.log('🗑️ [useProductExclusion] Clearing selection');
    setSelectedProducts(new Set());
  }, []);

  const applyExclusions = useCallback(() => {
    const codesArray = Array.from(pendingProductCodes);

    // 🔥 Construire les infos complètes pour chaque produit exclu
    const productsInfo: SelectedProduct[] = codesArray.map(code => {
      // Chercher dans les produits sélectionnés actuels
      const productFromSearch = products.find(p => p.code_13_ref === code);
      if (productFromSearch) {
        return {
          code,
          name: productFromSearch.name,
          brandLab: productFromSearch.brand_lab,
          universe: productFromSearch.universe
        };
      }

      // Chercher dans le store
      const productFromStore = storedExcludedProducts.find(p => p.code === code);
      if (productFromStore) {
        return productFromStore;
      }

      // Fallback
      return {
        code,
        name: `Produit ${code}`
      };
    });

    console.log('✅ [useProductExclusion] Applying exclusions:', {
      codes: codesArray.length,
      withInfo: productsInfo.length
    });

    setExcludedProductsWithNames(codesArray, productsInfo);
    setPreviousStoreCodes(new Set(codesArray));
    setSelectedProducts(new Set());
  }, [pendingProductCodes, products, storedExcludedProducts, setExcludedProductsWithNames]);

  const clearExclusions = useCallback(() => {
    console.log('🗑️ [useProductExclusion] Clearing all exclusions');
    clearExcludedProducts();
    setSelectedProducts(new Set());
    setPendingProductCodes(new Set());
    setPreviousStoreCodes(new Set());
  }, [clearExcludedProducts]);

  // 🔥 NOUVEAU - Recherche bulk pour import EAN13
  const bulkSearchProducts = useCallback(async (codes: string[]): Promise<BulkSearchResponse> => {
    setIsBulkSearching(true);

    try {
      const startTime = Date.now();
      const response = await fetch('/api/products/bulk-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data: BulkSearchResponse = await response.json();
      const queryTime = Date.now() - startTime;

      console.log('✅ [useProductExclusion] Bulk search success:', {
        searched: codes.length,
        found: data.found.length,
        notFound: data.notFound.length,
        time: `${queryTime}ms`
      });

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ [useProductExclusion] Bulk search error:', err);
      throw new Error(message);
    } finally {
      setIsBulkSearching(false);
    }
  }, []);

  // 🔥 NOUVEAU - Sélection bulk (pour import)
  // 🔥 NOUVEAU - Sélection bulk (pour import)
  const bulkSelectProducts = useCallback((productsToSelect: Product[]) => {
    // 1. Ajouter à la sélection
    setSelectedProducts(prev => {
      const newSelection = new Set(prev);
      productsToSelect.forEach((product: Product) => {
        newSelection.add(product.code_13_ref);
      });
      return newSelection;
    });

    // 2. Ajouter aux produits connus (pour que applyExclusions puisse les retrouver)
    setProducts(prevProducts => {
      const newProducts = [...prevProducts];
      productsToSelect.forEach(newProduct => {
        if (!newProducts.some(p => p.code_13_ref === newProduct.code_13_ref)) {
          newProducts.push(newProduct);
        }
      });
      return newProducts;
    });

    console.log('➕ [useProductExclusion] Bulk selection applied:', {
      count: productsToSelect.length,
      productsUpdated: true
    });
  }, []);

  return {
    products,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedProducts,
    toggleProduct,
    clearSelection,
    applyExclusions,
    clearExclusions,
    pendingProductCodes,
    getExcludedProductsFromStore,
    bulkSearchProducts,
    isBulkSearching,
    bulkSelectProducts
  };
}