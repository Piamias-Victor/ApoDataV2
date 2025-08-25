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
 * Hook useProductSearch - Recherche produits avec debounce
 * 
 * Gère la recherche intelligente avec :
 * - Debounce 300ms
 * - États loading/error
 * - Sélection multiple avec Set
 * - Minimum 3 caractères
 */
export function useProductSearch(): UseProductSearchReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get stored selected products from Zustand
  const storedProducts = useFiltersStore(state => state.products);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(storedProducts)
  );

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

  const toggleProduct = useCallback((code: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProducts(new Set());
  }, []);

  const applyFilters = useCallback(() => {
    const setProductFilters = useFiltersStore.getState().setProductFilters;
    setProductFilters(Array.from(selectedProducts));
  }, [selectedProducts]);

  const clearProductFilters = useCallback(() => {
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