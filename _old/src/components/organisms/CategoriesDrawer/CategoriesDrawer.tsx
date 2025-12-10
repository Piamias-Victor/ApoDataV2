// src/components/organisms/CategoriesDrawer/CategoriesDrawer.tsx
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, Tag, Package, HelpCircle, Globe, FolderOpen, Check } from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';
import { useCategorySearch, SearchMode } from '@/hooks/categories/useCategorySearch';
import { useFiltersStore } from '@/stores/useFiltersStore';

interface CategoriesDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCountChange: (count: number) => void;
}

/**
 * CategoriesDrawer Component - AVEC SECTION SÉLECTIONNÉES
 * 
 * NOUVELLES FONCTIONNALITÉS :
 * - Section "Catégories sélectionnées" avec noms depuis le store
 * - Désélection rapide individuelle
 * - Indicateurs visuels différenciés (univers/catégorie)
 * - Pas d'API supplémentaire nécessaire
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
    clearCategoryFilters,
    pendingProductCodes,
    getSelectedCategoriesFromStore
  } = useCategorySearch();

  // Accès au store - SIMPLIFIÉ
  const storedCategoryCodes = useFiltersStore(state => state.categories);
  const selectedCategoriesInfo = getSelectedCategoriesFromStore(); // Direct depuis le store

  // Update count when selection changes
  useEffect(() => {
    onCountChange(pendingProductCodes.size);
  }, [pendingProductCodes.size, onCountChange]);

  const createCategoryKey = (name: string, type: 'universe' | 'category'): string => {
    return `${type}:${name}`;
  };

  const handleCategoryToggle = (categoryName: string, categoryType: 'universe' | 'category', productCodes: string[]) => {
    const categoryKey = createCategoryKey(categoryName, categoryType);
    toggleCategory(categoryKey, productCodes);
  };

  // Fonction pour désélectionner une catégorie du store
  const handleDeselectStoredCategory = (categoryName: string, categoryType: 'universe' | 'category') => {
    console.log('🗑️ [CategoriesDrawer] Deselecting stored category:', `${categoryType}:${categoryName}`);

    // Filtrer cette catégorie des sélections du store
    const remainingCategories = selectedCategoriesInfo.filter(cat =>
      !(cat.name === categoryName && cat.type === categoryType)
    );
    const remainingCodes = remainingCategories.flatMap(cat => cat.productCodes);

    // Mettre à jour le store
    const setCategoryFiltersWithNames = useFiltersStore.getState().setCategoryFiltersWithNames;
    setCategoryFiltersWithNames(remainingCodes, remainingCategories);
  };

  // Vérifier si une catégorie est sélectionnée (store OU nouvelles sélections)
  const isCategorySelected = (categoryName: string, categoryType: 'universe' | 'category', productCodes: string[]): boolean => {
    const categoryKey = createCategoryKey(categoryName, categoryType);

    if (selectedCategories.has(categoryKey)) {
      return true;
    }
    if (productCodes.length > 0 && productCodes.every(code => storedCategoryCodes.includes(code))) {
      return true;
    }
    return false;
  };

  // Déterminer le type de sélection pour l'affichage visuel
  const getSelectionType = (categoryName: string, categoryType: 'universe' | 'category', productCodes: string[]): 'new' | 'stored' | 'none' => {
    const categoryKey = createCategoryKey(categoryName, categoryType);

    if (selectedCategories.has(categoryKey)) {
      return 'new';
    }
    if (productCodes.length > 0 && productCodes.every(code => storedCategoryCodes.includes(code))) {
      return 'stored';
    }
    return 'none';
  };

  const hasResults = categories.length > 0;
  const showEmptyMessage = searchQuery.length >= 3 && !isLoading && !hasResults && !error;
  const isSearching = searchQuery.length >= 3;
  const showSelectedSection = !isSearching && selectedCategoriesInfo.length > 0;

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

  const getCategoryColor = (type: 'universe' | 'category', selectionType: 'new' | 'stored' | 'none') => {
    if (type === 'universe') {
      return selectionType === 'stored'
        ? 'bg-blue-200 text-blue-700'
        : selectionType === 'new'
          ? 'bg-blue-600 text-white'
          : 'bg-blue-100 text-blue-600';
    } else {
      return selectionType === 'stored'
        ? 'bg-green-200 text-green-700'
        : selectionType === 'new'
          ? 'bg-green-600 text-white'
          : 'bg-green-100 text-green-600';
    }
  };

  const getBorderColor = (type: 'universe' | 'category', selectionType: 'new' | 'stored' | 'none') => {
    if (type === 'universe') {
      return selectionType === 'stored'
        ? 'border-blue-300 bg-blue-50'
        : selectionType === 'new'
          ? 'border-blue-500 bg-blue-100'
          : 'border-gray-200 bg-white hover:border-blue-200';
    } else {
      return selectionType === 'stored'
        ? 'border-green-300 bg-green-50'
        : selectionType === 'new'
          ? 'border-green-500 bg-green-100'
          : 'border-gray-200 bg-white hover:border-green-200';
    }
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
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Tag className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Catégories</h2>
              <p className="text-sm text-gray-500">
                {pendingProductCodes.size} produit{pendingProductCodes.size > 1 ? 's' : ''} sélectionné{pendingProductCodes.size > 1 ? 's' : ''}
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

        {/* Search Mode Toggle */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Mode de recherche</span>
            <div className="relative group">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <strong>Catégorie :</strong> Recherche dans univers et catégories<br />
                <strong>Produit :</strong> Trouve les catégories via leurs produits
              </div>
            </div>
          </div>
          <div className="flex mt-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setSearchMode('category')}
              className={`
                flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2
                ${searchMode === 'category'
                  ? 'bg-pink-600 text-white shadow-sm'
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
                flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2
                ${searchMode === 'product'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Package className="w-4 h-4" />
              <span>Produit</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getPlaceholderText()}
              className="pl-10 pr-4"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <p className="mt-2 text-xs text-amber-600">
              Tapez au moins 3 caractères pour rechercher
            </p>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">

          {/* SECTION CATÉGORIES SÉLECTIONNÉES */}
          {showSelectedSection && (
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Catégories sélectionnées ({selectedCategoriesInfo.length})
                  </h3>
                  <button
                    onClick={clearCategoryFilters}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Tout effacer
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedCategoriesInfo.map((categoryInfo, index) => {
                    const CategoryIcon = getCategoryIcon(categoryInfo.type);

                    return (
                      <motion.div
                        key={`selected-${categoryInfo.type}-${categoryInfo.name}-${index}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center justify-between p-3 bg-white border rounded-lg ${categoryInfo.type === 'universe' ? 'border-blue-200' : 'border-green-200'
                          }`}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`
                            flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                            ${categoryInfo.type === 'universe' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}
                          `}>
                            <CategoryIcon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate block">
                              {categoryInfo.name}
                            </span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`
                                px-2 py-0.5 rounded text-xs font-medium
                                ${categoryInfo.type === 'universe' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                              `}>
                                {categoryInfo.type === 'universe' ? 'Univers' : 'Catégorie'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {categoryInfo.productCount} produits
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeselectStoredCategory(categoryInfo.name, categoryInfo.type)}
                          className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Désélectionner cette catégorie"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })}
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
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Aucune catégorie trouvée</p>
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
                className="p-4 space-y-3"
              >
                {categories.map((category, index) => {
                  const isSelected = isCategorySelected(category.category_name, category.category_type, category.product_codes);
                  const selectionType = getSelectionType(category.category_name, category.category_type, category.product_codes);
                  const CategoryIcon = getCategoryIcon(category.category_type);

                  return (
                    <motion.div
                      key={`${category.category_type}:${category.category_name}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md
                        ${getBorderColor(category.category_type, selectionType)}
                      `}
                      onClick={() => handleCategoryToggle(category.category_name, category.category_type, category.product_codes)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className={`
                            flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                            ${getCategoryColor(category.category_type, selectionType)}
                          `}>
                            <CategoryIcon className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {category.category_name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center space-x-2">
                              <span className={`
                                px-2 py-0.5 rounded text-xs font-medium
                                ${category.category_type === 'universe' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                              `}>
                                {category.category_type === 'universe' ? 'Univers' : 'Catégorie'}
                              </span>
                              <span>•</span>
                              <span>{getResultCountText(category.product_count, searchMode)}</span>
                            </p>

                            {/* Indicateurs de statut */}
                            {selectionType === 'stored' && (
                              <div className="flex items-center mt-2">
                                <div className={`w-2 h-2 rounded-full mr-2 ${category.category_type === 'universe' ? 'bg-blue-500' : 'bg-green-500'
                                  }`} />
                                <span className={`text-xs font-medium ${category.category_type === 'universe' ? 'text-blue-600' : 'text-green-600'
                                  }`}>
                                  Déjà appliqué
                                </span>
                              </div>
                            )}

                            {selectionType === 'new' && (
                              <div className="flex items-center mt-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                                <span className="text-xs text-orange-600 font-medium">
                                  Nouvelle sélection
                                </span>
                              </div>
                            )}

                            {/* Produits correspondants en mode produit */}
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
                          </div>

                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCategoryToggle(category.category_name, category.category_type, category.product_codes)}
                            onClick={(e) => e.stopPropagation()}
                            className={`
                              mt-2 w-4 h-4 border-gray-300 rounded focus:ring-2
                              ${category.category_type === 'universe'
                                ? 'text-blue-600 focus:ring-blue-500'
                                : 'text-green-600 focus:ring-green-500'
                              }
                            `}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Message quand aucune recherche et aucune catégorie sélectionnée */}
            {!isSearching && !isLoading && selectedCategoriesInfo.length === 0 && (
              <motion.div
                key="no-selection"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center"
              >
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Aucune catégorie sélectionnée</p>
                <p className="text-xs text-gray-400">
                  Utilisez la recherche pour trouver des catégories
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

        {/* Tutorial */}
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

      </motion.div>
    </>
  );
};