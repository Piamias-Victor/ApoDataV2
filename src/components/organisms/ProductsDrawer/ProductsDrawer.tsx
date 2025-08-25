// src/components/organisms/ProductsDrawer/ProductsDrawer.tsx
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';
import { useProductSearch } from '@/hooks/products/useProductSearch';

interface ProductsDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCountChange: (count: number) => void;
}

/**
 * ProductsDrawer Component - Drawer pour recherche et sélection produits
 * 
 * Fonctionnalités :
 * - Recherche intelligente (nom/code/fin code avec *)
 * - Sélection multiple avec checkbox
 * - Debounce 300ms
 * - Tutorial intégré
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
    clearProductFilters
  } = useProductSearch();

  // Initialize count on mount and update when selection changes
  useEffect(() => {
    onCountChange(selectedProducts.size);
  }, [selectedProducts.size, onCountChange]);

  const handleProductToggle = (code: string) => {
    toggleProduct(code);
  };

  const hasResults = products.length > 0;
  const showEmptyMessage = searchQuery.length >= 3 && !isLoading && !hasResults && !error;

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
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Filtres Produits
            </h3>
            {selectedProducts.size > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                {selectedProducts.size}
              </span>
            )}
          </div>
          <motion.button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-100">
          <Input
            variant="default"
            size="md"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            iconLeft={<Search className="w-4 h-4" />}
            iconRight={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          />
          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <p className="text-xs text-gray-500 mt-1">
              Minimum 3 caractères requis
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Results List */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-12"
                >
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Recherche en cours...</p>
                  </div>
                </motion.div>
              )}

              {error && !isLoading && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 text-center"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              {showEmptyMessage && !isLoading && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 text-center"
                >
                  <p className="text-sm text-gray-500">Aucun produit trouvé</p>
                </motion.div>
              )}

              {hasResults && !isLoading && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 space-y-2"
                >
                  {products.map((product, index) => (
                    <motion.div
                      key={product.code_13_ref}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-all duration-200
                        ${selectedProducts.has(product.code_13_ref)
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                      onClick={() => handleProductToggle(product.code_13_ref)}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.code_13_ref)}
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
                          {(product.brand_lab || product.universe) && (
                            <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                              {product.brand_lab && (
                                <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded truncate max-w-[120px]" title={product.brand_lab}>
                                  {product.brand_lab.length > 40 ? `${product.brand_lab.substring(0, 40)}...` : product.brand_lab}
                                </span>
                              )}
                              {product.universe && (
                                <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded truncate max-w-[120px]" title={product.universe}>
                                  {product.universe.length > 40 ? `${product.universe.substring(0, 40)}...` : product.universe}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
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

          {/* Tutorial - Compact */}
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <p className="text-xs text-gray-600">
              <strong>Guide :</strong> Lettres: nom • Chiffres: début EAN • *1234: fin EAN
            </p>
          </div>

        </div>
      </motion.div>
    </>
  );
};