// src/components/organisms/ProductsDrawer/ProductsDrawer.tsx
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, Package, Check } from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';
import { useProductSearch } from '@/hooks/products/useProductSearch';
import { useFiltersStore } from '@/stores/useFiltersStore';

interface ProductsDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCountChange: (count: number) => void;
}

/**
 * ProductsDrawer Component - AVEC SECTION SÉLECTIONNÉS
 * 
 * NOUVELLES FONCTIONNALITÉS :
 * - Section "Produits sélectionnés" avec noms depuis le store
 * - Désélection rapide individuelle
 * - Pas d'API supplémentaire nécessaire
 * - Indicateurs visuels conservés
 */
export const ProductsDrawer: React.FC<ProductsDrawerProps> = ({
  isOpen,
  onClose,
  onCountChange
}) => {
  const {
    products,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedProducts,
    toggleProduct,
    applyFilters,
    clearProductFilters,
    pendingProductCodes,
    getSelectedProductsFromStore
  } = useProductSearch();

  // Accès au store - SIMPLIFIÉ
  const storedProductCodes = useFiltersStore(state => state.products);
  const selectedProductsInfo = getSelectedProductsFromStore(); // Direct depuis le store

  // Update count when selection changes
  useEffect(() => {
    onCountChange(pendingProductCodes.size);
  }, [pendingProductCodes.size, onCountChange]);

  const handleProductToggle = (code: string) => {
    toggleProduct(code);
  };

  // Fonction pour désélectionner un produit du store
  const handleDeselectStoredProduct = (code: string) => {
    console.log('🗑️ [ProductsDrawer] Deselecting stored product:', code);
    
    // Filtrer ce produit des sélections du store
    const remainingProducts = selectedProductsInfo.filter(product => product.code !== code);
    const remainingCodes = remainingProducts.map(product => product.code);
    
    // Mettre à jour le store
    const setProductFiltersWithNames = useFiltersStore.getState().setProductFiltersWithNames;
    setProductFiltersWithNames(remainingCodes, remainingProducts);
  };

  // Vérifier si un produit est sélectionné
  const isProductSelected = (code: string): boolean => {
    if (selectedProducts.has(code)) {
      return true;
    }
    if (storedProductCodes.includes(code)) {
      return true;
    }
    return false;
  };

  // Déterminer le type de sélection pour l'affichage visuel
  const getSelectionType = (code: string): 'new' | 'stored' | 'none' => {
    if (selectedProducts.has(code)) {
      return 'new';
    }
    if (storedProductCodes.includes(code)) {
      return 'stored';
    }
    return 'none';
  };

  const hasResults = products.length > 0;
  const showEmptyMessage = searchQuery.length >= 3 && !isLoading && !hasResults && !error;
  const isSearching = searchQuery.length >= 3;
  const showSelectedSection = !isSearching && selectedProductsInfo.length > 0;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <motion.div
        className="fixed top-0 right-0 h-full w-[500px] z-50 bg-white shadow-strong border-l border-gray-200 flex flex-col"
        initial={{ x: 500 }}
        animate={{ x: 0 }}
        exit={{ x: 500 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Produits
              </h2>
              <p className="text-sm text-gray-500">
                {pendingProductCodes.size} produits sélectionnés
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un produit (3+ caractères)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
            />
          </div>
          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <p className="text-xs text-amber-600 mt-2">
              Tapez au moins 3 caractères pour rechercher
            </p>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          
          {/* SECTION PRODUITS SÉLECTIONNÉS */}
          {showSelectedSection && (
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Produits sélectionnés ({selectedProductsInfo.length})
                  </h3>
                  <button
                    onClick={clearProductFilters}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Tout effacer
                  </button>
                </div>
                
                <div className="space-y-2">
                  {selectedProductsInfo.map((productInfo, index) => (
                    <motion.div
                      key={`selected-${productInfo.code}-${index}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 mt-2" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate block">
                              {productInfo.name}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {productInfo.code}
                            </p>
                            
                            {(productInfo.brandLab || productInfo.universe) && (
                              <div className="flex items-center space-x-1 mt-1 flex-wrap gap-1">
                                {productInfo.brandLab && (
                                  <span className="inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded truncate max-w-[100px]" 
                                        title={productInfo.brandLab}>
                                    {productInfo.brandLab.length > 30 ? `${productInfo.brandLab.substring(0, 30)}...` : productInfo.brandLab}
                                  </span>
                                )}
                                {productInfo.universe && (
                                  <span className="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded truncate max-w-[100px]" 
                                        title={productInfo.universe}>
                                    {productInfo.universe.length > 30 ? `${productInfo.universe.substring(0, 30)}...` : productInfo.universe}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeselectStoredProduct(productInfo.code)}
                        className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Désélectionner ce produit"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RÉSULTATS DE RECHERCHE */}
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-12"
              >
                <div className="flex items-center space-x-3 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Recherche en cours...</span>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            {showEmptyMessage && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center"
              >
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Aucun produit trouvé</p>
                <p className="text-xs text-gray-400">
                  Essayez avec d'autres mots-clés
                </p>
              </motion.div>
            )}

            {hasResults && !isLoading && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-2"
              >
                {products.map((product, index) => {
                  const isSelected = isProductSelected(product.code_13_ref);
                  const selectionType = getSelectionType(product.code_13_ref);

                  return (
                    <motion.div
                      key={product.code_13_ref}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        p-3 border-2 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md
                        ${selectionType === 'stored' 
                          ? 'border-blue-300 bg-blue-50' 
                          : selectionType === 'new'
                          ? 'border-green-300 bg-green-50'
                          : isSelected 
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                      onClick={() => handleProductToggle(product.code_13_ref)}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleProductToggle(product.code_13_ref)}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {product.code_13_ref}
                          </p>

                          {/* Indicateurs de statut */}
                          {selectionType === 'stored' && (
                            <div className="flex items-center mt-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                              <span className="text-xs text-blue-600 font-medium">
                                Déjà appliqué
                              </span>
                            </div>
                          )}
                          
                          {selectionType === 'new' && (
                            <div className="flex items-center mt-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                              <span className="text-xs text-green-600 font-medium">
                                Nouvelle sélection
                              </span>
                            </div>
                          )}
                          
                          {(product.brand_lab || product.universe) && (
                            <div className="flex items-center space-x-2 mt-2 flex-wrap gap-1">
                              {product.brand_lab && (
                                <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded truncate max-w-[120px]" 
                                      title={product.brand_lab}>
                                  {product.brand_lab.length > 40 ? `${product.brand_lab.substring(0, 40)}...` : product.brand_lab}
                                </span>
                              )}
                              {product.universe && (
                                <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded truncate max-w-[120px]" 
                                      title={product.universe}>
                                  {product.universe.length > 40 ? `${product.universe.substring(0, 40)}...` : product.universe}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Message quand aucune recherche et aucun produit sélectionné */}
            {!isSearching && !isLoading && selectedProductsInfo.length === 0 && (
              <motion.div
                key="no-selection"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center"
              >
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Aucun produit sélectionné</p>
                <p className="text-xs text-gray-400">
                  Utilisez la recherche pour trouver des produits
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                applyFilters();
                onClose();
              }}
              disabled={selectedProducts.size === 0}
              className={`
                flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${selectedProducts.size > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Appliquer ({selectedProducts.size})
            </button>
            <button
              onClick={() => {
                clearProductFilters();
                onClose();
              }}
              className="
                px-4 py-2 text-sm font-medium rounded-lg border
                border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400
                focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                transition-all duration-200
              "
            >
              Effacer produits
            </button>
          </div>
        </div>

        {/* Tutorial */}
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <p className="text-xs text-gray-600">
            <strong>Guide :</strong> Lettres: nom • Chiffres: début EAN • *1234: fin EAN
          </p>
        </div>

      </motion.div>
    </>
  );
};