// src/hooks/generic-filters/useGenericFilterSearch.ts
import { useState, useEffect, useCallback } from 'react';

export interface GenericProduct {
  readonly code_13_ref: string;
  readonly name: string;
  readonly bcb_lab: string;
  readonly bcb_generic_status: 'GÉNÉRIQUE' | 'RÉFÉRENT';
  readonly bcb_generic_group: string;
}

export interface GenericLaboratory {
  readonly laboratory_name: string;
  readonly product_count: number;
  readonly generic_count: number;
  readonly referent_count: number;
  readonly product_codes: string[];
}

interface ProductSearchResponse {
  readonly products: GenericProduct[];
  readonly count: number;
  readonly queryTime: number;
}

interface LaboratorySearchResponse {
  readonly laboratories: GenericLaboratory[];
  readonly count: number;
  readonly queryTime: number;
}

interface UseGenericFilterSearchReturn {
  // Products
  readonly products: GenericProduct[];
  readonly isLoadingProducts: boolean;
  readonly errorProducts: string | null;
  readonly productQuery: string;
  readonly setProductQuery: (query: string) => void;
  readonly selectedProducts: Map<string, GenericProduct>;
  readonly toggleProduct: (product: GenericProduct) => void;
  readonly clearProductSelection: () => void;
  
  // Laboratories
  readonly laboratories: GenericLaboratory[];
  readonly isLoadingLaboratories: boolean;
  readonly errorLaboratories: string | null;
  readonly laboratoryQuery: string;
  readonly setLaboratoryQuery: (query: string) => void;
  readonly selectedLaboratories: Map<string, GenericLaboratory>;
  readonly toggleLaboratory: (laboratory: GenericLaboratory) => void;
  readonly clearLaboratorySelection: () => void;
  
  // Global
  readonly getSelectedProductsArray: () => GenericProduct[];
  readonly getSelectedLaboratoriesArray: () => GenericLaboratory[];
  readonly clearAllSelections: () => void;
}

export function useGenericFilterSearch(): UseGenericFilterSearchReturn {
  // Products state
  const [products, setProducts] = useState<GenericProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Map<string, GenericProduct>>(new Map());

  // Laboratories state
  const [laboratories, setLaboratories] = useState<GenericLaboratory[]>([]);
  const [isLoadingLaboratories, setIsLoadingLaboratories] = useState(false);
  const [errorLaboratories, setErrorLaboratories] = useState<string | null>(null);
  const [laboratoryQuery, setLaboratoryQuery] = useState('');
  const [selectedLaboratories, setSelectedLaboratories] = useState<Map<string, GenericLaboratory>>(new Map());

  // Recherche produits avec debounce
  const performProductSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setProducts([]);
      setIsLoadingProducts(false);
      return;
    }

    setIsLoadingProducts(true);
    setErrorProducts(null);

    try {
      console.log('🔍 [useGenericFilterSearch] Searching products:', query.trim());

      const response = await fetch('/api/generic-filters/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data: ProductSearchResponse = await response.json();
      
      console.log('✅ [useGenericFilterSearch] Products found:', {
        count: data.count,
        queryTime: data.queryTime,
        firstResult: data.products?.[0]?.name
      });
      
      setProducts(data.products || []);

    } catch (err) {
      console.error('❌ [useGenericFilterSearch] Product search error:', err);
      setErrorProducts(err instanceof Error ? err.message : 'Erreur lors de la recherche');
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Recherche laboratoires avec debounce
  const performLaboratorySearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setLaboratories([]);
      setIsLoadingLaboratories(false);
      return;
    }

    setIsLoadingLaboratories(true);
    setErrorLaboratories(null);

    try {
      console.log('🔍 [useGenericFilterSearch] Searching laboratories:', query.trim());

      const response = await fetch('/api/generic-filters/laboratories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data: LaboratorySearchResponse = await response.json();
      
      console.log('✅ [useGenericFilterSearch] Laboratories found:', {
        count: data.count,
        queryTime: data.queryTime,
        firstResult: data.laboratories?.[0]?.laboratory_name
      });
      
      setLaboratories(data.laboratories || []);

    } catch (err) {
      console.error('❌ [useGenericFilterSearch] Laboratory search error:', err);
      setErrorLaboratories(err instanceof Error ? err.message : 'Erreur lors de la recherche');
      setLaboratories([]);
    } finally {
      setIsLoadingLaboratories(false);
    }
  }, []);

  // Debounce effects
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performProductSearch(productQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [productQuery, performProductSearch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performLaboratorySearch(laboratoryQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [laboratoryQuery, performLaboratorySearch]);

  // Reset quand requête trop courte
  useEffect(() => {
    if (productQuery.trim().length < 2) {
      setProducts([]);
      setIsLoadingProducts(false);
      setErrorProducts(null);
    }
  }, [productQuery]);

  useEffect(() => {
    if (laboratoryQuery.trim().length < 2) {
      setLaboratories([]);
      setIsLoadingLaboratories(false);
      setErrorLaboratories(null);
    }
  }, [laboratoryQuery]);

  // Toggle functions avec métadonnées complètes
  const toggleProduct = useCallback((product: GenericProduct) => {
    console.log('🔄 [useGenericFilterSearch] Toggle product:', product.code_13_ref);
    
    setSelectedProducts(prev => {
      const newMap = new Map(prev);
      if (newMap.has(product.code_13_ref)) {
        newMap.delete(product.code_13_ref);
        console.log('➖ Removed product:', product.code_13_ref);
      } else {
        newMap.set(product.code_13_ref, product);
        console.log('➕ Added product:', product.code_13_ref);
      }
      return newMap;
    });
  }, []);

  const toggleLaboratory = useCallback((laboratory: GenericLaboratory) => {
    console.log('🔄 [useGenericFilterSearch] Toggle laboratory:', laboratory.laboratory_name);
    
    setSelectedLaboratories(prev => {
      const newMap = new Map(prev);
      if (newMap.has(laboratory.laboratory_name)) {
        newMap.delete(laboratory.laboratory_name);
        console.log('➖ Removed laboratory:', laboratory.laboratory_name);
      } else {
        newMap.set(laboratory.laboratory_name, laboratory);
        console.log('➕ Added laboratory:', laboratory.laboratory_name);
      }
      return newMap;
    });
  }, []);

  // Clear functions
  const clearProductSelection = useCallback(() => {
    console.log('🗑️ [useGenericFilterSearch] Clear product selection');
    setSelectedProducts(new Map());
  }, []);

  const clearLaboratorySelection = useCallback(() => {
    console.log('🗑️ [useGenericFilterSearch] Clear laboratory selection');
    setSelectedLaboratories(new Map());
  }, []);

  const clearAllSelections = useCallback(() => {
    console.log('🗑️ [useGenericFilterSearch] Clear all selections');
    setSelectedProducts(new Map());
    setSelectedLaboratories(new Map());
  }, []);

  // Get arrays
  const getSelectedProductsArray = useCallback(() => {
    return Array.from(selectedProducts.values());
  }, [selectedProducts]);

  const getSelectedLaboratoriesArray = useCallback(() => {
    return Array.from(selectedLaboratories.values());
  }, [selectedLaboratories]);

  return {
    // Products
    products,
    isLoadingProducts,
    errorProducts,
    productQuery,
    setProductQuery,
    selectedProducts,
    toggleProduct,
    clearProductSelection,
    
    // Laboratories
    laboratories,
    isLoadingLaboratories,
    errorLaboratories,
    laboratoryQuery,
    setLaboratoryQuery,
    selectedLaboratories,
    toggleLaboratory,
    clearLaboratorySelection,
    
    // Global
    getSelectedProductsArray,
    getSelectedLaboratoriesArray,
    clearAllSelections
  };
}