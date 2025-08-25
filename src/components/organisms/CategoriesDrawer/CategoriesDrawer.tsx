// src/components/organisms/CategoriesDrawer/CategoriesDrawer.tsx
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, Tag, Package, HelpCircle, Globe, FolderOpen } from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';
import { useCategorySearch, SearchMode } from '@/hooks/categories/useCategorySearch';

interface CategoriesDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCountChange: (count: number) => void;
}

/**
 * CategoriesDrawer Component - Drawer pour recherche catégories dual-mode
 * 
 * Fonctionnalités :
 * - Mode "Catégorie" : recherche directe dans universe ET category
 * - Mode "Produit" : recherche produit → trouve catégories avec produits matchants
 * - Switch toggle avec tooltip explicatif
 * - Debounce 300ms, minimum 3 caractères
 * - Sélection par catégorie entière (tous les produits)
 * - Différenciation visuelle universe (Globe) vs category (FolderOpen)
 */
export const CategoriesDrawer: React.FC<CategoriesDrawerProps> = ({
  isOpen,
  onClose,
  onCountChange
}) => {
  const {
    categories,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    selectedCategories,
    toggleCategory,
    applyFilters,
    clearCategoryFilters
  } = useCategorySearch();

  // Update count when selection changes
  useEffect(() => {
    onCountChange(selectedCategories.size);
  }, [selectedCategories.size, onCountChange]);

  const createCategoryKey = (name: string, type: 'universe' | 'category'): string => {
    return `${type}:${name}`;
  };

  const handleCategoryToggle = (categoryName: string, categoryType: 'universe' | 'category', productCodes: string[]) => {
    const categoryKey = createCategoryKey(categoryName, categoryType);
    toggleCategory(categoryKey, productCodes);
  };

  const isCategorySelected = (categoryName: string, categoryType: 'universe' | 'category'): boolean => {
    const categoryKey = createCategoryKey(categoryName, categoryType);
    return selectedCategories.has(categoryKey);
  };

  const hasResults = categories.length > 0;
  const showEmptyMessage = searchQuery.length >= 3 && !isLoading && !hasResults && !error;

  const getPlaceholderText = () => {
    return searchMode === 'category' 
      ? 'Rechercher une catégorie/univers...' 
      : 'Rechercher un produit...';
  };

  const getResultCountText = (count: number, mode: SearchMode) => {
    if (mode === 'category') {
      return `${count} produit${count > 1 ? 's' : ''}`;
    } else {
      return `${count} produit${count > 1 ? 's trouvés' : ' trouvé'}`;
    }
  };

  const getCategoryIcon = (type: 'universe' | 'category') => {
    return type === 'universe' ? Globe : FolderOpen;
  };

  const getCategoryColor = (type: 'universe' | 'category', isSelected: boolean) => {
    if (type === 'universe') {
      return isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500';
    } else {
      return isSelected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500';
    }
  };

  const getCategoryBorderColor = (type: 'universe' | 'category', isSelected: boolean) => {
    if (type === 'universe') {
      return isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-200 hover:bg-blue-25';
    } else {
      return isSelected ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-green-200 hover:bg-green-25';
    }
  };

  const getCategoryBadgeColor = (type: 'universe' | 'category') => {
    return type === 'universe' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
  };

  const getCategoryTypeLabel = (type: 'universe' | 'category') => {
    return type === 'universe' ? 'Univers' : 'Catégorie';
  };

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
              Filtres Catégories
            </h3>
            {selectedCategories.size > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-pink-100 text-pink-700 rounded-full">
                {selectedCategories.size}
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

        {/* Mode Toggle */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Toggle Switch */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSearchMode('category')}
                  className={`
                    relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                    flex items-center space-x-2
                    ${searchMode === 'category'
                      ? 'bg-white text-pink-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Tag className="w-4 h-4" />
                  <span>Catégorie</span>
                </button>
                
                <button
                  onClick={() => setSearchMode('product')}
                  className={`
                    relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                    flex items-center space-x-2
                    ${searchMode === 'product'
                      ? 'bg-white text-pink-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Package className="w-4 h-4" />
                  <span>Produit</span>
                </button>
              </div>

              {/* Tooltip */}
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-10">
                <div className="group relative">
                  <button className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                  
                  <div className="
                    invisible group-hover:visible opacity-0 group-hover:opacity-100
                    absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2
                    bg-gray-900 text-white text-xs rounded-lg px-3 py-2
                    whitespace-nowrap transition-all duration-200
                    before:content-[''] before:absolute before:top-full before:left-1/2
                    before:transform before:-translate-x-1/2 before:border-4
                    before:border-transparent before:border-t-gray-900
                  ">
                    {searchMode === 'category' ? (
                      <div>Mode catégorie : recherche dans univers et catégories</div>
                    ) : (
                      <div>Mode produit : recherche un produit pour trouver ses catégories</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-100">
          <Input
            variant="default"
            size="md"
            placeholder={getPlaceholderText()}
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
                    <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-3" />
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
                  <p className="text-sm text-gray-500">
                    {searchMode === 'category' ? 'Aucune catégorie trouvée' : 'Aucun produit trouvé'}
                  </p>
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
                  {categories.map((category, index) => {
                    const isSelected = isCategorySelected(category.category_name, category.category_type);
                    const IconComponent = getCategoryIcon(category.category_type);
                    
                    return (
                      <motion.div
                        key={`${category.category_type}:${category.category_name}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`
                          p-4 rounded-lg border cursor-pointer transition-all duration-200
                          ${getCategoryBorderColor(category.category_type, isSelected)}
                        `}
                        onClick={() => handleCategoryToggle(category.category_name, category.category_type, category.product_codes)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                            ${getCategoryColor(category.category_type, isSelected)}
                          `}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {category.category_name}
                              </h4>
                              <span className={`
                                px-2 py-0.5 text-xs font-medium rounded-full
                                ${getCategoryBadgeColor(category.category_type)}
                              `}>
                                {getCategoryTypeLabel(category.category_type)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {getResultCountText(category.product_count, searchMode)}
                            </p>
                            
                            {/* Matching products in product mode */}
                            {searchMode === 'product' && category.matching_products && category.matching_products.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {category.matching_products.slice(0, 3).map((product, productIndex) => (
                                  <div key={productIndex} className="flex items-center text-xs text-gray-600 pl-2 border-l-2 border-gray-200">
                                    <span className="mr-1">→</span>
                                    <span className="truncate flex-1">
                                      {product.name}
                                    </span>
                                    <span className="ml-2 text-gray-400 font-mono text-xs">
                                      {product.code_13_ref}
                                    </span>
                                  </div>
                                ))}
                                {category.matching_products.length > 3 && (
                                  <div className="text-xs text-gray-500 pl-3">
                                    +{category.matching_products.length - 3} autres produits...
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Selection indicator */}
                            {isSelected && (
                              <div className="flex items-center mt-2">
                                <div className={`
                                  w-2 h-2 rounded-full mr-2
                                  ${category.category_type === 'universe' ? 'bg-blue-500' : 'bg-green-500'}
                                `} />
                                <span className={`
                                  text-xs font-medium
                                  ${category.category_type === 'universe' ? 'text-blue-600' : 'text-green-600'}
                                `}>
                                  Tous les produits sélectionnés
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCategoryToggle(category.category_name, category.category_type, category.product_codes)}
                            className={`
                              mt-2 w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-offset-2
                              ${category.category_type === 'universe' 
                                ? 'text-blue-600 focus:ring-blue-500' 
                                : 'text-green-600 focus:ring-green-500'
                              }
                            `}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
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
                disabled={selectedCategories.size === 0}
                className={`
                  flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${selectedCategories.size > 0
                    ? 'bg-pink-600 text-white hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                Appliquer ({selectedCategories.size})
              </button>
              <button
                onClick={() => {
                  clearCategoryFilters();
                  onClose();
                }}
                className="
                  px-4 py-2 text-sm font-medium rounded-lg border
                  border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400
                  focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  transition-all duration-200
                "
              >
                Effacer catégories
              </button>
            </div>
          </div>

          {/* Tutorial - Compact */}
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            {searchMode === 'category' ? (
              <>
                <p className="text-xs text-gray-600">
                  <strong>Mode Catégorie :</strong> Recherche dans univers et catégories
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-blue-600">● Univers</span> • <span className="text-green-600">● Catégories</span>
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-600">
                  <strong>Mode Produit :</strong> Lettres: nom produit • Chiffres: début EAN • *1234: fin EAN
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Trouvez un produit pour sélectionner ses catégories
                </p>
              </>
            )}
          </div>

        </div>
      </motion.div>
    </>
  );
};