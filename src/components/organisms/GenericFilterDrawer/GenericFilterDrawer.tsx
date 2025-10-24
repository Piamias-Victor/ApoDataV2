// src/components/organisms/GenericFilterDrawer/GenericFilterDrawer.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Package, TestTube, Search, Loader2, Trash2, Layers } from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';
import { useGenericFilterSearch } from '@/hooks/generic-filters/useGenericFilterSearch';
import { useGenericGroupStore } from '@/stores/useGenericGroupStore';

interface GenericFilterDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCountChange: (count: number) => void;
}

/**
 * GenericFilterDrawer Component
 * 
 * Recherche par :
 * - Produits génériques/référents
 * - Laboratoires avec produits génériques/référents
 * 
 * Met à jour useGenericGroupStore avec les sélections
 * Affiche les sélections actives (groupes, produits, laboratoires)
 */
export const GenericFilterDrawer: React.FC<GenericFilterDrawerProps> = ({
  isOpen,
  onClose,
  onCountChange
}) => {
  const {
    // Products
    products,
    isLoadingProducts,
    errorProducts,
    productQuery,
    setProductQuery,
    selectedProducts,
    toggleProduct,
    
    // Laboratories
    laboratories,
    isLoadingLaboratories,
    errorLaboratories,
    laboratoryQuery,
    setLaboratoryQuery,
    selectedLaboratories,
    toggleLaboratory,
    
    // Global
    getSelectedProductsArray,
    getSelectedLaboratoriesArray,
    clearAllSelections
  } = useGenericFilterSearch();

  // Accès au store
  const { 
    selectedGroups,
    selectedProducts: storedProducts,
    selectedLaboratories: storedLaboratories,
    productCodes,
    removeGroup,
    removeProduct,
    removeLaboratory,
    addProducts,
    addLaboratories,
    clearSelection: clearStoreSelection
  } = useGenericGroupStore();

  if (!isOpen) return null;

  const localSelectedCount = selectedProducts.size + selectedLaboratories.size;
  const storeSelectedCount = selectedGroups.length + storedProducts.length + storedLaboratories.length;

  React.useEffect(() => {
    onCountChange(productCodes.length);
  }, [productCodes.length, onCountChange]);

  // Handler pour appliquer les filtres au store
  const handleApplyFilters = () => {
    const productsToAdd = getSelectedProductsArray();
    const laboratoriesToAdd = getSelectedLaboratoriesArray();
    
    console.log('📊 [GenericFilterDrawer] Applying filters to store:', {
      selectedProducts: productsToAdd.length,
      selectedLaboratories: laboratoriesToAdd.length
    });

    // Mettre à jour le store avec les nouvelles sélections
    if (productsToAdd.length > 0) {
      addProducts(productsToAdd);
    }
    
    if (laboratoriesToAdd.length > 0) {
      addLaboratories(laboratoriesToAdd);
    }
    
    // Clear les sélections locales après application (Option A)
    clearAllSelections();
    
    // Optionnel : fermer le drawer après application
    // onClose();
  };

  // Handler pour effacer tout
  const handleClearAll = () => {
    console.log('🗑️ [GenericFilterDrawer] Clearing all selections (local + store)');
    clearAllSelections();
    clearStoreSelection();
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        className="fixed top-0 right-0 h-full w-[600px] z-50 bg-white shadow-strong border-l border-gray-200 flex flex-col"
        initial={{ x: 600 }}
        animate={{ x: 0 }}
        exit={{ x: 600 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Filter className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Filtres Génériques
              </h2>
              <p className="text-xs text-gray-500">
                {localSelectedCount} en attente • {storeSelectedCount} actif{storeSelectedCount > 1 ? 's' : ''} • {productCodes.length} produits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="
              p-2 rounded-lg hover:bg-gray-100 
              text-gray-500 hover:text-gray-700
              transition-colors
            "
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* ===== SÉLECTIONS ACTIVES ===== */}
          {storeSelectedCount > 0 && (
            <div className="space-y-3 pb-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Sélections Actives
                  </h3>
                </div>
                <button
                  onClick={clearStoreSelection}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Tout effacer
                </button>
              </div>

              {/* Groupes génériques */}
              {selectedGroups.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    🏷️ Groupes génériques ({selectedGroups.length})
                  </p>
                  {selectedGroups.map((group) => (
                    <div
                      key={group.generic_group}
                      className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {group.generic_group}
                        </p>
                        <p className="text-xs text-gray-500">
                          {group.product_codes.length} produits
                        </p>
                      </div>
                      <button
                        onClick={() => removeGroup(group.generic_group)}
                        className="ml-2 p-1.5 hover:bg-red-100 rounded-lg text-red-600 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Produits individuels */}
              {storedProducts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📦 Produits individuels ({storedProducts.length})
                  </p>
                  {storedProducts.map((product) => (
                    <div
                      key={product.code_13_ref}
                      className="flex items-center justify-between p-2 bg-pink-50 border border-pink-200 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center space-x-2">
                          <span className={`
                            px-2 py-0.5 rounded text-xs font-medium
                            ${product.bcb_generic_status === 'RÉFÉRENT' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                          `}>
                            {product.bcb_generic_status}
                          </span>
                          <span>•</span>
                          <span>{product.bcb_lab}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => removeProduct(product.code_13_ref)}
                        className="ml-2 p-1.5 hover:bg-red-100 rounded-lg text-red-600 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Laboratoires */}
              {storedLaboratories.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    🧪 Laboratoires ({storedLaboratories.length})
                  </p>
                  {storedLaboratories.map((lab) => (
                    <div
                      key={lab.laboratory_name}
                      className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {lab.laboratory_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {lab.product_count} produits • {lab.generic_count} génériques • {lab.referent_count} référents
                        </p>
                      </div>
                      <button
                        onClick={() => removeLaboratory(lab.laboratory_name)}
                        className="ml-2 p-1.5 hover:bg-red-100 rounded-lg text-red-600 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== RECHERCHE PRODUITS ===== */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-pink-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Recherche Produits
              </h3>
            </div>
            
            <div className="relative">
              <Input
                type="text"
                placeholder="Nom produit, début EAN, *fin EAN..."
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {isLoadingProducts && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>

            <p className="text-xs text-gray-500">
              Lettres: nom produit • Chiffres: début EAN • *1234: fin EAN
            </p>

            {/* Products Results */}
            <AnimatePresence mode="wait">
              {productQuery.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2 max-h-64 overflow-y-auto"
                >
                  {isLoadingProducts ? (
                    <div className="text-center py-4 text-sm text-gray-500">
                      Recherche en cours...
                    </div>
                  ) : errorProducts ? (
                    <div className="text-center py-4 text-sm text-red-600">
                      {errorProducts}
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-500">
                      Aucun produit trouvé
                    </div>
                  ) : (
                    products.map((product) => {
                      const isSelected = selectedProducts.has(product.code_13_ref);
                      
                      return (
                        <motion.div
                          key={product.code_13_ref}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`
                            p-3 border-2 rounded-lg cursor-pointer transition-all duration-200
                            ${isSelected 
                              ? 'border-pink-500 bg-pink-50' 
                              : 'border-gray-200 hover:border-pink-200 bg-white'
                            }
                          `}
                          onClick={() => toggleProduct(product)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {product.name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5 flex items-center space-x-2">
                                <span className={`
                                  px-2 py-0.5 rounded text-xs font-medium
                                  ${product.bcb_generic_status === 'RÉFÉRENT' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                                `}>
                                  {product.bcb_generic_status}
                                </span>
                                <span>•</span>
                                <span>{product.bcb_lab}</span>
                              </p>
                              <p className="text-xs text-gray-400 mt-1 font-mono">
                                {product.code_13_ref}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleProduct(product)}
                              className="mt-2 w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                            />
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ===== RECHERCHE LABORATOIRES ===== */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <TestTube className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Recherche Laboratoires
              </h3>
            </div>
            
            <div className="relative">
              <Input
                type="text"
                placeholder="Nom laboratoire..."
                value={laboratoryQuery}
                onChange={(e) => setLaboratoryQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {isLoadingLaboratories && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>

            <p className="text-xs text-gray-500">
              Recherche par nom de laboratoire (génériques uniquement)
            </p>

            {/* Laboratories Results */}
            <AnimatePresence mode="wait">
              {laboratoryQuery.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2 max-h-64 overflow-y-auto"
                >
                  {isLoadingLaboratories ? (
                    <div className="text-center py-4 text-sm text-gray-500">
                      Recherche en cours...
                    </div>
                  ) : errorLaboratories ? (
                    <div className="text-center py-4 text-sm text-red-600">
                      {errorLaboratories}
                    </div>
                  ) : laboratories.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-500">
                      Aucun laboratoire trouvé
                    </div>
                  ) : (
                    laboratories.map((lab) => {
                      const isSelected = selectedLaboratories.has(lab.laboratory_name);
                      
                      return (
                        <motion.div
                          key={lab.laboratory_name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`
                            p-3 border-2 rounded-lg cursor-pointer transition-all duration-200
                            ${isSelected 
                              ? 'border-purple-500 bg-purple-50' 
                              : 'border-gray-200 hover:border-purple-200 bg-white'
                            }
                          `}
                          onClick={() => toggleLaboratory(lab)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {lab.laboratory_name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {lab.product_count} produits • {lab.generic_count} génériques • {lab.referent_count} référents
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleLaboratory(lab)}
                              className="mt-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={handleApplyFilters}
              disabled={localSelectedCount === 0}
              className={`
                flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${localSelectedCount > 0
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Appliquer ({localSelectedCount})
            </button>
            <button
              onClick={handleClearAll}
              disabled={storeSelectedCount === 0 && localSelectedCount === 0}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                ${storeSelectedCount > 0 || localSelectedCount > 0
                  ? 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};