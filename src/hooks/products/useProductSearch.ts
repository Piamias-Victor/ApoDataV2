// src/hooks/products/useProductSearch.ts
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
  readonly pendingProductCodes: Set<string>;
  readonly getSelectedProductsFromStore: () => SelectedProduct[]; // NOUVEAU
}

/**
 * Hook useProductSearch - VERSION SIMPLIFIÉE AVEC STORE
 * 
 * SIMPLIFICATIONS :
 * - Utilise directement selectedProducts du store
 * - getSelectedProductsFromStore() lit juste le store
 * - applyFilters utilise setProductFiltersWithNames
 */
export function useProductSearch(): UseProductSearchReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // États locaux pour les sélections en attente
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [pendingProductCodes, setPendingProductCodes] = useState<Set<string>>(new Set());
  const [previousStoreCodes, setPreviousStoreCodes] = useState<Set<string>>(new Set());

  // Récupération depuis le store - SIMPLIFIÉ
  const storedProductCodes = useFiltersStore(state => state.products);
  const storedSelectedProducts = useFiltersStore(state => state.selectedProducts);

  // Initialisation avec les codes du store
  useEffect(() => {
    console.log('🔄 [useProductSearch] Initializing from store:', storedProductCodes.length);
    
    const storedCodesSet = new Set(storedProductCodes);
    setPendingProductCodes(storedCodesSet);
    setPreviousStoreCodes(storedCodesSet);
  }, []); // Initialisation unique

  // Calculer pendingProductCodes = store + nouveaux sélectionnés
  useEffect(() => {
    const allPendingCodes = new Set(previousStoreCodes);
    
    selectedProducts.forEach(code => {
      allPendingCodes.add(code);
    });
    
    setPendingProductCodes(allPendingCodes);
    console.log('📦 [useProductSearch] Updated pending codes:', {
      fromStore: previousStoreCodes.size,
      fromNewSelections: allPendingCodes.size - previousStoreCodes.size,
      total: allPendingCodes.size
    });
  }, [selectedProducts, previousStoreCodes]);

  // FONCTION SIMPLIFIÉE : Lire directement le store
  const getSelectedProductsFromStore = useCallback((): SelectedProduct[] => {
    console.log('📖 [useProductSearch] Reading selected products from store:', storedSelectedProducts.length);
    return storedSelectedProducts;
  }, [storedSelectedProducts]);

  // Fonction de recherche avec debounce
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
        body: JSON.stringify({ 
          query: query.trim()
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      setProducts(data.products);

    } catch (err) {
      console.error('❌ Erreur recherche produits:', err);
      setError('Erreur lors de la recherche');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effet de debounce pour la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Reset des résultats quand la requête est trop courte
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setProducts([]);
      setIsLoading(false);
      setError(null);
    }
  }, [searchQuery]);

  // Toggle product pour nouvelles sélections
  const toggleProduct = useCallback((code: string) => {
    console.log('🔄 [useProductSearch] Toggle product:', code);
    
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(code)) {
        newSet.delete(code);
        console.log('➖ Removed from new selections:', code);
      } else {
        newSet.add(code);
        console.log('➕ Added to new selections:', code);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    console.log('🗑️ [useProductSearch] Clear new selections only');
    setSelectedProducts(new Set());
    setPendingProductCodes(previousStoreCodes);
  }, [previousStoreCodes]);

  // FONCTION MODIFIÉE : Utilise setProductFiltersWithNames
  const applyFilters = useCallback(() => {
    console.log('✅ [useProductSearch] Applying filters to store with names');
    
    // Construire la liste des produits avec leurs infos
    const newProductsInfo: SelectedProduct[] = [];
    const allProductCodes: string[] = [];

    // Ajouter les produits déjà dans le store (persistance)
    storedSelectedProducts.forEach(product => {
      newProductsInfo.push(product);
      allProductCodes.push(product.code);
    });

    // Ajouter les nouveaux produits sélectionnés
    selectedProducts.forEach(code => {
      const productInfo = products.find(product => product.code_13_ref === code);
      
      if (productInfo && !newProductsInfo.some(existing => existing.code === code)) {
        const newProduct: SelectedProduct = {
          name: productInfo.name,
          code: productInfo.code_13_ref,
        };
        
        // Ajouter les propriétés optionnelles seulement si elles existent
        if (productInfo.brand_lab) {
          (newProduct as any).brandLab = productInfo.brand_lab;
        }
        if (productInfo.universe) {
          (newProduct as any).universe = productInfo.universe;
        }
        
        newProductsInfo.push(newProduct);
        allProductCodes.push(code);
      }
    });

    // Mettre à jour le store avec codes ET noms
    const setProductFiltersWithNames = useFiltersStore.getState().setProductFiltersWithNames;
    setProductFiltersWithNames(allProductCodes, newProductsInfo);
    
    console.log('📊 Applied products to store:', {
      totalProducts: newProductsInfo.length,
      totalCodes: allProductCodes.length,
      names: newProductsInfo.map(prod => prod.name).slice(0, 3) // Log premiers noms
    });

    // Reset des nouvelles sélections
    setSelectedProducts(new Set());
    setPreviousStoreCodes(new Set(allProductCodes));
  }, [selectedProducts, products, storedSelectedProducts]);

  const clearProductFilters = useCallback(() => {
    console.log('🗑️ [useProductSearch] Clear ALL product filters');
    const clearProductFilters = useFiltersStore.getState().clearProductFilters;
    clearProductFilters(); // Clear à la fois codes ET noms dans le store
    
    setSelectedProducts(new Set());
    setPendingProductCodes(new Set());
    setPreviousStoreCodes(new Set());
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
    pendingProductCodes,
    getSelectedProductsFromStore, // Version simplifiée
  };
}