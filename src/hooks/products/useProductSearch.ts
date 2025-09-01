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
  readonly searchType?: 'keywords' | 'code_start' | 'code_end';
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
  readonly getSelectedProductsFromStore: () => SelectedProduct[];
}

export function useProductSearch(): UseProductSearchReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [pendingProductCodes, setPendingProductCodes] = useState<Set<string>>(new Set());
  const [previousStoreCodes, setPreviousStoreCodes] = useState<Set<string>>(new Set());

  const storedProductCodes = useFiltersStore(state => state.products);
  const storedSelectedProducts = useFiltersStore(state => state.selectedProducts);

  useEffect(() => {
    console.log('🔄 [useProductSearch] Initializing from store:', storedProductCodes.length);
    
    const storedCodesSet = new Set(storedProductCodes);
    setPendingProductCodes(storedCodesSet);
    setPreviousStoreCodes(storedCodesSet);
  }, []);

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

  const getSelectedProductsFromStore = useCallback((): SelectedProduct[] => {
    console.log('📖 [useProductSearch] Reading selected products from store:', storedSelectedProducts.length);
    return storedSelectedProducts;
  }, [storedSelectedProducts]);

  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 [useProductSearch] Starting search:', {
        query: query.trim(),
        length: query.trim().length,
        type: query.startsWith('*') ? 'code_end' : /^\d+$/.test(query) ? 'code_start' : 'keywords'
      });

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
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const data: SearchResponse = await response.json();
      
      console.log('✅ [useProductSearch] Search results:', {
        count: data.count,
        queryTime: data.queryTime,
        searchType: data.searchType,
        firstResult: data.products?.[0]?.name ?? 'N/A',
        allResults: data.products?.map(p => p.name).slice(0, 5) ?? []
      });
      
      setProducts(data.products || []);

      if (data.searchType === 'keywords' && data.products && data.products.length > 0) {
        console.log('🧠 [useProductSearch] Keywords search successful:', {
          query: query.trim(),
          found: `"${data.products[0]?.name ?? 'N/A'}"`,
          total: data.count
        });
      }

      if (data.searchType === 'keywords' && (!data.products || data.products.length === 0)) {
        console.warn('🔍 [useProductSearch] No results for keywords search:', query.trim());
      }

    } catch (err) {
      console.error('❌ [useProductSearch] Search error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setProducts([]);
      setIsLoading(false);
      setError(null);
    }
  }, [searchQuery]);

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

  const applyFilters = useCallback(() => {
    console.log('✅ [useProductSearch] Applying filters to store with names');
    
    const newProductsInfo: SelectedProduct[] = [];
    const allProductCodes: string[] = [];

    storedSelectedProducts.forEach(product => {
      newProductsInfo.push(product);
      allProductCodes.push(product.code);
    });

    selectedProducts.forEach(code => {
      const productInfo = products.find(product => product.code_13_ref === code);
      
      if (productInfo && !newProductsInfo.some(existing => existing.code === code)) {
        const newProduct: SelectedProduct = {
          name: productInfo.name,
          code: productInfo.code_13_ref,
          ...(productInfo.brand_lab && { brandLab: productInfo.brand_lab }),
          ...(productInfo.universe && { universe: productInfo.universe })
        };
        
        newProductsInfo.push(newProduct);
        allProductCodes.push(code);
      }
    });

    const setProductFiltersWithNames = useFiltersStore.getState().setProductFiltersWithNames;
    setProductFiltersWithNames(allProductCodes, newProductsInfo);
    
    console.log('📊 Applied products to store:', {
      totalProducts: newProductsInfo.length,
      totalCodes: allProductCodes.length,
      names: newProductsInfo.map(prod => prod.name).slice(0, 3)
    });

    setSelectedProducts(new Set());
    setPreviousStoreCodes(new Set(allProductCodes));
  }, [selectedProducts, products, storedSelectedProducts]);

  const clearProductFilters = useCallback(() => {
    console.log('🗑️ [useProductSearch] Clear ALL product filters');
    const clearProductFilters = useFiltersStore.getState().clearProductFilters;
    clearProductFilters();
    
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
    getSelectedProductsFromStore,
  };
}