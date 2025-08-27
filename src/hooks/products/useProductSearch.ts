// src/hooks/products/useProductSearch.ts
import { useState, useEffect, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';

export interface Product {
  readonly name: string;
  readonly code_13_ref: string;
  readonly brand_lab: string | null;
  readonly universe: string | null;
}

interface SearchResponse {
  readonly products: Product[];
  readonly count: number;
  readonly queryTime: number;
}

interface UseProductSearchReturn {
  readonly products: Product[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
  readonly selectedProducts: Set<string>;
  readonly toggleProduct: (code: string) => void;
  readonly clearSelection: () => void;
  readonly applyFilters: () => void;
  readonly clearProductFilters: () => void;
}

/**
 * Hook useProductSearch - AVEC PENDING STATE
 * 
 * Nouvelles fonctionnalités :
 * - Pending state : sélections locales jusqu'au clic "Appliquer"
 * - toggleProduct modifie seulement l'état local
 * - applyFilters applique les sélections au store
 * - clearProductFilters reset le store ET l'état local
 */
export function useProductSearch(): UseProductSearchReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // PENDING STATE - Sélections locales (non appliquées au store)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Récupération des produits appliqués depuis le store (pour initialisation)
  const storedProducts = useFiltersStore(state => state.products);

  // Initialize selected products from store when component mounts
  useEffect(() => {
    console.log('🔄 [useProductSearch] Initializing from store:', storedProducts);
    setSelectedProducts(new Set(storedProducts));
  }, []); // Volontairement vide pour initialiser UNE SEULE FOIS

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 3) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/products/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      setProducts(data.products);

    } catch (err) {
      console.error('Erreur recherche produits:', err);
      setError('Erreur lors de la recherche');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Reset results when query is too short
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setProducts([]);
      setIsLoading(false);
      setError(null);
    }
  }, [searchQuery]);

  // MODIFIÉ : toggleProduct affecte seulement l'état local (pending)
  const toggleProduct = useCallback((code: string) => {
    console.log('🔄 [useProductSearch] Toggle product (pending):', code);
    
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      console.log('📦 [useProductSearch] New pending selection:', Array.from(newSet));
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    console.log('🗑️ [useProductSearch] Clear pending selection');
    setSelectedProducts(new Set());
  }, []);

  // MODIFIÉ : applyFilters applique les sélections pendantes au store
  const applyFilters = useCallback(() => {
    console.log('✅ [useProductSearch] Applying filters to store:', Array.from(selectedProducts));
    const setProductFilters = useFiltersStore.getState().setProductFilters;
    setProductFilters(Array.from(selectedProducts));
  }, [selectedProducts]);

  // MODIFIÉ : clearProductFilters reset le store ET l'état local
  const clearProductFilters = useCallback(() => {
    console.log('🗑️ [useProductSearch] Clear product filters (store + local)');
    const clearProductFilters = useFiltersStore.getState().clearProductFilters;
    clearProductFilters();
    setSelectedProducts(new Set());
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
    applyFilters,
    clearProductFilters,
  };
}