// src/hooks/pharmacies/usePharmacySearch.ts
import { useState, useEffect, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';

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
}

/**
 * Hook usePharmacySearch - AVEC PENDING STATE
 * 
 * Nouvelles fonctionnalités :
 * - Pending state pour pharmacies, CA range et régions
 * - Toutes les modifications restent locales jusqu'au clic "Appliquer"
 * - applyFilters combine toutes les sélections et les applique au store
 */
export function usePharmacySearch(): UsePharmacySearchReturn {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // PENDING STATE - États locaux
  const [selectedPharmacies, setSelectedPharmacies] = useState<Set<string>>(new Set());
  const [selectedCARange, setSelectedCARange] = useState<CARange | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());

  // Récupération des pharmacies appliquées depuis le store (pour initialisation)
  const storedPharmacies = useFiltersStore(state => state.pharmacy);

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

  // Initialize selected pharmacies from store when component mounts
  useEffect(() => {
    console.log('🔄 [usePharmacySearch] Initializing from store:', storedPharmacies);
    setSelectedPharmacies(new Set(storedPharmacies));
  }, []); // Volontairement vide pour initialiser UNE SEULE FOIS

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

      } catch (err) {
        console.error('Erreur recherche pharmacies:', err);
        setError('Erreur lors de la recherche');
        setPharmacies([]);
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

      } catch (err) {
        console.error('Erreur recherche pharmacies par filtres:', err);
        setError('Erreur lors de la recherche');
        setPharmacies([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // No valid search criteria
      setPharmacies([]);
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
      setIsLoading(false);
      setError(null);
    }
  }, [searchQuery, selectedCARange, selectedRegions]);

  // MODIFIÉ : togglePharmacy affecte seulement l'état local (pending)
  const togglePharmacy = useCallback((pharmacyId: string) => {
    console.log('🔄 [usePharmacySearch] Toggle pharmacy (pending):', pharmacyId);
    
    setSelectedPharmacies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pharmacyId)) {
        newSet.delete(pharmacyId);
      } else {
        newSet.add(pharmacyId);
      }
      console.log('🏥 [usePharmacySearch] New pending selection:', Array.from(newSet));
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
    console.log('🗑️ [usePharmacySearch] Clear pending selection');
    setSelectedPharmacies(new Set());
    setSelectedCARange(null);
    setSelectedRegions(new Set());
  }, []);

  // MODIFIÉ : applyFilters applique toutes les sélections pendantes au store
  const applyFilters = useCallback(() => {
    console.log('✅ [usePharmacySearch] Applying filters to store');
    console.log('  - Pharmacies:', Array.from(selectedPharmacies));
    console.log('  - CA Range:', selectedCARange);
    console.log('  - Regions:', Array.from(selectedRegions));
    
    // Pour l'instant, on applique seulement les pharmacies sélectionnées
    // Les filtres CA et régions sont utilisés pour la recherche mais pas stockés
    const setPharmacyFilters = useFiltersStore.getState().setPharmacyFilters;
    setPharmacyFilters(Array.from(selectedPharmacies));
  }, [selectedPharmacies, selectedCARange, selectedRegions]);

  // MODIFIÉ : clearPharmacyFilters reset le store ET tous les états locaux
  const clearPharmacyFilters = useCallback(() => {
    console.log('🗑️ [usePharmacySearch] Clear pharmacy filters (store + local)');
    const clearPharmacyFilters = useFiltersStore.getState().clearPharmacyFilters;
    clearPharmacyFilters();
    setSelectedPharmacies(new Set());
    setSelectedCARange(null);
    setSelectedRegions(new Set());
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
  };
}