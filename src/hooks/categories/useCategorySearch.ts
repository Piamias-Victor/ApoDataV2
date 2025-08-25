// src/hooks/categories/useCategorySearch.ts
import { useState, useEffect, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';

export type SearchMode = 'category' | 'product';

export interface MatchingProduct {
  readonly name: string;
  readonly code_13_ref: string;
}

export interface Category {
  readonly category_name: string;
  readonly category_type: 'universe' | 'category';
  readonly product_count: number;
  readonly product_codes: string[];
  readonly matching_products?: MatchingProduct[];
}

interface SearchResponse {
  readonly categories: Category[];
  readonly count: number;
  readonly queryTime: number;
  readonly mode: SearchMode;
}

interface UseCategorySearchReturn {
  readonly categories: Category[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
  readonly searchMode: SearchMode;
  readonly setSearchMode: (mode: SearchMode) => void;
  readonly selectedCategories: Set<string>;
  readonly toggleCategory: (categoryKey: string, productCodes: string[]) => void;
  readonly clearSelection: () => void;
  readonly applyFilters: () => void;
  readonly clearCategoryFilters: () => void;
}

/**
 * Hook useCategorySearch - Recherche catégories avec mode dual
 * 
 * Modes :
 * - 'category': recherche directe dans universe ET category
 * - 'product': recherche produit → trouve catégories/univers
 * 
 * Gère la recherche intelligente avec :
 * - Debounce 300ms
 * - États loading/error
 * - Sélection par catégorie (tous les produits)
 * - Minimum 3 caractères
 * - Storage des code_13_ref dans le store
 * - Différenciation universe/category avec clés uniques
 */
export function useCategorySearch(): UseCategorySearchReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('category');
  
  // Get stored category product codes from Zustand
  const storedCategoryCodes = useFiltersStore(state => state.categories);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  
  // Map to store category key -> product codes for selection logic
  const [categoryProductMap, setCategoryProductMap] = useState<Map<string, string[]>>(new Map());

  // Create unique key for category (name + type)
  const createCategoryKey = (name: string, type: 'universe' | 'category'): string => {
    return `${type}:${name}`;
  };

  // Initialize selected categories from stored codes
  useEffect(() => {
    if (storedCategoryCodes.length > 0) {
      const storedCodesSet = new Set(storedCategoryCodes);
      
      // Check current categories to see which ones have all their products selected
      const currentlySelected = new Set<string>();
      for (const [categoryKey, productCodes] of categoryProductMap.entries()) {
        const allCodesSelected = productCodes.every(code => storedCodesSet.has(code));
        if (allCodesSelected && productCodes.length > 0) {
          currentlySelected.add(categoryKey);
        }
      }
      
      setSelectedCategories(currentlySelected);
    }
  }, [storedCategoryCodes, categoryProductMap]);

  // Debounced search function
  const performSearch = useCallback(async (query: string, mode: SearchMode) => {
    if (!query || query.trim().length < 3) {
      setCategories([]);
      setCategoryProductMap(new Map());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/categories/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim(), mode }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      setCategories(data.categories);

      // Update category -> product codes mapping
      const newMap = new Map<string, string[]>();
      data.categories.forEach(category => {
        const key = createCategoryKey(category.category_name, category.category_type);
        newMap.set(key, category.product_codes);
      });
      setCategoryProductMap(newMap);

    } catch (err) {
      console.error('Erreur recherche catégories:', err);
      setError('Erreur lors de la recherche');
      setCategories([]);
      setCategoryProductMap(new Map());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery, searchMode);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchMode, performSearch]);

  // Reset results when query is too short
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setCategories([]);
      setCategoryProductMap(new Map());
      setIsLoading(false);
      setError(null);
    }
  }, [searchQuery]);

  // Clear results when mode changes
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      setCategories([]);
      setCategoryProductMap(new Map());
      setIsLoading(true);
    }
  }, [searchMode]);

  const toggleCategory = useCallback((categoryKey: string, productCodes: string[]) => {
    const currentStoredCodes = useFiltersStore.getState().categories;
    const currentStoredSet = new Set(currentStoredCodes);
    
    // Check if this category is currently selected (all its codes are in store)
    const isCurrentlySelected = productCodes.every(code => currentStoredSet.has(code)) && productCodes.length > 0;
    
    let newStoredCodes: string[];
    
    if (isCurrentlySelected) {
      // Remove all codes from this category
      newStoredCodes = currentStoredCodes.filter(code => !productCodes.includes(code));
      setSelectedCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(categoryKey);
        return newSet;
      });
    } else {
      // Add all codes from this category
      const codesToAdd = productCodes.filter(code => !currentStoredSet.has(code));
      newStoredCodes = [...currentStoredCodes, ...codesToAdd];
      setSelectedCategories(prev => {
        const newSet = new Set(prev);
        newSet.add(categoryKey);
        return newSet;
      });
    }
    
    // Update store immediately for real-time UI feedback
    useFiltersStore.getState().setCategoryFilters(newStoredCodes);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCategories(new Set());
    useFiltersStore.getState().clearCategoryFilters();
  }, []);

  const applyFilters = useCallback(() => {
    // Filters are already applied in real-time via toggleCategory
    // This is just for consistency with the drawer interface
  }, []);

  const clearCategoryFilters = useCallback(() => {
    const clearCategoryFilters = useFiltersStore.getState().clearCategoryFilters;
    clearCategoryFilters();
    setSelectedCategories(new Set());
  }, []);

  return {
    categories,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    selectedCategories,
    toggleCategory,
    clearSelection,
    applyFilters,
    clearCategoryFilters,
  };
}