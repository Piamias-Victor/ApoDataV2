// src/components/molecules/ElementSearchModal/ElementSearchModal.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader2, Package, TestTube, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';
import type {
  ComparisonType,
  ComparisonElement,
  ProductSearchResult,
  LaboratorySearchResult,
  CategorySearchResult,
  SearchState,
} from '@/types/comparison';

interface ElementSearchModalProps {
  readonly isOpen: boolean;
  readonly comparisonType: ComparisonType;
  readonly targetPosition: 'A' | 'B';
  readonly onClose: () => void;
  readonly onSelect: (element: ComparisonElement) => void;
}

/**
 * ElementSearchModal - Modal recherche avec debounce 300ms
 * 
 * Features :
 * - Backdrop bg-black/50 backdrop-blur-sm
 * - Modal max-w-md rounded-xl shadow-2xl
 * - Input avec iconLeft Search
 * - Résultats cards hover + transition
 * - API calls selon comparisonType
 * - Transformation résultats vers ComparisonElement
 * - Gestion loading/error states
 */
export const ElementSearchModal: React.FC<ElementSearchModalProps> = ({
  isOpen,
  comparisonType,
  targetPosition,
  onClose,
  onSelect,
}) => {
  const [searchState, setSearchState] = useState<SearchState<ComparisonElement>>({
    query: '',
    results: [],
    isLoading: false,
    error: null,
    hasSearched: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup à la fermeture
  useEffect(() => {
    if (!isOpen) {
      setSearchState({
        query: '',
        results: [],
        isLoading: false,
        error: null,
        hasSearched: false,
      });
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [isOpen]);

  // Recherche avec debounce
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchState(prev => ({ 
        ...prev, 
        results: [], 
        hasSearched: false,
        error: null 
      }));
      return;
    }

    // Abort précédente requête
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setSearchState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      hasSearched: true 
    }));

    try {
      const trimmed = query.trim();
      let endpoint = '';
      let body: any = {};

      switch (comparisonType) {
        case 'products':
          endpoint = '/api/products/search';
          body = { query: trimmed };
          break;
        case 'laboratories':
          endpoint = '/api/laboratories/search';
          body = { query: trimmed, mode: 'laboratory' };
          break;
        case 'categories':
          endpoint = '/api/categories/search';
          body = { query: trimmed, mode: 'category' };
          break;
        default:
          throw new Error('Type de comparaison non supporté');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      const results = transformApiResults(data, comparisonType);
      
      setSearchState(prev => ({ 
        ...prev, 
        results, 
        isLoading: false,
        error: null 
      }));
      
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      
      setSearchState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error.message || 'Erreur de recherche',
        results: []
      }));
    }
  }, [comparisonType]);

  // Debounce handler
  const handleQueryChange = useCallback((value: string) => {
    setSearchState(prev => ({ ...prev, query: value }));

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  }, [performSearch]);

  // Transformation résultats API vers ComparisonElement
  const transformApiResults = (
    data: any,
    type: ComparisonType
  ): ComparisonElement[] => {
    switch (type) {
      case 'products':
        return data.products?.map((product: ProductSearchResult) => ({
          id: product.code_13_ref,
          name: product.name,
          type: 'product' as const,
          metadata: {
            code_ean: product.code_13_ref,
            brand_lab: product.brand_lab,
            universe: product.universe,
            product_codes: [product.code_13_ref],
          },
        })) || [];

      case 'laboratories':
        return data.laboratories?.map((lab: LaboratorySearchResult) => ({
          id: lab.laboratory_name,
          name: lab.laboratory_name, // ✅ Le nom vient directement de laboratory_name
          type: 'laboratory' as const,
          metadata: {
            laboratory_name: lab.laboratory_name,
            product_codes: lab.product_codes,
          },
        })) || [];

      case 'categories':
        return data.categories?.map((category: CategorySearchResult) => ({
          id: `${category.category_type}-${category.category_name}`,
          name: category.category_name, // ✅ Le nom vient directement de category_name
          type: 'category' as const,
          metadata: {
            category_type: category.category_type,
            product_codes: category.product_codes,
          },
        })) || [];

      default:
        return [];
    }
  };

  const handleElementSelect = (element: ComparisonElement) => {
    onSelect(element);
    onClose();
  };

  // Labels selon type
  const getTypeLabel = () => {
    switch (comparisonType) {
      case 'products': return 'produit';
      case 'laboratories': return 'laboratoire';
      case 'categories': return 'catégorie';
      default: return 'élément';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Rechercher {getTypeLabel()} {targetPosition}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Tapez au moins 2 caractères
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-100">
          <Input
            variant="outlined"
            iconLeft={<Search className="w-4 h-4" />}
            placeholder={`Rechercher ${getTypeLabel()}...`}
            value={searchState.query}
            onChange={(e) => handleQueryChange(e.target.value)}
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {searchState.isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-600">Recherche...</span>
            </div>
          )}

          {searchState.error && (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{searchState.error}</p>
              </div>
            </div>
          )}

          {!searchState.isLoading && !searchState.error && searchState.hasSearched && searchState.results.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Aucun résultat trouvé</p>
            </div>
          )}

          {!searchState.hasSearched && (
            <div className="text-center py-8 text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Commencez à taper pour rechercher</p>
            </div>
          )}

          {searchState.results.length > 0 && (
            <div className="space-y-3">
              {searchState.results.map((element: ComparisonElement) => (
                <motion.div
                  key={element.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="group"
                >
                  <button
                    onClick={() => handleElementSelect(element)}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Icône selon type */}
                        <div className={`
                          p-2 rounded-lg flex-shrink-0
                          ${element.type === 'product' ? 'bg-blue-100 text-blue-600' : ''}
                          ${element.type === 'laboratory' ? 'bg-purple-100 text-purple-600' : ''}  
                          ${element.type === 'category' ? 'bg-green-100 text-green-600' : ''}
                        `}>
                          {element.type === 'product' && <Package className="w-4 h-4" />}
                          {element.type === 'laboratory' && <TestTube className="w-4 h-4" />}
                          {element.type === 'category' && <Tag className="w-4 h-4" />}
                        </div>

                        {/* Contenu principal */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate text-sm">
                            {element.name}
                          </h3>
                          
                          <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                            {element.type === 'product' && element.metadata.code_ean && (
                              <>
                                <span className="font-mono text-gray-600">
                                  {element.metadata.code_ean}
                                </span>
                                {element.metadata.brand_lab && (
                                  <>
                                    <span>•</span>
                                    <span>{element.metadata.brand_lab}</span>
                                  </>
                                )}
                              </>
                            )}
                            
                            {element.type === 'laboratory' && (
                              <span>
                                {element.metadata.product_codes.length} produit{element.metadata.product_codes.length > 1 ? 's' : ''}
                              </span>
                            )}
                            
                            {element.type === 'category' && (
                              <>
                                <span className="capitalize">
                                  {element.metadata.category_type === 'universe' ? 'Univers' : 'Catégorie'}
                                </span>
                                <span>•</span>
                                <span>
                                  {element.metadata.product_codes.length} produit{element.metadata.product_codes.length > 1 ? 's' : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Indicateur sélection */}
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            className="w-full"
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
};