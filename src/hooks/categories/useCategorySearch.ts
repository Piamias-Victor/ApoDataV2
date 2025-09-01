// src/hooks/categories/useCategorySearch.ts
import { useState, useEffect, useCallback } from 'react';
import { useFiltersStore, type SelectedCategory } from '@/stores/useFiltersStore';

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
  readonly getSelectedCategoriesFromStore: () => SelectedCategory[]; // NOUVEAU
}

/**
 * Crée une clé unique pour différencier universe et category
 */
const createCategoryKey = (name: string, type: 'universe' | 'category'): string => {
  return `${type}:${name}`;
};

/**
 * Hook useCategorySearch - VERSION SIMPLIFIÉE AVEC STORE
 * 
 * SIMPLIFICATIONS :
 * - Utilise directement selectedCategories du store
 * - Plus besoin d'API supplémentaire ou de cache
 * - getSelectedCategoriesFromStore() lit juste le store
 * - applyFilters utilise setCategoryFiltersWithNames
 */
export function useCategorySearch(): UseCategorySearchReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('category');
  
  // États locaux pour les sélections en attente
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [categoryProductMap, setCategoryProductMap] = useState<Map<string, string[]>>(new Map());
  const [pendingProductCodes, setPendingProductCodes] = useState<Set<string>>(new Set());
  const [previousStoreCodes, setPreviousStoreCodes] = useState<Set<string>>(new Set());

  // Récupération depuis le store - SIMPLIFIÉ
  const storedCategoryCodes = useFiltersStore(state => state.categories);
  const storedSelectedCategories = useFiltersStore(state => state.selectedCategories);

  // Initialisation avec les codes du store
  useEffect(() => {
    console.log('🔄 [useCategorySearch] Initializing from store:', storedCategoryCodes.length);
    
    const storedCodesSet = new Set(storedCategoryCodes);
    setPendingProductCodes(storedCodesSet);
    setPreviousStoreCodes(storedCodesSet);
  }, []); // Initialisation unique

  // Calculer pendingProductCodes = store + nouveaux sélectionnés
  useEffect(() => {
    const allPendingCodes = new Set(previousStoreCodes);
    
    selectedCategories.forEach(categoryKey => {
      const productCodes = categoryProductMap.get(categoryKey) || [];
      productCodes.forEach(code => allPendingCodes.add(code));
    });
    
    setPendingProductCodes(allPendingCodes);
    console.log('📦 [useCategorySearch] Updated pending codes:', {
      fromStore: previousStoreCodes.size,
      fromNewSelections: allPendingCodes.size - previousStoreCodes.size,
      total: allPendingCodes.size
    });
  }, [selectedCategories, categoryProductMap, previousStoreCodes]);

  // FONCTION SIMPLIFIÉE : Lire directement le store
  const getSelectedCategoriesFromStore = useCallback((): SelectedCategory[] => {
    console.log('📖 [useCategorySearch] Reading selected categories from store:', storedSelectedCategories.length);
    return storedSelectedCategories;
  }, [storedSelectedCategories]);

  // Fonction de recherche avec debounce
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

      // Mettre à jour le mapping category -> product codes
      const newMap = new Map<string, string[]>();
      data.categories.forEach(category => {
        const key = createCategoryKey(category.category_name, category.category_type);
        newMap.set(key, category.product_codes);
      });
      setCategoryProductMap(newMap);

    } catch (err) {
      console.error('❌ Erreur recherche catégories:', err);
      setError('Erreur lors de la recherche');
      setCategories([]);
      setCategoryProductMap(new Map());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effet de debounce pour la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery, searchMode);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchMode, performSearch]);

  // Reset des résultats quand la requête est trop courte
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setCategories([]);
      setCategoryProductMap(new Map());
      setIsLoading(false);
      setError(null);
    }
  }, [searchQuery]);

  // Clear des résultats quand le mode change
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      setCategories([]);
      setCategoryProductMap(new Map());
      setIsLoading(true);
    }
  }, [searchMode]);

  // Toggle category pour nouvelles sélections
  const toggleCategory = useCallback((categoryKey: string, productCodes: string[]) => {
    console.log('🔄 [useCategorySearch] Toggle category:', categoryKey);
    
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

    setCategoryProductMap(prev => {
      const newMap = new Map(prev);
      newMap.set(categoryKey, productCodes);
      return newMap;
    });
  }, []);

  const clearSelection = useCallback(() => {
    console.log('🗑️ [useCategorySearch] Clear new selections only');
    setSelectedCategories(new Set());
    setPendingProductCodes(previousStoreCodes);
  }, [previousStoreCodes]);

  // FONCTION MODIFIÉE : Utilise setCategoryFiltersWithNames
  const applyFilters = useCallback(() => {
    console.log('✅ [useCategorySearch] Applying filters to store with names');
    
    // Construire la liste des catégories avec leurs infos
    const newCategoriesInfo: SelectedCategory[] = [];
    const allProductCodes: string[] = [];

    // Ajouter les catégories déjà dans le store (persistance)
    storedSelectedCategories.forEach(cat => {
      newCategoriesInfo.push(cat);
      allProductCodes.push(...cat.productCodes);
    });

    // Ajouter les nouvelles catégories sélectionnées
    selectedCategories.forEach(categoryKey => {
      const productCodes = categoryProductMap.get(categoryKey) || [];
      const categoryInfo = categories.find(cat => {
        const key = createCategoryKey(cat.category_name, cat.category_type);
        return key === categoryKey;
      });
      
      if (categoryInfo && !newCategoriesInfo.some(existing => 
        existing.name === categoryInfo.category_name && existing.type === categoryInfo.category_type
      )) {
        newCategoriesInfo.push({
          name: categoryInfo.category_name,
          type: categoryInfo.category_type,
          productCodes: productCodes,
          productCount: categoryInfo.product_count
        });
        allProductCodes.push(...productCodes);
      }
    });

    // Mettre à jour le store avec codes ET noms
    const setCategoryFiltersWithNames = useFiltersStore.getState().setCategoryFiltersWithNames;
    setCategoryFiltersWithNames(allProductCodes, newCategoriesInfo);
    
    console.log('📊 Applied categories to store:', {
      totalCategories: newCategoriesInfo.length,
      totalCodes: allProductCodes.length,
      names: newCategoriesInfo.map(cat => `${cat.type}:${cat.name}`)
    });

    // Reset des nouvelles sélections
    setSelectedCategories(new Set());
    setPreviousStoreCodes(new Set(allProductCodes));
  }, [selectedCategories, categoryProductMap, categories, storedSelectedCategories]);

  const clearCategoryFilters = useCallback(() => {
    console.log('🗑️ [useCategorySearch] Clear ALL category filters');
    const clearCategoryFilters = useFiltersStore.getState().clearCategoryFilters;
    clearCategoryFilters(); // Clear à la fois codes ET noms dans le store
    
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
    getSelectedCategoriesFromStore, // Version simplifiée
  };
}