// src/components/organisms/LaboratoriesDrawer/LaboratoriesDrawer.tsx
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, TestTube, Package, Check } from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';
import { useLaboratorySearch } from '@/hooks/laboratories/useLaboratorySearch';
import { useFiltersStore } from '@/stores/useFiltersStore';

interface LaboratoriesDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCountChange: (count: number) => void;
}

/**
 * LaboratoriesDrawer Component - VERSION SIMPLIFIÉE AVEC STORE
 * 
 * NOUVELLES FONCTIONNALITÉS :
 * - Section "Laboratoires sélectionnés" avec noms depuis le store
 * - Désélection rapide individuelle
 * - Pas d'API supplémentaire nécessaire
 * - Indicateurs visuels conservés (violet/vert)
 */
export const LaboratoriesDrawer: React.FC<LaboratoriesDrawerProps> = ({
  isOpen,
  onClose,
  onCountChange
}) => {
  const {
    laboratories,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    selectedLaboratories,
    toggleLaboratory,
    applyFilters,
    clearLaboratoryFilters,
    pendingProductCodes,
    getSelectedLaboratoriesFromStore
  } = useLaboratorySearch();

  // Accès au store - SIMPLIFIÉ
  const storedLaboratoryCodes = useFiltersStore(state => state.laboratories);
  const selectedLaboratoriesInfo = getSelectedLaboratoriesFromStore(); // Direct depuis le store

  // Update count when selection changes
  useEffect(() => {
    onCountChange(pendingProductCodes.size);
  }, [pendingProductCodes.size, onCountChange]);

  const handleLaboratoryToggle = (labName: string, productCodes: string[]) => {
    toggleLaboratory(labName, productCodes);
  };

  // Fonction pour désélectionner un laboratoire du store
  const handleDeselectStoredLaboratory = (labName: string) => {
    console.log('🗑️ [LaboratoriesDrawer] Deselecting stored laboratory:', labName);
    
    // Filtrer ce laboratoire des sélections du store
    const remainingLabs = selectedLaboratoriesInfo.filter(lab => lab.name !== labName);
    const remainingCodes = remainingLabs.flatMap(lab => lab.productCodes);
    
    // Mettre à jour le store
    const setLaboratoryFiltersWithNames = useFiltersStore.getState().setLaboratoryFiltersWithNames;
    setLaboratoryFiltersWithNames(remainingCodes, remainingLabs);
  };

  // Vérifier si un laboratoire est sélectionné
  const isLaboratorySelected = (labName: string, productCodes: string[]): boolean => {
    if (selectedLaboratories.has(labName)) {
      return true;
    }
    if (productCodes.length > 0 && productCodes.every(code => storedLaboratoryCodes.includes(code))) {
      return true;
    }
    return false;
  };

  // Déterminer le type de sélection pour l'affichage visuel
  const getSelectionType = (labName: string, productCodes: string[]): 'new' | 'stored' | 'none' => {
    if (selectedLaboratories.has(labName)) {
      return 'new';
    }
    if (productCodes.length > 0 && productCodes.every(code => storedLaboratoryCodes.includes(code))) {
      return 'stored';
    }
    return 'none';
  };

  const hasResults = laboratories.length > 0;
  const showEmptyMessage = searchQuery.length >= 2 && !isLoading && !hasResults && !error;
  const isSearching = searchQuery.length >= 2;
  const showSelectedSection = !isSearching && selectedLaboratoriesInfo.length > 0;

  const getPlaceholderText = () => {
    return searchMode === 'laboratory' 
      ? 'Rechercher un laboratoire...'
      : 'Rechercher un produit (3+ caractères)...';
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
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TestTube className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Laboratoires
              </h2>
              <p className="text-sm text-gray-500">
                {pendingProductCodes.size} codes produits sélectionnés
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
        <div className="p-4 border-b border-gray-100">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSearchMode('laboratory')}
              className={`
                flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                ${searchMode === 'laboratory'
                  ? 'bg-white text-purple-600 shadow-sm border border-purple-200'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <TestTube className="w-4 h-4 inline mr-2" />
              Laboratoire
            </button>
            <button
              onClick={() => setSearchMode('product')}
              className={`
                flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                ${searchMode === 'product'
                  ? 'bg-white text-purple-600 shadow-sm border border-purple-200'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Produit
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder={getPlaceholderText()}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          
          {/* SECTION LABORATOIRES SÉLECTIONNÉS - SIMPLIFIÉE */}
          {showSelectedSection && (
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Laboratoires sélectionnés ({selectedLaboratoriesInfo.length})
                  </h3>
                  <button
                    onClick={clearLaboratoryFilters}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Tout effacer
                  </button>
                </div>
                
                <div className="space-y-2">
                  {selectedLaboratoriesInfo.map((labInfo, index) => (
                    <motion.div
                      key={`selected-${labInfo.name}-${index}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-white border border-purple-200 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {labInfo.name}
                          </span>
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                          {labInfo.productCount} produits • Déjà appliqué
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleDeselectStoredLaboratory(labInfo.name)}
                        className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Désélectionner ce laboratoire"
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
                <TestTube className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Aucun laboratoire trouvé</p>
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
                {laboratories.map((laboratory, index) => {
                  const isSelected = isLaboratorySelected(laboratory.laboratory_name, laboratory.product_codes);
                  const selectionType = getSelectionType(laboratory.laboratory_name, laboratory.product_codes);

                  return (
                    <motion.div
                      key={`${laboratory.laboratory_name}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md
                        ${selectionType === 'stored' 
                          ? 'border-purple-300 bg-purple-50' 
                          : selectionType === 'new'
                          ? 'border-green-300 bg-green-50'
                          : isSelected 
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                      onClick={() => handleLaboratoryToggle(laboratory.laboratory_name, laboratory.product_codes)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-2">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {laboratory.laboratory_name}
                            </h3>
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-600 mb-2">
                            <Package className="w-3 h-3 mr-1" />
                            <span>{laboratory.product_count} produits</span>
                          </div>

                          {/* Indicateurs visuels */}
                          {selectionType === 'stored' && (
                            <div className="flex items-center mb-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                              <span className="text-xs text-purple-600 font-medium">
                                Déjà appliqué
                              </span>
                            </div>
                          )}
                          
                          {selectionType === 'new' && (
                            <div className="flex items-center mb-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                              <span className="text-xs text-green-600 font-medium">
                                Nouvelle sélection
                              </span>
                            </div>
                          )}
                          
                          {/* Produits correspondants en mode produit */}
                          {searchMode === 'product' && laboratory.matching_products && laboratory.matching_products.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {laboratory.matching_products.slice(0, 3).map((product, productIndex) => (
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
                              {laboratory.matching_products.length > 3 && (
                                <div className="text-xs text-gray-500 pl-3">
                                  +{laboratory.matching_products.length - 3} autres produits...
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleLaboratoryToggle(laboratory.laboratory_name, laboratory.product_codes)}
                          className="mt-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Message quand aucune recherche et aucun laboratoire sélectionné */}
            {!isSearching && !isLoading && selectedLaboratoriesInfo.length === 0 && (
              <motion.div
                key="no-selection"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center"
              >
                <TestTube className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Aucun laboratoire sélectionné</p>
                <p className="text-xs text-gray-400">
                  Utilisez la recherche pour trouver des laboratoires
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
              disabled={selectedLaboratories.size === 0}
              className={`
                flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${selectedLaboratories.size > 0
                  ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Appliquer ({selectedLaboratories.size})
            </button>
            <button
              onClick={() => {
                clearLaboratoryFilters();
                onClose();
              }}
              className="
                px-4 py-2 text-sm font-medium rounded-lg border
                border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400
                focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                transition-all duration-200
              "
            >
              Effacer labos
            </button>
          </div>
        </div>

        {/* Tutorial */}
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          {searchMode === 'laboratory' ? (
            <p className="text-xs text-gray-600">
              <strong>Mode Laboratoire :</strong> Recherche directe par nom de laboratoire
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-600">
                <strong>Mode Produit :</strong> Lettres: nom produit • Chiffres: début EAN • *1234: fin EAN
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Trouvez un produit pour sélectionner tout son laboratoire
              </p>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
};