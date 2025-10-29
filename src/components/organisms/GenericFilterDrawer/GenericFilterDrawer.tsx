// src/components/organisms/GenericFilterDrawer/GenericFilterDrawer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Package, TestTube, Search, Loader2, Trash2, Layers } from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';
import { useGenericFilterSearch } from '@/hooks/generic-filters/useGenericFilterSearch';
import { useGenericGroupStore } from '@/stores/useGenericGroupStore';
import { PriceRangeFilters } from '@/components/molecules/PriceRangeFilters/PriceRangeFilters';

interface GenericFilterDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCountChange: (count: number) => void;
  readonly dateRange: { start: string; end: string }; // 🔥 NOUVEAU
}

interface LocalPriceFilters {
  prixFabricant: { min: string; max: string };
  prixNetRemise: { min: string; max: string };
  remise: { min: string; max: string };
}

/**
 * GenericFilterDrawer Component
 * 
 * Drawer unifié pour :
 * - Recherche produits génériques/référents
 * - Recherche laboratoires
 * - Filtres de prix (fabricant, net remise, remise %)
 * 
 * Un seul bouton "Appliquer" pour tout
 */
export const GenericFilterDrawer: React.FC<GenericFilterDrawerProps> = ({
  isOpen,
  onClose,
  onCountChange,
  dateRange // 🔥 RECEPTION
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
    priceFilters,
    hasPriceFilters,
    setPriceFilters,
    clearPriceFilters,
    removeGroup,
    removeProduct,
    removeLaboratory,
    addProducts,
    addLaboratories,
    clearSelection: clearStoreSelection,
    setDateRange // 🔥 IMPORT SETTER
  } = useGenericGroupStore();

  // 🔥 NOUVEAU - Sync dateRange avec store au mount
  useEffect(() => {
    if (isOpen && dateRange) {
      console.log('📅 [GenericFilterDrawer] Setting date range in store:', dateRange);
      setDateRange(dateRange);
    }
  }, [isOpen, dateRange, setDateRange]);

  // State local pour les filtres de prix (pas encore appliqués)
  const [localPriceFilters, setLocalPriceFilters] = useState<LocalPriceFilters>({
    prixFabricant: {
      min: priceFilters.prixFabricant.min?.toString() ?? '',
      max: priceFilters.prixFabricant.max?.toString() ?? ''
    },
    prixNetRemise: {
      min: priceFilters.prixNetRemise.min?.toString() ?? '',
      max: priceFilters.prixNetRemise.max?.toString() ?? ''
    },
    remise: {
      min: priceFilters.remise.min?.toString() ?? '',
      max: priceFilters.remise.max?.toString() ?? ''
    }
  });

  // Sync state local avec store (ex: quand user clique "Réinitialiser")
  useEffect(() => {
    setLocalPriceFilters({
      prixFabricant: {
        min: priceFilters.prixFabricant.min?.toString() ?? '',
        max: priceFilters.prixFabricant.max?.toString() ?? ''
      },
      prixNetRemise: {
        min: priceFilters.prixNetRemise.min?.toString() ?? '',
        max: priceFilters.prixNetRemise.max?.toString() ?? ''
      },
      remise: {
        min: priceFilters.remise.min?.toString() ?? '',
        max: priceFilters.remise.max?.toString() ?? ''
      }
    });
  }, [priceFilters]);

  if (!isOpen) return null;

  // Vérifier si les filtres prix locaux diffèrent du store
  const hasPriceChanges = () => {
    return (
      localPriceFilters.prixFabricant.min !== (priceFilters.prixFabricant.min?.toString() ?? '') ||
      localPriceFilters.prixFabricant.max !== (priceFilters.prixFabricant.max?.toString() ?? '') ||
      localPriceFilters.prixNetRemise.min !== (priceFilters.prixNetRemise.min?.toString() ?? '') ||
      localPriceFilters.prixNetRemise.max !== (priceFilters.prixNetRemise.max?.toString() ?? '') ||
      localPriceFilters.remise.min !== (priceFilters.remise.min?.toString() ?? '') ||
      localPriceFilters.remise.max !== (priceFilters.remise.max?.toString() ?? '')
    );
  };

  const localSelectedCount = selectedProducts.size + selectedLaboratories.size;
  const storeSelectedCount = selectedGroups.length + storedProducts.length + storedLaboratories.length;
  
  // Total changements à appliquer
  const totalChanges = localSelectedCount + (hasPriceChanges() ? 1 : 0);

  React.useEffect(() => {
    onCountChange(productCodes.length);
  }, [productCodes.length, onCountChange]);

  // Handler unifié : applique TOUT (produits + labos + prix)
  const handleApplyAll = async () => {
    const productsToAdd = getSelectedProductsArray();
    const laboratoriesToAdd = getSelectedLaboratoriesArray();
    
    console.log('');
    console.log('🚀 [GenericFilterDrawer] ========================================');
    console.log('🚀 [GenericFilterDrawer] APPLYING ALL FILTERS');
    console.log('🚀 [GenericFilterDrawer] ========================================');
    console.log('📊 [GenericFilterDrawer] Changes to apply:', {
      products: productsToAdd.length,
      laboratories: laboratoriesToAdd.length,
      priceFiltersChanged: hasPriceChanges(),
      dateRange // 🔥 LOG DATE RANGE
    });

    // 1. Appliquer sélections produits/labos
    if (productsToAdd.length > 0) {
      console.log('📦 [GenericFilterDrawer] Adding products:', productsToAdd.length);
      addProducts(productsToAdd);
    }
    
    if (laboratoriesToAdd.length > 0) {
      console.log('🧪 [GenericFilterDrawer] Adding laboratories:', laboratoriesToAdd.length);
      addLaboratories(laboratoriesToAdd);
    }
    
    // 2. Appliquer filtres prix si modifiés (ASYNC + AWAIT)
    if (hasPriceChanges()) {
      console.log('💰 [GenericFilterDrawer] Price filters changed, applying...');
      
      const newFilters = {
        prixFabricant: {
          min: localPriceFilters.prixFabricant.min === '' ? null : parseFloat(localPriceFilters.prixFabricant.min),
          max: localPriceFilters.prixFabricant.max === '' ? null : parseFloat(localPriceFilters.prixFabricant.max)
        },
        prixNetRemise: {
          min: localPriceFilters.prixNetRemise.min === '' ? null : parseFloat(localPriceFilters.prixNetRemise.min),
          max: localPriceFilters.prixNetRemise.max === '' ? null : parseFloat(localPriceFilters.prixNetRemise.max)
        },
        remise: {
          min: localPriceFilters.remise.min === '' ? null : parseFloat(localPriceFilters.remise.min),
          max: localPriceFilters.remise.max === '' ? null : parseFloat(localPriceFilters.remise.max)
        }
      };
      
      console.log('💰 [GenericFilterDrawer] New filters:', newFilters);
      
      // AWAIT ICI !
      await setPriceFilters(newFilters);
      
      console.log('✅ [GenericFilterDrawer] Price filters applied successfully');
    } else {
      console.log('ℹ️ [GenericFilterDrawer] No price filter changes');
    }
    
    // 3. Clear les sélections locales après application
    console.log('🧹 [GenericFilterDrawer] Clearing local selections');
    clearAllSelections();
    
    console.log('✅ [GenericFilterDrawer] ALL FILTERS APPLIED SUCCESSFULLY');
    console.log('🚀 [GenericFilterDrawer] ========================================');
    console.log('');
  };

  const handleClearAll = () => {
    console.log('🗑️ [GenericFilterDrawer] Clear ALL selections and filters');
    clearStoreSelection();
    clearAllSelections();
  };

  const handleClearPriceFilters = () => {
    clearPriceFilters();
    // State local sera sync via useEffect
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Filter className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Filtres Génériques
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">
                  <span className="font-medium text-purple-600">{localSelectedCount}</span> nouveaux
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-600">
                  <span className="font-medium text-blue-600">{storeSelectedCount}</span> appliqués
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-600">
                  <span className="font-medium text-green-600">{productCodes.length}</span> codes
                </span>
              </div>
              
              {(storeSelectedCount > 0 || hasPriceFilters()) && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Tout effacer</span>
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="h-[calc(100%-140px)] overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              
              {/* SÉLECTIONS ACTIVES DANS LE STORE */}
              {(selectedGroups.length > 0 || storedProducts.length > 0 || storedLaboratories.length > 0) && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Sélections actives</h3>
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
                                ${product.bcb_generic_status === 'RÉFÉRENT' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-blue-100 text-blue-700'}
                              `}>
                                {product.bcb_generic_status}
                              </span>
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
                              {lab.product_codes.length} produits ({lab.generic_count} génériques, {lab.referent_count} référents)
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

              {/* RECHERCHE PRODUITS */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-pink-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Rechercher un produit</h3>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Nom ou code produit..."
                    className="pl-10"
                  />
                </div>

                {/* Résultats produits */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {isLoadingProducts && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  )}

                  {errorProducts && (
                    <p className="text-sm text-red-600 py-2">{errorProducts}</p>
                  )}

                  {!isLoadingProducts && !errorProducts && products.length === 0 && productQuery.length >= 2 && (
                    <p className="text-sm text-gray-500 py-2">Aucun produit trouvé</p>
                  )}

                  {!isLoadingProducts && products.map((product) => (
                    <button
                      key={product.code_13_ref}
                      onClick={() => toggleProduct(product)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedProducts.has(product.code_13_ref)
                          ? 'bg-pink-50 border-pink-300 ring-2 ring-pink-200'
                          : 'bg-white border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`
                          px-2 py-0.5 rounded text-xs font-medium
                          ${product.bcb_generic_status === 'RÉFÉRENT' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'}
                        `}>
                          {product.bcb_generic_status}
                        </span>
                        <span className="text-xs text-gray-500">{product.bcb_lab}</span>
                        <span className="text-xs text-gray-400">{product.code_13_ref}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* RECHERCHE LABORATOIRES */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <TestTube className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Rechercher un laboratoire</h3>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={laboratoryQuery}
                    onChange={(e) => setLaboratoryQuery(e.target.value)}
                    placeholder="Nom du laboratoire..."
                    className="pl-10"
                  />
                </div>

                {/* Résultats laboratoires */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {isLoadingLaboratories && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  )}

                  {errorLaboratories && (
                    <p className="text-sm text-red-600 py-2">{errorLaboratories}</p>
                  )}

                  {!isLoadingLaboratories && !errorLaboratories && laboratories.length === 0 && laboratoryQuery.length >= 2 && (
                    <p className="text-sm text-gray-500 py-2">Aucun laboratoire trouvé</p>
                  )}

                  {!isLoadingLaboratories && laboratories.map((lab) => (
                    <button
                      key={lab.laboratory_name}
                      onClick={() => toggleLaboratory(lab)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedLaboratories.has(lab.laboratory_name)
                          ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200'
                          : 'bg-white border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {lab.laboratory_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {lab.product_count} produits ({lab.generic_count} génériques, {lab.referent_count} référents)
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* FILTRES DE PRIX - EN BAS */}
              <div className="pt-4 border-t border-gray-200">
                <PriceRangeFilters
                  localFilters={localPriceFilters}
                  onFiltersChange={setLocalPriceFilters}
                  onClear={handleClearPriceFilters}
                  hasActiveFilters={hasPriceFilters()}
                />
              </div>
            </div>
          </div>

          {/* Footer - BOUTON APPLIQUER UNIFIÉ */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <button
              onClick={handleApplyAll}
              disabled={totalChanges === 0}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                totalChanges > 0
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Appliquer {totalChanges > 0 && `(${totalChanges === 1 && !hasPriceChanges() ? `${totalChanges} nouveau` : totalChanges > 1 && !hasPriceChanges() ? `${totalChanges} nouveaux` : hasPriceChanges() && localSelectedCount === 0 ? 'filtres prix' : 'tout'})`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};