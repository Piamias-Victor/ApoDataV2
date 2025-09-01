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
 * Hook useCategorySearch - AVEC PENDING STATE ET CUMUL
 * 
 * CORRECTIONS :
 * - pendingProductCodes initialisé avec les codes du store (cumul)
 * - toggleCategory cumule avec les sélections existantes
 * - applyFilters fusionne pending + store
 * - Persistance visuelle des sélections précédentes
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

  // État pour tracker les codes du store (pour persistance visuelle)
  const [previousStoreCodes, setPreviousStoreCodes] = useState<Set<string>>(new Set());

  // Récupération des codes catégories appliqués depuis le store
  const storedCategoryCodes = useFiltersStore(state => state.categories);

  // CORRECTION : Initialisation avec les codes du store pour cumul
  useEffect(() => {
    console.log('🔄 [useCategorySearch] Initializing from store:', storedCategoryCodes);
    
    const storedCodesSet = new Set(storedCategoryCodes);
    setPendingProductCodes(storedCodesSet);
    setPreviousStoreCodes(storedCodesSet);
    
    console.log('🟢 [useCategorySearch] Initialized pending with store codes:', Array.from(storedCodesSet));
  }, []); // Volontairement vide pour initialiser UNE SEULE FOIS

  // CORRECTION : Calculer pendingProductCodes = store + nouveaux sélectionnés
  useEffect(() => {
    const allPendingCodes = new Set(previousStoreCodes);
    
    // Ajouter les codes des catégories nouvellement sélectionnées
    selectedCategories.forEach(categoryKey => {
      const productCodes = categoryProductMap.get(categoryKey) || [];
      productCodes.forEach(code => allPendingCodes.add(code));
    });
    
    setPendingProductCodes(allPendingCodes);
    console.log('📦 [useCategorySearch] Updated pending product codes:', {
      fromStore: previousStoreCodes.size,
      fromNewSelections: allPendingCodes.size - previousStoreCodes.size,
      total: allPendingCodes.size
    });
  }, [selectedCategories, categoryProductMap, previousStoreCodes]);

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

  // CORRECTION : toggleCategory pour nouvelles sélections seulement
  const toggleCategory = useCallback((categoryKey: string, productCodes: string[]) => {
    console.log('🔄 [useCategorySearch] Toggle category (new selection):', categoryKey);
    
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
        console.log('➖ Removed from new selections:', categoryKey);
      } else {
        newSet.add(categoryKey);
        console.log('➕ Added to new selections:', categoryKey);
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
    console.log('🗑️ [useCategorySearch] Clear new selections only');
    setSelectedCategories(new Set());
    // Restaurer seulement les codes du store
    setPendingProductCodes(previousStoreCodes);
  }, [previousStoreCodes]);

  // CORRECTION : applyFilters fusionne store + pending
  const applyFilters = useCallback(() => {
    console.log('✅ [useCategorySearch] Applying cumulated filters to store');
    console.log('  - Previous store codes:', previousStoreCodes.size);
    console.log('  - New selected categories:', Array.from(selectedCategories));
    console.log('  - Total pending product codes:', Array.from(pendingProductCodes));
    
    const setCategoryFilters = useFiltersStore.getState().setCategoryFilters;
    setCategoryFilters(Array.from(pendingProductCodes));
    
    // Mettre à jour le tracking des codes du store
    setPreviousStoreCodes(pendingProductCodes);
    // Clear les nouvelles sélections car elles sont maintenant dans le store
    setSelectedCategories(new Set());
  }, [selectedCategories, pendingProductCodes]);

  // clearCategoryFilters reset TOUT
  const clearCategoryFilters = useCallback(() => {
    console.log('🗑️ [useCategorySearch] Clear ALL category filters');
    const clearCategoryFilters = useFiltersStore.getState().clearCategoryFilters;
    clearCategoryFilters();
    setSelectedCategories(new Set());
    setPendingProductCodes(new Set());
    setPreviousStoreCodes(new Set());
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