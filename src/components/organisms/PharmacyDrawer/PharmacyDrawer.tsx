// src/components/organisms/PharmacyDrawer/PharmacyDrawer.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, Building, MapPin, Euro, Users, Filter } from 'lucide-react';
import { usePharmacySearch } from '@/hooks/pharmacies/usePharmacySearch';

type ViewMode = 'search' | 'filters';

interface PharmacyDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCountChange: (count: number) => void;
}

/**
 * PharmacyDrawer Component - Drawer pour pharmacies avec deux modes
 * 
 * Fonctionnalités :
 * - Mode "Recherche" : recherche par nom/adresse avec liste
 * - Mode "Filtres" : filtres par tranche CA et régions
 * - Design inspiré du CategoriesDrawer
 * - Sélection multiple avec checkbox
 */
export const PharmacyDrawer: React.FC<PharmacyDrawerProps> = ({
  isOpen,
  onClose,
  onCountChange
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  
  const {
    pharmacies,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedPharmacies,
    togglePharmacy,
    applyFilters,
    clearPharmacyFilters,
    selectedCARange,
    setSelectedCARange,
    selectedRegions,
    toggleRegion,
    caRanges,
    regions
  } = usePharmacySearch();

  // Update count when selection changes - VERSION SANS BOUCLE
  const prevCountRef = React.useRef(selectedPharmacies.size);
  
  React.useLayoutEffect(() => {
    const currentCount = selectedPharmacies.size;
    if (currentCount !== prevCountRef.current) {
      onCountChange(currentCount);
      prevCountRef.current = currentCount;
    }
  }, [selectedPharmacies.size]);

  const handlePharmacyToggle = (pharmacyId: string) => {
    console.log('PharmacyDrawer handlePharmacyToggle called:', pharmacyId);
    togglePharmacy(pharmacyId);
  };

  const isPharmacySelected = (pharmacyId: string): boolean => {
    return selectedPharmacies.has(pharmacyId);
  };

  const formatCA = (ca: number): string => {
    if (ca >= 1000000) {
      return `${(ca / 1000000).toFixed(1)}M€`;
    }
    return `${Math.round(ca / 1000)}k€`;
  };

  const hasResults = pharmacies.length > 0;
  const showEmptyMessage = viewMode === 'search' && searchQuery.length >= 2 && !isLoading && !hasResults && !error;
  const hasActiveFilters = selectedCARange || selectedRegions.size > 0;

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
              Filtres Pharmacies
            </h3>
            {selectedPharmacies.size > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                {selectedPharmacies.size}
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
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('search')}
                className={`
                  relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  flex items-center space-x-2
                  ${viewMode === 'search'
                    ? 'bg-white text-orange-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <Search className="w-4 h-4" />
                <span>Recherche</span>
              </button>
              
              <button
                onClick={() => setViewMode('filters')}
                className={`
                  relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  flex items-center space-x-2
                  ${viewMode === 'filters'
                    ? 'bg-white text-orange-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <Filter className="w-4 h-4" />
                <span>Filtres</span>
                {hasActiveFilters && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Section */}
        {viewMode === 'search' && (
          <>
            {/* Search Input */}
            <div className="p-6 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une pharmacie..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {isLoading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
              {searchQuery.length > 0 && searchQuery.length < 2 && (
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 2 caractères requis
                </p>
              )}
            </div>

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
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
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

                {showEmptyMessage && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6 text-center"
                  >
                    <p className="text-sm text-gray-500">Aucune pharmacie trouvée</p>
                  </motion.div>
                )}

                {hasResults && !isLoading && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 space-y-3"
                  >
                    {pharmacies.map((pharmacy, index) => {
                      const isSelected = isPharmacySelected(pharmacy.id);
                      
                      return (
                        <motion.div
                          key={pharmacy.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`
                            p-4 rounded-lg border cursor-pointer transition-all duration-200
                            ${isSelected
                              ? 'border-orange-300 bg-orange-50 ring-2 ring-orange-200'
                              : 'border-gray-200 hover:border-orange-200 hover:bg-orange-25'
                            }
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Clicked on pharmacy card:', pharmacy.id);
                            handlePharmacyToggle(pharmacy.id);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              {/* Pharmacy Name */}
                              <div className="flex items-center space-x-2 mb-2">
                                <Building className="w-4 h-4 text-orange-600 flex-shrink-0" />
                                <h3 className="font-medium text-gray-900 truncate">
                                  {pharmacy.name}
                                </h3>
                                {pharmacy.id_nat && (
                                  <span className="text-xs text-gray-500 font-mono">
                                    {pharmacy.id_nat}
                                  </span>
                                )}
                              </div>

                              {/* Address */}
                              <div className="flex items-center space-x-1 text-xs text-gray-600 mb-2">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{pharmacy.address}</span>
                              </div>

                              {/* Metrics Row */}
                              <div className="flex items-center space-x-4 text-xs">
                                <div className="flex items-center space-x-1 text-green-600">
                                  <Euro className="w-3 h-3" />
                                  <span className="font-medium">{formatCA(pharmacy.ca)}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-blue-600">
                                  <Users className="w-3 h-3" />
                                  <span>{pharmacy.employees_count} emp.</span>
                                </div>
                                <div className="text-gray-600 truncate flex-1">
                                  {pharmacy.area}
                                </div>
                              </div>

                              {/* Selection indicator */}
                              {isSelected && (
                                <div className="flex items-center mt-3 pt-2 border-t border-orange-200">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                                  <span className="text-xs text-orange-600 font-medium">
                                    Pharmacie sélectionnée
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                console.log('Checkbox changed:', pharmacy.id, e.target.checked);
                                handlePharmacyToggle(pharmacy.id);
                              }}
                              className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* Filters Section */}
        {viewMode === 'filters' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* CA Range Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">
                Chiffre d'affaires
              </label>
              <div className="grid grid-cols-2 gap-2">
                {caRanges.map((range, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedCARange(selectedCARange?.label === range.label ? null : range)}
                    className={`
                      px-3 py-2 text-sm rounded-lg border transition-all duration-200
                      ${selectedCARange?.label === range.label
                        ? 'bg-orange-100 border-orange-300 text-orange-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:bg-orange-25'
                      }
                    `}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Regions Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">
                Régions ({selectedRegions.size} sélectionnées)
              </label>
              <div className="max-h-80 overflow-y-auto space-y-2 border rounded-lg p-3 bg-gray-50">
                {regions.map((region) => (
                  <label key={region.code} className="flex items-center space-x-3 text-sm cursor-pointer hover:bg-white p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedRegions.has(region.name)}
                      onChange={() => toggleRegion(region.name)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-gray-700 flex-1">{region.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Active Filters Summary */}
            {(selectedCARange || selectedRegions.size > 0) && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="text-sm font-medium text-orange-800 mb-2">Filtres actifs :</h4>
                <div className="space-y-1 text-xs text-orange-700">
                  {selectedCARange && (
                    <div>• CA : {selectedCARange.label}</div>
                  )}
                  {selectedRegions.size > 0 && (
                    <div>• Régions : {selectedRegions.size} sélectionnées</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                applyFilters();
                onClose();
              }}
              disabled={selectedPharmacies.size === 0}
              className={`
                flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${selectedPharmacies.size > 0
                  ? 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Appliquer ({selectedPharmacies.size})
            </button>
            <button
              onClick={() => {
                clearPharmacyFilters();
                onClose();
              }}
              className="
                px-4 py-2 text-sm font-medium rounded-lg border
                border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400
                focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                transition-all duration-200
              "
            >
              Effacer pharmacies
            </button>
          </div>
        </div>

        {/* Tutorial - Compact */}
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          {viewMode === 'search' ? (
            <>
              <p className="text-xs text-gray-600">
                <strong>Mode Recherche :</strong> Recherche par nom ou adresse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Tapez au moins 2 caractères pour lancer la recherche
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-600">
                <strong>Mode Filtres :</strong> Filtrage par CA et régions
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Combinez les critères pour affiner votre sélection
              </p>
            </>
          )}
        </div>

      </motion.div>
    </>
  );
};