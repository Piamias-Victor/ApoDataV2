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
  readonly pendingProductCodes: Set<string>;
}

/**
 * Crée une clé unique pour différencier universe et category
 */
const createCategoryKey = (name: string, type: 'universe' | 'category'): string => {
  return `${type}:${name}`;
};

/**
 * Hook useCategorySearch - AVEC PENDING STATE
 * 
 * Nouvelles fonctionnalités :
 * - Pending state pour categories et product codes
 * - toggleCategory modifie seulement les sélections locales
 * - applyFilters applique les product codes accumulés au store
 * - Tracking des codes produits pending pour feedback visuel
 */
export function useCategorySearch(): UseCategorySearchReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('category');
  
  // PENDING STATE - États locaux
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [categoryProductMap, setCategoryProductMap] = useState<Map<string, string[]>>(new Map());
  const [pendingProductCodes, setPendingProductCodes] = useState<Set<string>>(new Set());

  // Récupération des codes catégories appliqués depuis le store (pour initialisation)
  const storedCategoryCodes = useFiltersStore(state => state.categories);

  // Initialize selected categories from store when component mounts
  useEffect(() => {
    console.log('🔄 [useCategorySearch] Initializing from store:', storedCategoryCodes);
    
    // Pour l'initialisation, on assume que tous les codes stockés forment les catégories sélectionnées
    // En mode pending, on les met dans pendingProductCodes
    setPendingProductCodes(new Set(storedCategoryCodes));
    
    // Note: On ne peut pas reconstituer facilement selectedCategories depuis les codes produits
    // car on n'a pas la mapping inverse. C'est une limitation acceptable.
  }, []); // Volontairement vide pour initialiser UNE SEULE FOIS

  // Recalculate pending product codes when selected categories change
  useEffect(() => {
    const allPendingCodes = new Set<string>();
    
    selectedCategories.forEach(categoryKey => {
      const productCodes = categoryProductMap.get(categoryKey) || [];
      productCodes.forEach(code => allPendingCodes.add(code));
    });
    
    setPendingProductCodes(allPendingCodes);
    console.log('📦 [useCategorySearch] Updated pending product codes:', Array.from(allPendingCodes));
  }, [selectedCategories, categoryProductMap]);

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
        body: JSON.stringify({ 
          query: query.trim(),
          mode 
        }),
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

  // MODIFIÉ : toggleCategory affecte seulement l'état local (pending)
  const toggleCategory = useCallback((categoryKey: string, productCodes: string[]) => {
    console.log('🔄 [useCategorySearch] Toggle category (pending):', categoryKey);
    
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
        console.log('➖ Removed category:', categoryKey);
      } else {
        newSet.add(categoryKey);
        console.log('➕ Added category:', categoryKey);
      }
      return newSet;
    });

    // Ensure the mapping is updated
    setCategoryProductMap(prev => {
      const newMap = new Map(prev);
      newMap.set(categoryKey, productCodes);
      return newMap;
    });
  }, []);

  const clearSelection = useCallback(() => {
    console.log('🗑️ [useCategorySearch] Clear pending selection');
    setSelectedCategories(new Set());
    setPendingProductCodes(new Set());
  }, []);

  // MODIFIÉ : applyFilters applique les codes produits accumulés au store
  const applyFilters = useCallback(() => {
    console.log('✅ [useCategorySearch] Applying filters to store');
    console.log('  - Selected categories:', Array.from(selectedCategories));
    console.log('  - Pending product codes:', Array.from(pendingProductCodes));
    
    const setCategoryFilters = useFiltersStore.getState().setCategoryFilters;
    setCategoryFilters(Array.from(pendingProductCodes));
  }, [selectedCategories, pendingProductCodes]);

  // MODIFIÉ : clearCategoryFilters reset le store ET tous les états locaux
  const clearCategoryFilters = useCallback(() => {
    console.log('🗑️ [useCategorySearch] Clear category filters (store + local)');
    const clearCategoryFilters = useFiltersStore.getState().clearCategoryFilters;
    clearCategoryFilters();
    setSelectedCategories(new Set());
    setPendingProductCodes(new Set());
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
    pendingProductCodes,
  };
}