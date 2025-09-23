// src/components/organisms/PharmacyDrawer/PharmacyDrawer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, Building, MapPin, Euro, Users, Filter, Check, CheckSquare } from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';
import { usePharmacySearch } from '@/hooks/pharmacies/usePharmacySearch';
import { useFiltersStore } from '@/stores/useFiltersStore';
import type { SelectedPharmacy } from '@/stores/useFiltersStore';

type ViewMode = 'search' | 'filters';

interface PharmacyDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCountChange: (count: number) => void;
}

interface AllPharmaciesState {
  pharmacies: Array<{
    id: string;
    name: string;
    address: string;
    ca: number;
    area: string;
    employees_count: number;
    id_nat: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

/**
 * PharmacyDrawer Component - DESIGN IDENTIQUE AU LABORATORIES DRAWER
 * 
 * Fonctionnalités :
 * - Section "Pharmacies sélectionnées" avec design uniforme
 * - Mode "Recherche" : recherche par nom/adresse
 * - Mode "Filtres" : filtres par CA et régions
 * - Liste complète des pharmacies quand pas de recherche
 * - Bouton "Tout sélectionner"
 * - Couleur orange cohérente
 */
export const PharmacyDrawer: React.FC<PharmacyDrawerProps> = ({
  isOpen,
  onClose,
  onCountChange
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [allPharmaciesState, setAllPharmaciesState] = useState<AllPharmaciesState>({
    pharmacies: [],
    isLoading: false,
    error: null
  });
  
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
    regions,
    getSelectedPharmaciesFromStore
  } = usePharmacySearch();

  // Récupération des pharmacies sélectionnées depuis le store
  const selectedPharmaciesInfo = getSelectedPharmaciesFromStore();

  // Charger toutes les pharmacies au montage du drawer
  useEffect(() => {
    if (isOpen && allPharmaciesState.pharmacies.length === 0) {
      loadAllPharmacies();
    }
  }, [isOpen]);

  const loadAllPharmacies = async () => {
    setAllPharmaciesState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/admin/pharmacies?limit=10000&page=1', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      let pharmacies = result.pharmacies || [];
      
      // Filtrer et nettoyer les données
      pharmacies = pharmacies.filter((p: any) => p && p.id && p.name).map((p: any) => ({
        id: p.id,
        name: p.name || '',
        address: p.address || '',
        ca: p.ca || 0,
        area: p.area || '',
        employees_count: p.employees_count || 0,
        id_nat: p.id_nat || ''
      }));
      
      setAllPharmaciesState(prev => ({ 
        ...prev, 
        pharmacies,
        isLoading: false 
      }));
    } catch (err) {
      console.error('Erreur chargement pharmacies:', err);
      setAllPharmaciesState(prev => ({ 
        ...prev, 
        error: 'Erreur lors du chargement des pharmacies',
        isLoading: false 
      }));
    }
  };

  // Update count when selection changes
  React.useEffect(() => {
    onCountChange(selectedPharmacies.size);
  }, [selectedPharmacies.size, onCountChange]);

  const handlePharmacyToggle = (pharmacyId: string) => {
    console.log('PharmacyDrawer handlePharmacyToggle called:', pharmacyId);
    togglePharmacy(pharmacyId);
  };

  // Fonction pour désélectionner une pharmacie du store
  const handleDeselectStoredPharmacy = (pharmacyId: string) => {
    console.log('🗑️ [PharmacyDrawer] Deselecting stored pharmacy:', pharmacyId);
    
    // Filtrer cette pharmacie des sélections du store
    const remainingPharmacies = selectedPharmaciesInfo.filter(pharmacy => pharmacy.id !== pharmacyId);
    const remainingIds = remainingPharmacies.map(pharmacy => pharmacy.id);
    
    // Mettre à jour le store
    const setPharmacyFiltersWithNames = useFiltersStore.getState().setPharmacyFiltersWithNames;
    setPharmacyFiltersWithNames(remainingIds, remainingPharmacies);
  };

  // Fonction pour sélectionner toutes les pharmacies visibles
  const handleSelectAll = () => {
    const pharmaciesToSelect = isSearching ? pharmacies : allPharmaciesState.pharmacies;
    pharmaciesToSelect.forEach(pharmacy => {
      if (!isPharmacySelected(pharmacy.id)) {
        togglePharmacy(pharmacy.id);
      }
    });
  };

  // Vérifier si une pharmacie est sélectionnée
  const isPharmacySelected = (pharmacyId: string): boolean => {
    if (selectedPharmacies.has(pharmacyId)) {
      return true;
    }
    return selectedPharmaciesInfo.some(pharmacy => pharmacy.id === pharmacyId);
  };

  // Déterminer le type de sélection pour l'affichage visuel
  const getSelectionType = (pharmacyId: string): 'new' | 'stored' | 'none' => {
    if (selectedPharmacies.has(pharmacyId)) {
      return 'new';
    }
    if (selectedPharmaciesInfo.some(pharmacy => pharmacy.id === pharmacyId)) {
      return 'stored';
    }
    return 'none';
  };

  const formatCA = (ca: number): string => {
    if (ca >= 1000000) {
      return `${(ca / 1000000).toFixed(1)}M€`;
    }
    return `${Math.round(ca / 1000)}k€`;
  };

  const hasResults = pharmacies.length > 0;
  const showEmptyMessage = searchQuery.length >= 2 && !isLoading && !hasResults && !error;
  const isSearching = searchQuery.length >= 2;
  const showSelectedSection = !isSearching && selectedPharmaciesInfo.length > 0;
  
  // Déterminer quelles pharmacies afficher
  const pharmaciesToDisplay = isSearching ? pharmacies : allPharmaciesState.pharmacies;
  const isLoadingToDisplay = isSearching ? isLoading : allPharmaciesState.isLoading;
  const errorToDisplay = isSearching ? error : allPharmaciesState.error;

  // Séparer les pharmacies sélectionnées et non sélectionnées pour l'affichage sans recherche
  const selectedPharmaciesForDisplay = !isSearching 
    ? pharmaciesToDisplay.filter(p => isPharmacySelected(p.id))
    : [];
  const unselectedPharmaciesForDisplay = !isSearching 
    ? pharmaciesToDisplay.filter(p => !isPharmacySelected(p.id))
    : [];

  const getPlaceholderText = () => {
    return viewMode === 'search' 
      ? 'Rechercher une pharmacie...'
      : 'Filtrer par CA et régions...';
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
            <div className="p-2 bg-orange-100 rounded-lg">
              <Building className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Pharmacies
              </h2>
              <p className="text-sm text-gray-500">
                {selectedPharmaciesInfo.length} pharmacies appliquées
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
              onClick={() => setViewMode('search')}
              className={`
                flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                ${viewMode === 'search'
                  ? 'bg-white text-orange-600 shadow-sm border border-orange-200'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Recherche
            </button>
            <button
              onClick={() => setViewMode('filters')}
              className={`
                flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                ${viewMode === 'filters'
                  ? 'bg-white text-orange-600 shadow-sm border border-orange-200'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Filter className="w-4 h-4 inline mr-2" />
              Filtres
            </button>
          </div>
        </div>

        {/* Search Input - Mode Recherche uniquement */}
        {viewMode === 'search' && (
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={getPlaceholderText()}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 focus:border-orange-300 focus:ring-orange-200"
              />
            </div>
            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <p className="text-xs text-gray-500 mt-1">
                Minimum 2 caractères requis
              </p>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          
          {/* SECTION PHARMACIES SÉLECTIONNÉES - DESIGN IDENTIQUE LABORATOIRES */}
          {showSelectedSection && viewMode === 'search' && (
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Pharmacies sélectionnées ({selectedPharmaciesInfo.length})
                  </h3>
                  <button
                    onClick={clearPharmacyFilters}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Tout effacer
                  </button>
                </div>
                
                <div className="space-y-2">
                  {selectedPharmaciesInfo.map((pharmacy: SelectedPharmacy, index) => (
                    <motion.div
                      key={`selected-${pharmacy.id}-${index}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {pharmacy.name}
                          </span>
                        </div>
                        
                        {/* Informations compactes */}
                        <div className="flex items-center space-x-3 text-xs text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate max-w-32">{pharmacy.address}</span>
                          </div>
                          <div className="flex items-center">
                            <Euro className="w-3 h-3 mr-1 text-green-600" />
                            <span className="font-medium text-green-600">{formatCA(pharmacy.ca)}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1 text-blue-600" />
                            <span className="text-blue-600">{pharmacy.employees_count}</span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-orange-600 mt-1">
                          {pharmacy.area} • Déjà appliquée
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleDeselectStoredPharmacy(pharmacy.id)}
                        className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Désélectionner cette pharmacie"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODE FILTRES - CA et Régions */}
          {viewMode === 'filters' && (
            <div className="p-4 space-y-6">
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

          {/* LISTE DES PHARMACIES - Mode Recherche uniquement */}
          {viewMode === 'search' && (
            <AnimatePresence mode="wait">
              {isLoadingToDisplay && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-12"
                >
                  <div className="flex items-center space-x-3 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">
                      {isSearching ? 'Recherche en cours...' : 'Chargement des pharmacies...'}
                    </span>
                  </div>
                </motion.div>
              )}

              {errorToDisplay && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm text-red-600">{errorToDisplay}</p>
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
                  <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Aucune pharmacie trouvée</p>
                  <p className="text-xs text-gray-400">
                    Essayez avec d'autres mots-clés
                  </p>
                </motion.div>
              )}

              {/* Résultats de recherche OU liste complète */}
              {!isLoadingToDisplay && !errorToDisplay && pharmaciesToDisplay.length > 0 && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 space-y-3"
                >
                  {/* Bouton "Tout sélectionner" - seulement quand pas de recherche OU résultats de recherche */}
                  {(pharmaciesToDisplay.length > 0) && (
                    <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-600 mr-2" />
                        <span className="text-sm text-gray-700">
                          {isSearching 
                            ? `${pharmaciesToDisplay.length} résultats trouvés`
                            : `${pharmaciesToDisplay.length} pharmacies disponibles`
                          }
                        </span>
                      </div>
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 hover:border-orange-300 transition-colors"
                      >
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Tout sélectionner
                      </button>
                    </div>
                  )}

                  {/* Affichage avec séparation seulement quand pas de recherche */}
                  {!isSearching ? (
                    <>
                      {/* Pharmacies sélectionnées en premier */}
                      {selectedPharmaciesForDisplay.length > 0 && (
                        <>
                          <div className="flex items-center mb-3">
                            <div className="flex-1 h-px bg-orange-200" />
                            <span className="px-3 text-xs font-medium text-orange-600 bg-white">
                              Sélectionnées ({selectedPharmaciesForDisplay.length})
                            </span>
                            <div className="flex-1 h-px bg-orange-200" />
                          </div>
                          
                          {selectedPharmaciesForDisplay.map((pharmacy, index) => {
                            const selectionType = getSelectionType(pharmacy.id);
                            return (
                              <PharmacyItem
                                key={`selected-${pharmacy.id}`}
                                pharmacy={pharmacy}
                                index={index}
                                isSelected={true}
                                selectionType={selectionType}
                                onToggle={handlePharmacyToggle}
                                formatCA={formatCA}
                              />
                            );
                          })}
                        </>
                      )}

                      {/* Pharmacies non sélectionnées */}
                      {unselectedPharmaciesForDisplay.length > 0 && (
                        <>
                          <div className="flex items-center mb-3">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="px-3 text-xs font-medium text-gray-500 bg-white">
                              Disponibles ({unselectedPharmaciesForDisplay.length})
                            </span>
                            <div className="flex-1 h-px bg-gray-200" />
                          </div>
                          
                          {unselectedPharmaciesForDisplay.map((pharmacy, index) => (
                            <PharmacyItem
                              key={`unselected-${pharmacy.id}`}
                              pharmacy={pharmacy}
                              index={selectedPharmaciesForDisplay.length + index}
                              isSelected={false}
                              selectionType="none"
                              onToggle={handlePharmacyToggle}
                              formatCA={formatCA}
                            />
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    /* Affichage simple pour les résultats de recherche */
                    pharmaciesToDisplay.map((pharmacy, index) => {
                      const isSelected = isPharmacySelected(pharmacy.id);
                      const selectionType = getSelectionType(pharmacy.id);

                      return (
                        <PharmacyItem
                          key={`search-${pharmacy.id}-${index}`}
                          pharmacy={pharmacy}
                          index={index}
                          isSelected={isSelected}
                          selectionType={selectionType}
                          onToggle={handlePharmacyToggle}
                          formatCA={formatCA}
                        />
                      );
                    })
                  )}
                </motion.div>
              )}

              {/* Message quand aucune recherche et aucune pharmacie sélectionnée */}
              {!isSearching && !isLoadingToDisplay && selectedPharmaciesInfo.length === 0 && pharmaciesToDisplay.length === 0 && (
                <motion.div
                  key="no-selection"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-8 text-center"
                >
                  <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Chargement des pharmacies...</p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

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

        {/* Tutorial */}
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          {viewMode === 'search' ? (
            <p className="text-xs text-gray-600">
              <strong>Mode Recherche :</strong> Recherche directe par nom ou adresse de pharmacie
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-600">
                <strong>Mode Filtres :</strong> Filtrage par tranche de CA et régions
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

// Composant pour item pharmacie
interface PharmacyItemProps {
  pharmacy: {
    id: string;
    name: string;
    address: string;
    ca: number;
    area: string;
    employees_count: number;
    id_nat: string;
  };
  index: number;
  isSelected: boolean;
  selectionType: 'new' | 'stored' | 'none';
  onToggle: (pharmacyId: string) => void;
  formatCA: (ca: number) => string;
}

const PharmacyItem: React.FC<PharmacyItemProps> = ({
  pharmacy,
  index,
  isSelected,
  selectionType,
  onToggle,
  formatCA
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className={`
      p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md
      ${selectionType === 'stored' 
        ? 'border-orange-300 bg-orange-50' 
        : selectionType === 'new'
        ? 'border-green-300 bg-green-50'
        : isSelected 
        ? 'border-orange-300 bg-orange-50'
        : 'border-gray-200 hover:border-gray-300'
      }
    `}
    onClick={() => onToggle(pharmacy.id)}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center mb-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {pharmacy.name}
          </h3>
          {pharmacy.id_nat && (
            <span className="ml-2 text-xs text-gray-500 font-mono">
              {pharmacy.id_nat}
            </span>
          )}
        </div>
        
        {/* Address */}
        <div className="flex items-center text-xs text-gray-600 mb-2">
          <MapPin className="w-3 h-3 mr-1" />
          <span className="truncate">{pharmacy.address}</span>
        </div>

        {/* Metrics Row */}
        <div className="flex items-center space-x-4 text-xs mb-2">
          <div className="flex items-center text-green-600">
            <Euro className="w-3 h-3 mr-1" />
            <span className="font-medium">{formatCA(pharmacy.ca)}</span>
          </div>
          <div className="flex items-center text-blue-600">
            <Users className="w-3 h-3 mr-1" />
            <span>{pharmacy.employees_count} emp.</span>
          </div>
          <div className="text-gray-600 truncate">
            {pharmacy.area}
          </div>
        </div>

        {/* Indicateurs visuels */}
        {selectionType === 'stored' && (
          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
            <span className="text-xs text-orange-600 font-medium">
              Déjà appliquée
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
      </div>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(pharmacy.id)}
        className="mt-2 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
      />
    </div>
  </motion.div>
);