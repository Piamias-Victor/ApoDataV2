// src/components/organisms/ExclusionDrawer/ExclusionDrawer.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation'; // 🔥 NOUVEAU
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, Ban, Check, ClipboardList, AlertCircle, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useGenericGroupStore } from '@/stores/useGenericGroupStore';
import { useProductExclusion } from '@/hooks/products/useProductExclusion';

interface ExclusionDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCountChange: (count: number) => void;
}

/**
 * ExclusionDrawer Component - VERSION UNIVERSELLE AUTO-DÉTECTION
 * 
 * Détecte automatiquement le contexte selon la route :
 * - /generique → useGenericGroupStore
 * - Autres routes → useFiltersStore
 */
export const ExclusionDrawer: React.FC<ExclusionDrawerProps> = ({
  isOpen,
  onClose,
  onCountChange
}) => {
  // 🔥 DÉTECTION AUTOMATIQUE du contexte
  const pathname = usePathname();
  const isGenericContext = pathname?.includes('/generique') ?? false;

  const {
    products,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedProducts,
    toggleProduct,
    applyExclusions: applyExclusionsHook,
    clearExclusions: clearExclusionsHook,
    pendingProductCodes,
    getExcludedProductsFromStore,
    bulkSearchProducts,
    isBulkSearching,
    bulkSelectProducts
  } = useProductExclusion();

  // État pour l'import bulk
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkResults, setBulkResults] = useState<{
    found: number;
    notFound: string[];
  } | null>(null);

  // 🔥 Accès aux stores selon contexte AUTO-DÉTECTÉ
  const storedExcludedCodesFilters = useFiltersStore(state => state.excludedProducts);
  const storedExcludedCodesGeneric = useGenericGroupStore(state => state.excludedProducts);

  const storedExcludedProductsFilters = useFiltersStore(state => state.selectedExcludedProducts);
  const storedExcludedProductsGeneric = useGenericGroupStore(state => state.selectedExcludedProducts);

  const storedExcludedCodes = isGenericContext
    ? storedExcludedCodesGeneric
    : storedExcludedCodesFilters;

  const storedExcludedProducts = isGenericContext
    ? storedExcludedProductsGeneric
    : storedExcludedProductsFilters;

  const excludedProductsInfo = storedExcludedProducts;

  // 🔥 Log contexte détecté
  useEffect(() => {
    if (isOpen) {
      console.log('🎯 [ExclusionDrawer] Context detected:', {
        pathname,
        isGenericContext,
        store: isGenericContext ? 'useGenericGroupStore' : 'useFiltersStore'
      });
    }
  }, [isOpen, pathname, isGenericContext]);

  // Update count when selection changes
  useEffect(() => {
    onCountChange(pendingProductCodes.size);
  }, [pendingProductCodes.size, onCountChange]);

  // Parser codes
  const parseCodes = useCallback((text: string): string[] => {
    const cleanText = text.replace(/\s+/g, '');

    // DÉTECTION EAN13
    if (/^\d+$/.test(cleanText) && cleanText.length >= 13) {
      const codes: string[] = [];

      for (let i = 0; i <= cleanText.length - 13; i += 13) {
        const code = cleanText.substring(i, i + 13);
        if (code.length === 13) {
          codes.push(code);
        }
      }

      if (codes.length > 0) {
        console.log('📊 [Parser] Detected EAN13 string:', codes.length, 'codes');
        return [...new Set(codes)];
      }
    }

    // PARSING CLASSIQUE
    const separators = /[,;\s\t\n\r|]+/;
    const codes = text
      .split(separators)
      .map(code => code.trim())
      .filter(code => code.length > 0)
      .filter(code => /^\d+$/.test(code));

    console.log('📊 [Parser] Detected separated codes:', codes.length);
    return [...new Set(codes)];
  }, []);

  // Gestionnaire import bulk
  const handleBulkImport = useCallback(async () => {
    if (!bulkInput.trim()) return;

    const codes = parseCodes(bulkInput);
    console.log(`⚡ [ExclusionDrawer:${isGenericContext ? 'generic' : 'filters'}] Starting bulk import for`, codes.length, 'codes');

    if (codes.length === 0) {
      setBulkResults({
        found: 0,
        notFound: ['Aucun code numérique valide détecté']
      });
      return;
    }

    try {
      const startTime = Date.now();
      const results = await bulkSearchProducts(codes);
      const totalTime = Date.now() - startTime;

      if (results.found.length > 0) {
        bulkSelectProducts(results.found);
      }

      setBulkResults({
        found: results.found.length,
        notFound: results.notFound
      });

      console.log(`🎯 [ExclusionDrawer] Bulk import complete:`, {
        context: isGenericContext ? 'generic' : 'filters',
        totalCodes: codes.length,
        found: results.found.length,
        notFound: results.notFound.length,
        totalTime: `${totalTime}ms`
      });

    } catch (err) {
      console.error('Error during bulk import:', err);
    }
  }, [bulkInput, parseCodes, bulkSearchProducts, bulkSelectProducts, isGenericContext]);

  const handleProductToggle = (code: string) => {
    toggleProduct(code);
  };

  // 🔥 Désélectionner selon contexte AUTO-DÉTECTÉ
  const handleDeselectStoredExclusion = (code: string) => {
    console.log(`🗑️ [ExclusionDrawer:${isGenericContext ? 'generic' : 'filters'}] Deselecting:`, code);

    const remainingExclusions = excludedProductsInfo.filter(product => product.code !== code);
    const remainingCodes = remainingExclusions.map(product => product.code);

    if (isGenericContext) {
      useGenericGroupStore.getState().setExcludedProductsWithNames(remainingCodes, remainingExclusions);
    } else {
      useFiltersStore.getState().setExcludedProductsWithNames(remainingCodes, remainingExclusions);
    }
  };

  // 🔥 Appliquer exclusions selon contexte AUTO-DÉTECTÉ
  const applyExclusions = useCallback(() => {
    console.log(`✅ [ExclusionDrawer:${isGenericContext ? 'generic' : 'filters'}] Applying exclusions:`, selectedProducts.size);

    if (isGenericContext) {
      // Récupérer les infos complètes des produits sélectionnés
      const selectedProductsArray = Array.from(selectedProducts);
      const productsInfo = products
        .filter(p => selectedProductsArray.includes(p.code_13_ref))
        .map(p => ({
          name: p.name,
          code: p.code_13_ref,
          brandLab: p.brand_lab,
          universe: p.universe
        }));

      // Merger avec les exclusions existantes
      const existingExclusions = useGenericGroupStore.getState().selectedExcludedProducts;
      const allExclusions = [...existingExclusions, ...productsInfo];
      const allCodes = allExclusions.map(p => p.code);

      useGenericGroupStore.getState().setExcludedProductsWithNames(allCodes, allExclusions);
    } else {
      applyExclusionsHook();
    }
  }, [isGenericContext, selectedProducts, products, applyExclusionsHook]);

  // 🔥 Clear exclusions selon contexte AUTO-DÉTECTÉ
  const clearExclusions = useCallback(() => {
    console.log(`🗑️ [ExclusionDrawer:${isGenericContext ? 'generic' : 'filters'}] Clearing all`);

    if (isGenericContext) {
      useGenericGroupStore.getState().clearExcludedProducts();
    } else {
      clearExclusionsHook();
    }
  }, [isGenericContext, clearExclusionsHook]);

  // Vérifier si un produit est exclu
  const isProductExcluded = (code: string): boolean => {
    if (selectedProducts.has(code)) {
      return true;
    }
    if (storedExcludedCodes.includes(code)) {
      return true;
    }
    return false;
  };

  // Déterminer le type d'exclusion
  const getExclusionType = (code: string): 'new' | 'stored' | 'none' => {
    if (selectedProducts.has(code)) {
      return 'new';
    }
    if (storedExcludedCodes.includes(code)) {
      return 'stored';
    }
    return 'none';
  };

  const hasResults = products.length > 0;
  const showEmptyMessage = searchQuery.length >= 3 && !isLoading && !hasResults && !error;
  const isSearching = searchQuery.length >= 3;
  const showExcludedSection = !isSearching && excludedProductsInfo.length > 0;

  // 🔥 Badge contexte AUTO
  const contextBadge = isGenericContext ? (
    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded ml-2">
      Génériques
    </span>
  ) : null;

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
        className="fixed top-0 right-0 h-full w-[500px] z-50 bg-white shadow-strong border-l-2 border-red-300 flex flex-col"
        initial={{ x: 500 }}
        animate={{ x: 0 }}
        exit={{ x: 500 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-red-200 bg-red-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Ban className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-900 flex items-center">
                Exclusions de produits
                {contextBadge}
              </h2>
              <p className="text-sm text-red-600">
                {pendingProductCodes.size} produits exclus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Message */}
        <div className="p-4 bg-amber-50 border-b border-amber-200">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-800 font-medium">
                Les produits exclus seront retirés de tous vos filtres
              </p>
              <p className="text-xs text-amber-700 mt-1">
                {isGenericContext
                  ? 'Utilisez pour affiner vos groupes génériques, produits et laboratoires'
                  : 'Utilisez pour affiner vos sélections (labos, catégories...)'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un produit à exclure (3+ caractères)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-red-200 focus:border-red-300 focus:ring-red-200"
            />
          </div>
          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <p className="text-xs text-amber-600 mt-2">
              Tapez au moins 3 caractères pour rechercher
            </p>
          )}

          {/* Bouton Import Bulk */}
          <button
            onClick={() => setShowBulkInput(!showBulkInput)}
            className="mt-3 w-full px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            {showBulkInput ? 'Masquer import multiple' : 'Importer plusieurs codes'}
          </button>

          {/* Zone Import Bulk */}
          {showBulkInput && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg space-y-3">
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="Collez vos codes EAN13 (séparés ou collés ensemble)"
                className="w-full h-20 p-2 text-sm border border-red-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none font-mono"
                disabled={isBulkSearching}
              />
              <p className="text-xs text-red-600">
                Formats acceptés : codes séparés (virgule, espace) ou collés ensemble
              </p>

              {/* Résultats import */}
              {bulkResults && (
                <div className="p-2 bg-white rounded border border-red-200">
                  {bulkResults.found > 0 && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {bulkResults.found} produits trouvés et marqués pour exclusion
                    </p>
                  )}
                  {bulkResults.notFound.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {bulkResults.notFound.length} codes non trouvés
                      </p>
                      <div className="mt-1 max-h-16 overflow-y-auto text-xs text-gray-500">
                        {bulkResults.notFound.slice(0, 10).join(', ')}
                        {bulkResults.notFound.length > 10 && ` ... et ${bulkResults.notFound.length - 10} autres`}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleBulkImport}
                disabled={!bulkInput.trim() || isBulkSearching}
                className={`
                  w-full py-2 px-3 text-sm rounded-lg font-medium transition-all
                  flex items-center justify-center gap-2
                  ${bulkInput.trim() && !isBulkSearching
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {isBulkSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Recherche en cours...
                  </>
                ) : (
                  'Rechercher et marquer pour exclusion'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">

          {/* SECTION PRODUITS EXCLUS */}
          {showExcludedSection && (
            <div className="border-b-2 border-red-200 bg-red-50">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-red-700 flex items-center">
                    <Ban className="w-4 h-4 mr-2" />
                    Produits exclus ({excludedProductsInfo.length})
                  </h3>
                  <button
                    onClick={clearExclusions}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Tout réactiver
                  </button>
                </div>

                <div className="space-y-2">
                  {excludedProductsInfo.map((productInfo, index) => (
                    <motion.div
                      key={`excluded-${productInfo.code}-${index}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-white border-2 border-red-300 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2 mt-2" />
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
                        onClick={() => handleDeselectStoredExclusion(productInfo.code)}
                        className="ml-2 p-1 text-green-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Réactiver ce produit"
                      >
                        <Check className="w-4 h-4" />
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
                <Ban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
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
                  const isExcluded = isProductExcluded(product.code_13_ref);
                  const exclusionType = getExclusionType(product.code_13_ref);

                  return (
                    <motion.div
                      key={product.code_13_ref}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        p-3 border-2 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md
                        ${exclusionType === 'stored'
                          ? 'border-red-400 bg-red-50'
                          : exclusionType === 'new'
                            ? 'border-orange-400 bg-orange-50'
                            : isExcluded
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 hover:border-red-300'
                        }
                      `}
                      onClick={() => handleProductToggle(product.code_13_ref)}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={isExcluded}
                          onChange={() => handleProductToggle(product.code_13_ref)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {product.code_13_ref}
                          </p>

                          {exclusionType === 'stored' && (
                            <div className="flex items-center mt-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                              <span className="text-xs text-red-600 font-medium">
                                Déjà exclu
                              </span>
                            </div>
                          )}

                          {exclusionType === 'new' && (
                            <div className="flex items-center mt-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                              <span className="text-xs text-orange-600 font-medium">
                                Nouvelle exclusion
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

            {!isSearching && !isLoading && excludedProductsInfo.length === 0 && (
              <motion.div
                key="no-exclusion"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center"
              >
                <Ban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Aucun produit exclu</p>
                <p className="text-xs text-gray-400">
                  Utilisez la recherche pour trouver des produits à exclure
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="border-t-2 border-red-100 p-4 space-y-3 bg-red-50">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                applyExclusions();
                onClose();
              }}
              disabled={selectedProducts.size === 0}
              className={`
                flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${selectedProducts.size > 0
                  ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Appliquer exclusions ({selectedProducts.size})
            </button>
            <button
              onClick={() => {
                clearExclusions();
                onClose();
              }}
              className="
                px-4 py-2 text-sm font-medium rounded-lg border
                border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400
                focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                transition-all duration-200
              "
            >
              Tout réactiver
            </button>
          </div>
        </div>

        {/* Tutorial */}
        <div className="border-t border-red-100 p-4 bg-red-50">
          <p className="text-xs text-red-700">
            <strong>Guide :</strong> Lettres: nom • Chiffres: début EAN • *1234: fin EAN • Import multiple disponible
          </p>
        </div>

      </motion.div>
    </>
  );
};