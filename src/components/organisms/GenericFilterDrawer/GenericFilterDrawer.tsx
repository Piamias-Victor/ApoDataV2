// src/components/organisms/GenericFilterDrawer/GenericFilterDrawer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Package, TestTube, Search, Loader2, Trash2, Layers, Tag } from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';
import { useGenericFilterSearch } from '@/hooks/generic-filters/useGenericFilterSearch';
import { useGenericGroupStore } from '@/stores/useGenericGroupStore';
import { PriceRangeFilters } from '@/components/molecules/PriceRangeFilters/PriceRangeFilters';
import { TvaRateFilter } from '@/components/atoms/TvaRateFilter/TvaRateFilter';
import { GenericStatusFilter } from '@/components/atoms/GenericStatusFilter/GenericStatusFilter';

interface GenericFilterDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCountChange: (count: number) => void;
  readonly dateRange: { start: string; end: string };
}

interface LocalPriceFilters {
  prixFabricant: { min: string; max: string };
  prixNetRemise: { min: string; max: string };
  remise: { min: string; max: string };
}

type GenericStatus = 'BOTH' | 'GÉNÉRIQUE' | 'RÉFÉRENT';

export const GenericFilterDrawer: React.FC<GenericFilterDrawerProps> = ({
  isOpen,
  onClose,
  onCountChange,
  dateRange
}) => {
  const {
    labOrBrandMode, // NOUVEAU
    setLabOrBrandMode, // NOUVEAU
    
    products,
    isLoadingProducts,
    errorProducts,
    productQuery,
    setProductQuery,
    selectedProducts,
    toggleProduct,
    
    laboratories,
    isLoadingLaboratories,
    errorLaboratories,
    laboratoryQuery,
    setLaboratoryQuery,
    selectedLaboratories,
    toggleLaboratory,
    
    getSelectedProductsArray,
    getSelectedLaboratoriesArray,
    clearAllSelections
  } = useGenericFilterSearch();

  const { 
    selectedGroups,
    selectedProducts: storedProducts,
    selectedLaboratories: storedLaboratories,
    productCodes,
    priceFilters,
    tvaRates,
    genericStatus,
    hasPriceFilters,
    setPriceFilters,
    clearPriceFilters,
    removeGroup,
    removeProduct,
    removeLaboratory,
    addProducts,
    addLaboratories,
    clearSelection: clearStoreSelection,
    setDateRange
  } = useGenericGroupStore();

  // States locaux pour les filtres
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

  const [localTvaRates, setLocalTvaRates] = useState<number[]>(tvaRates);
  const [localGenericStatus, setLocalGenericStatus] = useState<GenericStatus>(genericStatus);

  // Sync dateRange avec store au mount
  useEffect(() => {
    if (isOpen && dateRange) {
      console.log('📅 [GenericFilterDrawer] Setting date range in store:', dateRange);
      setDateRange(dateRange);
    }
  }, [isOpen, dateRange, setDateRange]);

  // Sync states locaux avec store
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
    setLocalTvaRates(tvaRates);
    setLocalGenericStatus(genericStatus);
  }, [priceFilters, tvaRates, genericStatus]);

  if (!isOpen) return null;

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

  const hasTvaChanges = () => {
    if (localTvaRates.length !== tvaRates.length) return true;
    return !localTvaRates.every(rate => tvaRates.includes(rate));
  };

  const hasStatusChanges = () => {
    return localGenericStatus !== genericStatus;
  };

  const hasAnyFilterChanges = () => {
    return hasPriceChanges() || hasTvaChanges() || hasStatusChanges();
  };

  const localSelectedCount = selectedProducts.size + selectedLaboratories.size;
  const storeSelectedCount = selectedGroups.length + storedProducts.length + storedLaboratories.length;
  
  const totalChanges = localSelectedCount + (hasAnyFilterChanges() ? 1 : 0);

  React.useEffect(() => {
    onCountChange(productCodes.length);
  }, [productCodes.length, onCountChange]);

  const handleApplyAll = async () => {
    const productsToAdd = getSelectedProductsArray();
    const laboratoriesToAdd = getSelectedLaboratoriesArray();
    
    console.log('🚀 [GenericFilterDrawer] APPLYING ALL FILTERS');

    if (productsToAdd.length > 0) {
      addProducts(productsToAdd);
    }
    
    if (laboratoriesToAdd.length > 0) {
      addLaboratories(laboratoriesToAdd);
    }
    
    if (hasAnyFilterChanges()) {
      const { setTvaRates, setGenericStatus } = useGenericGroupStore.getState();
      
      if (hasTvaChanges()) {
        setTvaRates(localTvaRates);
      }
      
      if (hasStatusChanges()) {
        setGenericStatus(localGenericStatus);
      }
      
      if (hasPriceChanges()) {
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
        
        await setPriceFilters(newFilters);
      }
    }
    
    clearAllSelections();
  };

  const handleClearAll = () => {
    clearStoreSelection();
    clearAllSelections();
  };

  const handleClearPriceFilters = () => {
    clearPriceFilters();
  };

  const hasActiveFilters = hasPriceFilters() || tvaRates.length > 0 || genericStatus !== 'BOTH';

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
              
              {(storeSelectedCount > 0 || hasActiveFilters) && (
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
              
              {/* SÉLECTIONS ACTIVES - identique */}
              {(selectedGroups.length > 0 || storedProducts.length > 0 || storedLaboratories.length > 0 || hasActiveFilters) && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Sélections actives</h3>
                  </div>

                  {/* FILTRES ACTIFS */}
                  {hasActiveFilters && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                      <p className="text-xs font-medium text-indigo-700 uppercase tracking-wider">
                        ⚡ Filtres appliqués
                      </p>
                      
                      {tvaRates.length > 0 && (
                        <div className="text-xs text-gray-700">
                          <span className="font-medium">TVA :</span> {tvaRates.sort((a, b) => a - b).join('%, ')}%
                        </div>
                      )}
                      
                      {genericStatus !== 'BOTH' && (
                        <div className="text-xs text-gray-700">
                          <span className="font-medium">Type :</span> {genericStatus}
                        </div>
                      )}
                      
                      {hasPriceFilters() && (
                        <div className="text-xs text-gray-700">
                          <span className="font-medium">Prix :</span> Filtres de prix actifs
                        </div>
                      )}
                    </div>
                  )}

                  {/* Groupes/Produits/Labos - identique */}
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
                              {lab.product_codes.length} produits
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

              {/* 🔥 NOUVEAU - DEUX INPUTS SÉPARÉS AU LIEU DU TOGGLE */}
              
              {/* 1. RECHERCHE PAR MARQUE (bcb_lab = exploitant) */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Recherche par Marque</h3>
                  <span className="text-xs text-gray-500">(Exploitant)</span>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={labOrBrandMode === 'laboratory' ? laboratoryQuery : ''}
                    onChange={(e) => {
                      setLabOrBrandMode('laboratory');
                      setLaboratoryQuery(e.target.value);
                    }}
                    placeholder="Rechercher une marque..."
                    className="pl-10"
                  />
                </div>

                {labOrBrandMode === 'laboratory' && (
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
                      <p className="text-sm text-gray-500 py-2">Aucune marque trouvée</p>
                    )}

                    {!isLoadingLaboratories && laboratories.map((lab) => (
                      <button
                        key={lab.laboratory_name}
                        onClick={() => toggleLaboratory(lab)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedLaboratories.has(lab.laboratory_name)
                            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                            : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {lab.laboratory_name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {lab.product_count} produits ({lab.generic_count} génériques, {lab.referent_count} référents)
                            </p>
                          </div>
                          <Tag className="w-4 h-4 text-blue-500 ml-2" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. RECHERCHE PAR LABORATOIRE (bcb_brand = titulaire) */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <TestTube className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Recherche par Laboratoire</h3>
                  <span className="text-xs text-gray-500">(Titulaire AMM)</span>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={labOrBrandMode === 'brand' ? laboratoryQuery : ''}
                    onChange={(e) => {
                      setLabOrBrandMode('brand');
                      setLaboratoryQuery(e.target.value);
                    }}
                    placeholder="Rechercher un laboratoire..."
                    className="pl-10"
                  />
                </div>

                {labOrBrandMode === 'brand' && (
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
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {lab.laboratory_name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {lab.product_count} produits ({lab.generic_count} génériques, {lab.referent_count} référents)
                            </p>
                          </div>
                          <TestTube className="w-4 h-4 text-purple-500 ml-2" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. RECHERCHE PRODUITS */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
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

              {/* 4. FILTRE GÉNÉRIQUE/RÉFÉRENT */}
              <div className="pt-4 border-t border-gray-200">
                <GenericStatusFilter
                  value={localGenericStatus}
                  onChange={setLocalGenericStatus}
                />
              </div>

              {/* 5. FILTRE TVA */}
              <div className="pt-4 border-t border-gray-200">
                <TvaRateFilter
                  selectedRates={localTvaRates}
                  onChange={setLocalTvaRates}
                />
              </div>

              {/* 6. FILTRES DE PRIX */}
              <div className="pt-4 border-t border-gray-200">
                <PriceRangeFilters
                  localFilters={localPriceFilters}
                  onFiltersChange={setLocalPriceFilters}
                  onClear={handleClearPriceFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
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
              Appliquer {totalChanges > 0 && `(${totalChanges === 1 && !hasAnyFilterChanges() ? `${totalChanges} nouveau` : totalChanges > 1 && !hasAnyFilterChanges() ? `${totalChanges} nouveaux` : hasAnyFilterChanges() && localSelectedCount === 0 ? 'filtres' : 'tout'})`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};