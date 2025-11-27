// src/components/organisms/PharmacyDrawer/PharmacyDrawer.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Loader2, Building, MapPin, Euro, Users, Filter, Check,
  CheckSquare, Square, AlertCircle // NOUVEAUX ICONES
} from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';
import { usePharmacySearch } from '@/hooks/pharmacies/usePharmacySearch';
import type { SelectedPharmacy } from '@/stores/useFiltersStore';

type ViewMode = 'search' | 'filters';

interface PharmacyDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCountChange: (count: number) => void;
}

/**
 * PharmacyDrawer Component - AVEC FONCTIONNALITÉ "TOUT SÉLECTIONNER"
 * 
 * NOUVELLES FONCTIONNALITÉS :
 * - Bouton "Tout sélectionner" en mode recherche
 * - Sélection massive de TOUTES les pharmacies de la base
 * - Exclusion par recherche + décocher
 * - Compteur dynamique avec totaux
 * - Warning si données tronquées
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
    regions,
    getSelectedPharmaciesFromStore,
    pharmacyInfoMap, // NOUVEAU
    // NOUVELLES PROPRIÉTÉS BULK
    bulkSelectAllPharmacies,
    isBulkSelecting,
    bulkSelectPharmacies,
    isAllSelected,
    totalPharmaciesCount
  } = usePharmacySearch();

  // États pour bulk select
  const [bulkWarning, setBulkWarning] = useState<string | null>(null);

  // Récupération des pharmacies sélectionnées depuis le store
  const selectedPharmaciesInfo = getSelectedPharmaciesFromStore();

  // NOUVEAU: State local pour stocker les infos complètes des pharmacies sélectionnées
  const [selectedPharmaciesInfoMap, setSelectedPharmaciesInfoMap] = React.useState<Map<string, SelectedPharmacy>>(new Map());

  // Créer une liste combinée des pharmacies à afficher (store + nouvelles sélections)
  const allSelectedPharmaciesForDisplay = React.useMemo(() => {
    const combinedMap = new Map<string, SelectedPharmacy>();

    // 1. Ajouter les pharmacies du store
    selectedPharmaciesInfo.forEach(p => combinedMap.set(p.id, p));

    // 2. Ajouter les pharmacies du state local persistent (celles qu'on vient de cocher/décocher)
    selectedPharmaciesInfoMap.forEach((p, id) => {
      // Si elle est dans selectedPharmacies (cochée), on l'ajoute/écrase
      if (selectedPharmacies.has(id)) {
        combinedMap.set(id, p);
      }
      // Si elle n'est PAS dans selectedPharmacies mais qu'elle est dans la map locale,
      // ça veut dire qu'on vient de la décocher mais on veut la garder visible !
      else {
        combinedMap.set(id, p);
      }
    });

    // 3. Ajouter les pharmacies nouvellement sélectionnées qui ne seraient pas encore dans la map
    // (cas où on sélectionne via la recherche sans passer par le toggle classique ou bulk)
    selectedPharmacies.forEach(pharmacyId => {
      if (!combinedMap.has(pharmacyId)) {
        const pharmacyInfo = pharmacyInfoMap.get(pharmacyId);
        if (pharmacyInfo) {
          combinedMap.set(pharmacyId, {
            id: pharmacyInfo.id,
            name: pharmacyInfo.name,
            address: pharmacyInfo.address,
            ca: pharmacyInfo.ca,
            area: pharmacyInfo.area,
            employees_count: pharmacyInfo.employees_count,
            id_nat: pharmacyInfo.id_nat
          });
        }
      }
    });

    return Array.from(combinedMap.values());
  }, [selectedPharmaciesInfo, selectedPharmacies, pharmacyInfoMap, selectedPharmaciesInfoMap]);

  // Update count when selection changes
  React.useEffect(() => {
    onCountChange(selectedPharmacies.size);
  }, [selectedPharmacies.size, onCountChange]);

  // NOUVELLE FONCTION : Gestion "Tout sélectionner"
  const handleSelectAll = async () => {
    setBulkWarning(null);

    try {
      console.log('🌟 [PharmacyDrawer] Starting "Select All" process');

      const result = await bulkSelectAllPharmacies();

      // Sélectionner automatiquement toutes les pharmacies récupérées
      bulkSelectPharmacies(result.pharmacies);

      // Mettre à jour la map locale avec TOUTES les pharmacies sélectionnées
      const newMap = new Map(selectedPharmaciesInfoMap);
      result.pharmacies.forEach(p => {
        newMap.set(p.id, {
          id: p.id,
          name: p.name,
          address: p.address,
          ca: p.ca,
          area: p.area,
          employees_count: p.employees_count,
          id_nat: p.id_nat
        });
      });
      setSelectedPharmaciesInfoMap(newMap);

      // Afficher warning si données tronquées
      if (result.truncated) {
        setBulkWarning(`Attention: Seules les ${result.pharmacies.length.toLocaleString()} premières pharmacies sur ${result.totalCount.toLocaleString()} ont été sélectionnées.`);
      }

      console.log('✅ [PharmacyDrawer] "Select All" completed:', {
        selected: result.pharmacies.length,
        total: result.totalCount,
        truncated: result.truncated
      });

    } catch (error) {
      console.error('❌ [PharmacyDrawer] "Select All" failed:', error);
      setBulkWarning('Erreur lors de la sélection massive. Veuillez réessayer.');
    }
  };

  // NOUVELLE FONCTION : Désélectionner tout
  const handleDeselectAll = () => {
    console.log('🗑️ [PharmacyDrawer] Deselecting all pharmacies');
    clearPharmacyFilters();
    setSelectedPharmaciesInfoMap(new Map()); // Clear la map locale aussi
    setBulkWarning(null);
  };

  const handlePharmacyToggle = (pharmacyId: string) => {
    console.log('PharmacyDrawer handlePharmacyToggle called:', pharmacyId);

    // Gestion de la map locale pour la persistance visuelle
    const isCurrentlySelected = selectedPharmacies.has(pharmacyId);

    setSelectedPharmaciesInfoMap(prev => {
      const newMap = new Map(prev);

      // Si on va la sélectionner (elle n'est pas sélectionnée actuellement)
      if (!isCurrentlySelected) {
        // On cherche ses infos pour les stocker
        const pharmacyInfo = pharmacyInfoMap.get(pharmacyId);
        if (pharmacyInfo) {
          newMap.set(pharmacyId, {
            id: pharmacyInfo.id,
            name: pharmacyInfo.name,
            address: pharmacyInfo.address,
            ca: pharmacyInfo.ca,
            area: pharmacyInfo.area,
            employees_count: pharmacyInfo.employees_count,
            id_nat: pharmacyInfo.id_nat
          });
        }
      }
      // Si on va la désélectionner, on NE LA SUPPRIME PAS de la map
      // pour qu'elle reste visible dans la liste "Sélectionnées" (décochée)
      // C'est exactement le comportement demandé !

      return newMap;
    });

    togglePharmacy(pharmacyId);

    // Reset warning si on modifie les sélections
    setBulkWarning(null);
  };

  // Fonction pour désélectionner une pharmacie de la liste affichée
  const handleDeselectDisplayedPharmacy = (pharmacyId: string) => {
    console.log('🗑️ [PharmacyDrawer] Deselecting displayed pharmacy:', pharmacyId);

    // Utiliser togglePharmacy qui gère à la fois le store et les nouvelles sélections
    togglePharmacy(pharmacyId);

    // Reset warning si on modifie les sélections
    setBulkWarning(null);
  };

  // Fonction pour désélectionner une pharmacie du store (ancienne fonction, maintenant redirige vers togglePharmacy)
  const handleDeselectStoredPharmacy = (pharmacyId: string) => {
    handleDeselectDisplayedPharmacy(pharmacyId);
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
  const showSelectedSection = allSelectedPharmaciesForDisplay.length > 0; // Utiliser la liste combinée

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
                {selectedPharmaciesInfo.length > 0
                  ? `${selectedPharmaciesInfo.length} pharmacies appliquées`
                  : selectedPharmacies.size > 0
                    ? `${selectedPharmacies.size} nouvelles sélections`
                    : 'Aucune sélection'
                }
                {totalPharmaciesCount > 0 && (
                  <span className="ml-1 text-xs text-gray-400">
                    / {totalPharmaciesCount.toLocaleString()} total
                  </span>
                )}
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

        {/* Search Input + Bulk Actions - Mode Recherche uniquement */}
        {viewMode === 'search' && (
          <div className="p-4 border-b border-gray-100 space-y-3">
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
              <p className="text-xs text-gray-500">
                Minimum 2 caractères requis
              </p>
            )}

            {/* SECTION BULK ACTIONS - NOUVELLE */}
            <div className="flex items-center justify-between p-3 bg-orange-25 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-orange-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    Sélection massive
                  </span>
                </div>

                {selectedPharmacies.size > 0 && (
                  <div className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                    {selectedPharmacies.size.toLocaleString()} sélectionnées
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAll}
                  disabled={isBulkSelecting}
                  className="
                    px-3 py-1.5 text-xs font-medium rounded-lg
                    bg-orange-600 text-white hover:bg-orange-700 
                    disabled:bg-gray-300 disabled:cursor-not-allowed
                    transition-all duration-200 flex items-center space-x-1
                  "
                >
                  {isBulkSelecting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Chargement...</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3 h-3" />
                      <span>Tout sélectionner</span>
                    </>
                  )}
                </button>

                {(selectedPharmacies.size > 0 || selectedPharmaciesInfo.length > 0) && (
                  <button
                    onClick={handleDeselectAll}
                    className="
                      px-3 py-1.5 text-xs font-medium rounded-lg
                      bg-red-100 text-red-600 hover:bg-red-200
                      transition-all duration-200 flex items-center space-x-1
                    "
                  >
                    <X className="w-3 h-3" />
                    <span>Tout effacer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Warning Bulk Select */}
            {bulkWarning && (
              <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">{bulkWarning}</p>
              </div>
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
                    Pharmacies sélectionnées ({allSelectedPharmaciesForDisplay.length})
                  </h3>
                  <button
                    onClick={clearPharmacyFilters}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Tout effacer
                  </button>
                </div>

                <div className="space-y-2">
                  {allSelectedPharmaciesForDisplay.map((pharmacy: SelectedPharmacy, index) => {
                    const isSelected = selectedPharmacies.has(pharmacy.id);

                    return (
                      <motion.div
                        key={`selected-${pharmacy.id}-${index}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          flex items-center justify-between p-3 border rounded-lg transition-colors duration-200
                          ${isSelected
                            ? 'bg-white border-orange-200'
                            : 'bg-gray-50 border-gray-200 opacity-75'
                          }
                        `}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-1">
                            <div className={`w-2 h-2 rounded-full mr-2 ${isSelected ? 'bg-orange-500' : 'bg-gray-400'}`} />
                            <span className={`text-sm font-medium truncate ${isSelected ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                              {pharmacy.name}
                            </span>
                          </div>

                          {/* Informations compactes */}
                          <div className={`flex items-center space-x-3 text-xs ${isSelected ? 'text-gray-600' : 'text-gray-400'}`}>
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span className="truncate max-w-32">{pharmacy.address}</span>
                            </div>
                            <div className="flex items-center">
                              <Euro className={`w-3 h-3 mr-1 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
                              <span className={`font-medium ${isSelected ? 'text-green-600' : 'text-gray-400'}`}>{formatCA(pharmacy.ca)}</span>
                            </div>
                            <div className="flex items-center">
                              <Users className={`w-3 h-3 mr-1 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                              <span className={`${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>{pharmacy.employees_count}</span>
                            </div>
                          </div>

                          <p className={`text-xs mt-1 ${isSelected ? 'text-orange-600' : 'text-gray-500 italic'}`}>
                            {pharmacy.area} • {isSelected ? 'Sélectionnée' : 'Désélectionnée'}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeselectStoredPharmacy(pharmacy.id)}
                          className={`
                            ml-2 p-1.5 rounded-full transition-colors
                            ${isSelected
                              ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-green-500 hover:text-green-700 hover:bg-green-50'
                            }
                          `}
                          title={isSelected ? "Désélectionner" : "Ré-ajouter"}
                        >
                          {isSelected ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </button>
                      </motion.div>
                    );
                  })}
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

          {/* RÉSULTATS DE RECHERCHE - Mode Recherche uniquement */}
          {viewMode === 'search' && (
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
                  <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Aucune pharmacie trouvée</p>
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
                  {pharmacies.map((pharmacy, index) => {
                    const isSelected = isPharmacySelected(pharmacy.id);
                    const selectionType = getSelectionType(pharmacy.id);

                    return (
                      <motion.div
                        key={`${pharmacy.id}-${index}`}
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
                        onClick={() => handlePharmacyToggle(pharmacy.id)}
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
                            onChange={() => handlePharmacyToggle(pharmacy.id)}
                            className="mt-2 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {/* Message quand aucune recherche et aucune pharmacie sélectionnée */}
              {!isSearching && !isLoading && selectedPharmaciesInfo.length === 0 && !isAllSelected && (
                <motion.div
                  key="no-selection"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-8 text-center"
                >
                  <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Aucune pharmacie sélectionnée</p>
                  <p className="text-xs text-gray-400 mb-4">
                    Utilisez la recherche ou sélectionnez toutes les pharmacies
                  </p>

                  {/* Bouton "Tout sélectionner" alternatif */}
                  <button
                    onClick={handleSelectAll}
                    disabled={isBulkSelecting}
                    className="
                      px-4 py-2 text-sm font-medium rounded-lg
                      bg-orange-600 text-white hover:bg-orange-700 
                      disabled:bg-gray-300 disabled:cursor-not-allowed
                      transition-all duration-200 flex items-center space-x-2 mx-auto
                    "
                  >
                    {isBulkSelecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Chargement...</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        <span>Sélectionner toutes les pharmacies</span>
                      </>
                    )}
                  </button>
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
            <>
              <p className="text-xs text-gray-600">
                <strong>Mode Recherche :</strong> Recherche directe par nom/adresse + sélection massive
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Utilisez "Tout sélectionner" puis décochez les pharmacies à exclure
              </p>
            </>
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