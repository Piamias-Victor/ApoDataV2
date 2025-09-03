// src/hooks/pharmacies/usePharmacySearch.ts
import { useState, useEffect, useCallback } from 'react';
import { useFiltersStore, type SelectedPharmacy } from '@/stores/useFiltersStore';

export interface Pharmacy {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly ca: number;
  readonly area: string;
  readonly employees_count: number;
  readonly id_nat: string;
}

export interface CARange {
  readonly min: number;
  readonly max: number | null;
  readonly label: string;
}

export interface Region {
  readonly name: string;
  readonly code: string;
}

interface SearchResponse {
  readonly pharmacies: Pharmacy[];
  readonly count: number;
  readonly queryTime: number;
}

interface UsePharmacySearchReturn {
  readonly pharmacies: Pharmacy[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
  readonly selectedPharmacies: Set<string>;
  readonly togglePharmacy: (pharmacyId: string) => void;
  readonly clearSelection: () => void;
  readonly applyFilters: () => void;
  readonly clearPharmacyFilters: () => void;
  readonly selectedCARange: CARange | null;
  readonly setSelectedCARange: (range: CARange | null) => void;
  readonly selectedRegions: Set<string>;
  readonly toggleRegion: (region: string) => void;
  readonly caRanges: CARange[];
  readonly regions: Region[];
  readonly getSelectedPharmaciesFromStore: () => SelectedPharmacy[];
  readonly pendingPharmaciesCount: number; // Ajouté pour compatibilité avec drawer
}

/**
 * Hook usePharmacySearch - VERSION IDENTIQUE AU useLaboratorySearch
 * 
 * LOGIQUE COPIÉE EXACTEMENT :
 * - Persistance des codes du store avec previousStoreCodes
 * - Construction correcte des objets SelectedPharmacy
 * - Mapping entre nouvelles sélections et store existant
 * - applyFilters utilise setPharmacyFiltersWithNames
 */
export function usePharmacySearch(): UsePharmacySearchReturn {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // États locaux pour les sélections en attente - IDENTIQUE AUX LABORATOIRES
  const [selectedPharmacies, setSelectedPharmacies] = useState<Set<string>>(new Set());
  const [pharmacyInfoMap, setPharmacyInfoMap] = useState<Map<string, Pharmacy>>(new Map());
  const [pendingPharmacyIds, setPendingPharmacyIds] = useState<Set<string>>(new Set());
  const [previousStoreIds, setPreviousStoreIds] = useState<Set<string>>(new Set());
  
  // États pour les filtres CA et régions
  const [selectedCARange, setSelectedCARange] = useState<CARange | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());

  // Récupération depuis le store - IDENTIQUE AUX LABORATOIRES
  const storedPharmacyIds = useFiltersStore(state => state.pharmacy);
  const storedSelectedPharmacies = useFiltersStore(state => state.selectedPharmacies);

  // Constantes pour les filtres CA et régions
  const caRanges: CARange[] = [
    { min: 0, max: 4000000, label: '< 4M€' },
    { min: 4000000, max: 6000000, label: '4M - 6M€' },
    { min: 6000000, max: 8000000, label: '6M - 8M€' },
    { min: 8000000, max: 10000000, label: '8M - 10M€' },
    { min: 10000000, max: null, label: '> 10M€' },
  ];

  const regions: Region[] = [
    { name: 'Auvergne-Rhône-Alpes', code: 'ARA' },
    { name: 'Bourgogne-Franche-Comté', code: 'BFC' },
    { name: 'Bretagne', code: 'BRE' },
    { name: 'Centre-Val de Loire', code: 'CVL' },
    { name: 'Corse', code: 'COR' },
    { name: 'Grand Est', code: 'GES' },
    { name: 'Hauts-de-France', code: 'HDF' },
    { name: 'Île-de-France', code: 'IDF' },
    { name: 'Normandie', code: 'NOR' },
    { name: 'Nouvelle-Aquitaine', code: 'NAQ' },
    { name: 'Occitanie', code: 'OCC' },
    { name: 'Pays de la Loire', code: 'PDL' },
    { name: 'Provence-Alpes-Côte d\'Azur', code: 'PAC' },
  ];

  // Initialisation avec les IDs du store - IDENTIQUE AUX LABORATOIRES
  useEffect(() => {
    console.log('🔄 [usePharmacySearch] Initializing from store:', storedPharmacyIds.length);
    
    const storedIdsSet = new Set(storedPharmacyIds);
    setPendingPharmacyIds(storedIdsSet);
    setPreviousStoreIds(storedIdsSet);
  }, []); // Initialisation unique

  // Calculer pendingPharmacyIds = store + nouvelles sélectionnées - IDENTIQUE AUX LABORATOIRES
  useEffect(() => {
    const allPendingIds = new Set(previousStoreIds);
    
    selectedPharmacies.forEach(pharmacyId => {
      allPendingIds.add(pharmacyId);
    });
    
    setPendingPharmacyIds(allPendingIds);
    console.log('🏪 [usePharmacySearch] Updated pending IDs:', {
      fromStore: previousStoreIds.size,
      fromNewSelections: allPendingIds.size - previousStoreIds.size,
      total: allPendingIds.size
    });
  }, [selectedPharmacies, previousStoreIds]);

  // FONCTION IDENTIQUE AUX LABORATOIRES : Lire directement le store
  const getSelectedPharmaciesFromStore = useCallback((): SelectedPharmacy[] => {
    console.log('📖 [usePharmacySearch] Reading selected pharmacies from store:', storedSelectedPharmacies.length);
    return storedSelectedPharmacies;
  }, [storedSelectedPharmacies]);

  // Debounced search function
  const performSearch = useCallback(async (query: string, caRange: CARange | null, regions: Set<string>) => {
    // Search by query (nom/adresse)
    if (query && query.trim().length >= 2) {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/search/pharmacies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            query: query.trim(),
            caMin: caRange?.min.toString(),
            caMax: caRange?.max?.toString(),
            regions: regions.size > 0 ? Array.from(regions) : undefined
          }),
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }

        const data: SearchResponse = await response.json();
        setPharmacies(data.pharmacies);

        // Mettre à jour le mapping pharmacy ID -> pharmacy info
        const newMap = new Map<string, Pharmacy>();
        data.pharmacies.forEach(pharmacy => {
          newMap.set(pharmacy.id, pharmacy);
        });
        setPharmacyInfoMap(newMap);

      } catch (err) {
        console.error('Erreur recherche pharmacies:', err);
        setError('Erreur lors de la recherche');
        setPharmacies([]);
        setPharmacyInfoMap(new Map());
      } finally {
        setIsLoading(false);
      }
    }
    
    // Search by filters only (CA + regions)
    else if (caRange || regions.size > 0) {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/search/pharmacies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            caMin: caRange?.min.toString(),
            caMax: caRange?.max?.toString(),
            regions: regions.size > 0 ? Array.from(regions) : undefined
          }),
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }

        const data: SearchResponse = await response.json();
        setPharmacies(data.pharmacies);

        // Mettre à jour le mapping
        const newMap = new Map<string, Pharmacy>();
        data.pharmacies.forEach(pharmacy => {
          newMap.set(pharmacy.id, pharmacy);
        });
        setPharmacyInfoMap(newMap);

      } catch (err) {
        console.error('Erreur recherche pharmacies par filtres:', err);
        setError('Erreur lors de la recherche');
        setPharmacies([]);
        setPharmacyInfoMap(new Map());
      } finally {
        setIsLoading(false);
      }
    } else {
      // No valid search criteria
      setPharmacies([]);
      setPharmacyInfoMap(new Map());
      setIsLoading(false);
      setError(null);
    }
  }, []);

  // Debounce effect pour la recherche textuelle
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery, selectedCARange, selectedRegions);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Effet pour recherche par filtres (CA + régions) - sans debounce
  useEffect(() => {
    if (selectedCARange || selectedRegions.size > 0) {
      performSearch(searchQuery, selectedCARange, selectedRegions);
    }
  }, [selectedCARange, selectedRegions, performSearch]);

  // Reset results when no search criteria
  useEffect(() => {
    if (!searchQuery.trim() && !selectedCARange && selectedRegions.size === 0) {
      setPharmacies([]);
      setPharmacyInfoMap(new Map());
      setIsLoading(false);
      setError(null);
    }
  }, [searchQuery, selectedCARange, selectedRegions]);

  // Toggle pharmacy pour nouvelles sélections - IDENTIQUE AUX LABORATOIRES
  const togglePharmacy = useCallback((pharmacyId: string) => {
    console.log('🔄 [usePharmacySearch] Toggle pharmacy:', pharmacyId);
    
    setSelectedPharmacies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pharmacyId)) {
        newSet.delete(pharmacyId);
        console.log('➖ Removed from new selections:', pharmacyId);
      } else {
        newSet.add(pharmacyId);
        console.log('➕ Added to new selections:', pharmacyId);
      }
      return newSet;
    });
  }, []);

  // MODIFIÉ : toggleRegion affecte seulement l'état local (pending)
  const toggleRegion = useCallback((region: string) => {
    console.log('🔄 [usePharmacySearch] Toggle region (pending):', region);
    
    setSelectedRegions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(region)) {
        newSet.delete(region);
      } else {
        newSet.add(region);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    console.log('🗑️ [usePharmacySearch] Clear new selections only');
    setSelectedPharmacies(new Set());
    setSelectedCARange(null);
    setSelectedRegions(new Set());
    setPendingPharmacyIds(previousStoreIds);
  }, [previousStoreIds]);

  // FONCTION MODIFIÉE : IDENTIQUE AUX LABORATOIRES - Utilise setPharmacyFiltersWithNames
  const applyFilters = useCallback(() => {
    console.log('✅ [usePharmacySearch] Applying filters to store with names');
    
    // Construire la liste des pharmacies avec leurs infos
    const newPharmaciesInfo: SelectedPharmacy[] = [];
    const allPharmacyIds: string[] = [];

    // Ajouter les pharmacies déjà dans le store (persistance)
    storedSelectedPharmacies.forEach(pharmacy => {
      newPharmaciesInfo.push(pharmacy);
      allPharmacyIds.push(pharmacy.id);
    });

    // Ajouter les nouvelles pharmacies sélectionnées
    selectedPharmacies.forEach(pharmacyId => {
      const pharmacyInfo = pharmacyInfoMap.get(pharmacyId) || pharmacies.find(p => p.id === pharmacyId);
      
      if (pharmacyInfo && !newPharmaciesInfo.some(existing => existing.id === pharmacyId)) {
        newPharmaciesInfo.push({
          id: pharmacyInfo.id,
          name: pharmacyInfo.name,
          address: pharmacyInfo.address,
          ca: pharmacyInfo.ca,
          area: pharmacyInfo.area,
          employees_count: pharmacyInfo.employees_count,
          id_nat: pharmacyInfo.id_nat
        });
        allPharmacyIds.push(pharmacyId);
      }
    });

    // Mettre à jour le store avec IDs ET noms
    const setPharmacyFiltersWithNames = useFiltersStore.getState().setPharmacyFiltersWithNames;
    setPharmacyFiltersWithNames(allPharmacyIds, newPharmaciesInfo);
    
    console.log('📊 Applied pharmacies to store:', {
      totalPharmacies: newPharmaciesInfo.length,
      totalIds: allPharmacyIds.length,
      names: newPharmaciesInfo.map(pharmacy => pharmacy.name)
    });

    // Reset des nouvelles sélections
    setSelectedPharmacies(new Set());
    setSelectedCARange(null);
    setSelectedRegions(new Set());
    setPreviousStoreIds(new Set(allPharmacyIds));
  }, [selectedPharmacies, pharmacyInfoMap, pharmacies, storedSelectedPharmacies, selectedCARange, selectedRegions]);

  const clearPharmacyFilters = useCallback(() => {
    console.log('🗑️ [usePharmacySearch] Clear ALL pharmacy filters');
    const clearPharmacyFilters = useFiltersStore.getState().clearPharmacyFilters;
    clearPharmacyFilters(); // Clear à la fois IDs ET noms dans le store
    
    setSelectedPharmacies(new Set());
    setSelectedCARange(null);
    setSelectedRegions(new Set());
    setPendingPharmacyIds(new Set());
    setPreviousStoreIds(new Set());
  }, []);

  return {
    pharmacies,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedPharmacies,
    togglePharmacy,
    clearSelection,
    applyFilters,
    clearPharmacyFilters,
    selectedCARange,
    setSelectedCARange,
    selectedRegions,
    toggleRegion,
    caRanges,
    regions,
    getSelectedPharmaciesFromStore,
    pendingPharmaciesCount: pendingPharmacyIds.size // Ajouté pour compatibilité
  };
}