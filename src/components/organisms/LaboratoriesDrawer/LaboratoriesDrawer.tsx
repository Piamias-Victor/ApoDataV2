// src/components/organisms/LaboratoriesDrawer/LaboratoriesDrawer.tsx
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, TestTube, Package, HelpCircle } from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';
import { useLaboratorySearch, SearchMode } from '@/hooks/laboratories/useLaboratorySearch';
import { useFiltersStore } from '@/stores/useFiltersStore';

interface LaboratoriesDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCountChange: (count: number) => void;
}

/**
 * LaboratoriesDrawer Component - AVEC PERSISTANCE VISUELLE
 * 
 * CORRECTIONS :
 * - Détection des laboratoires déjà dans le store
 * - Affichage visuel différencié (store vs nouvelles sélections)
 * - Persistance des checkboxes entre ouvertures
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
    pendingProductCodes
  } = useLaboratorySearch();

  // Accès au store pour vérifier les laboratoires déjà appliqués
  const storedLaboratoryCodes = useFiltersStore(state => state.laboratories);

  // Update count when selection changes - utiliser pendingProductCodes pour le count total
  useEffect(() => {
    onCountChange(pendingProductCodes.size);
  }, [pendingProductCodes.size, onCountChange]);

  const handleLaboratoryToggle = (labName: string, productCodes: string[]) => {
    toggleLaboratory(labName, productCodes);
  };

  // CORRECTION : Vérifier si un laboratoire est sélectionné (store OU nouvelles sélections)
  const isLaboratorySelected = (labName: string, productCodes: string[]): boolean => {
    // Vérifier si ce laboratoire est dans les nouvelles sélections
    if (selectedLaboratories.has(labName)) {
      return true;
    }

    // Vérifier si ce laboratoire est déjà dans le store
    // (tous ses codes produits sont dans le store)
    if (productCodes.length > 0 && productCodes.every(code => storedLaboratoryCodes.includes(code))) {
      return true;
    }

    return false;
  };

  // NOUVEAU : Déterminer le type de sélection pour l'affichage visuel
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

  const getPlaceholderText = () => {
    return searchMode === 'laboratory' 
      ? 'Rechercher un laboratoire...' 
      : 'Rechercher un produit...';
  };

  const getResultCountText = (count: number, mode: SearchMode) => {
    if (mode === 'laboratory') {
      return `${count} produit${count > 1 ? 's' : ''}`;
    } else {
      return `${count} produit${count > 1 ? 's trouvés' : ' trouvé'}`;
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <TestTube className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Laboratoires</h2>
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
                <strong>Laboratoire :</strong> Recherche directe<br/>
                <strong>Produit :</strong> Trouve les laboratoires via leurs produits
              </div>
            </div>
          </div>
          <div className="flex mt-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setSearchMode('laboratory')}
              className={`
                flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2
                ${searchMode === 'laboratory'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <TestTube className="w-4 h-4" />
              <span>Laboratoire</span>
            </button>
            <button
              onClick={() => setSearchMode('product')}
              className={`
                flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2
                ${searchMode === 'product'
                  ? 'bg-purple-600 text-white shadow-sm'
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

        {/* Results */}
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
                          ? 'border-purple-500 bg-purple-100'
                          : 'border-gray-200 bg-white hover:border-purple-200'
                        }
                      `}
                      onClick={() => handleLaboratoryToggle(laboratory.laboratory_name, laboratory.product_codes)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className={`
                            flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                            ${selectionType === 'stored'
                              ? 'bg-purple-200 text-purple-700' 
                              : selectionType === 'new'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-500'
                            }
                          `}>
                            <TestTube className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {laboratory.laboratory_name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {getResultCountText(laboratory.product_count, searchMode)}
                            </p>
                            
                            {/* NOUVEAU : Indicateur de statut */}
                            {selectionType === 'stored' && (
                              <div className="flex items-center mt-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                                <span className="text-xs text-purple-600 font-medium">
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
                            
                            {/* Matching products in product mode - LIMITED TO 3 */}
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

        {/* Tutorial - Compact */}
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