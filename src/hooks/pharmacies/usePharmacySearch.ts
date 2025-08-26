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
 * Hook usePharmacySearch - Recherche pharmacies avec filtres CA et région
 * 
 * Fonctionnalités :
 * - Recherche par nom/adresse
 * - Filtre par tranche CA (4M, 4-6M, 6-8M, 8-10M, +10M)
 * - Filtre par régions françaises
 * - Debounce 300ms
 * - Sélection multiple
 * - Storage des IDs dans le store
 */
export function usePharmacySearch(): UsePharmacySearchReturn {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCARange, setSelectedCARange] = useState<CARange | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  
  // Get stored pharmacy IDs from Zustand
  const storedPharmacyIds = useFiltersStore(state => state.pharmacy);
  const [selectedPharmacies, setSelectedPharmacies] = useState<Set<string>>(
    new Set(storedPharmacyIds)
  );

  // CA Ranges in millions
  const caRanges: CARange[] = [
    { min: 0, max: 4000000, label: '< 4M€' },
    { min: 4000000, max: 6000000, label: '4M€ - 6M€' },
    { min: 6000000, max: 8000000, label: '6M€ - 8M€' },
    { min: 8000000, max: 10000000, label: '8M€ - 10M€' },
    { min: 10000000, max: null, label: '> 10M€' }
  ];

  // French regions
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
    { name: "Provence-Alpes-Côte d'Azur", code: 'PAC' },
    { name: 'Guadeloupe', code: 'GP' },
    { name: 'Martinique', code: 'MQ' },
    { name: 'Guyane', code: 'GF' },
    { name: 'La Réunion', code: 'RE' },
    { name: 'Mayotte', code: 'YT' }
  ];

  // Debounced search - déclenche si recherche OU filtres
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const hasSearchQuery = searchQuery.length >= 2;
      const hasCAFilter = selectedCARange !== null;
      const hasRegionFilter = selectedRegions.size > 0;
      
      if (hasSearchQuery || hasCAFilter || hasRegionFilter) {
        performSearch();
      } else if (searchQuery.length === 0 && !hasCAFilter && !hasRegionFilter) {
        setPharmacies([]);
        setSelectedPharmacies(new Set()); // Vider la sélection si plus de filtres
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCARange, selectedRegions]);

  // Auto-sélectionner toutes les pharmacies quand les résultats changent
  useEffect(() => {
    if (pharmacies.length > 0) {
      const allPharmacyIds = pharmacies.map(p => p.id);
      setSelectedPharmacies(new Set(allPharmacyIds));
      console.log('Auto-selected all pharmacies:', allPharmacyIds.length, 'pharmacies');
    } else {
      setSelectedPharmacies(new Set());
    }
  }, [pharmacies]);

  const performSearch = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Construire les paramètres de recherche
      const searchParams: any = {};
      
      if (searchQuery.trim()) {
        searchParams.query = searchQuery.trim();
      }
      
      if (selectedCARange) {
        searchParams.caMin = selectedCARange.min.toString();
        if (selectedCARange.max) {
          searchParams.caMax = selectedCARange.max.toString();
        }
      }
      
      if (selectedRegions.size > 0) {
        searchParams.regions = Array.from(selectedRegions);
      }

      console.log('Pharmacy search params:', searchParams);

      const response = await fetch('/api/search/pharmacies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data: SearchResponse = await response.json();
      console.log('Pharmacy search results:', data);
      setPharmacies(data.pharmacies);
      
    } catch (err) {
      console.error('Pharmacy search error:', err);
      setError(err instanceof Error ? err.message : 'Erreur de recherche');
      setPharmacies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePharmacy = useCallback((pharmacyId: string) => {
    console.log('Toggle pharmacy called:', pharmacyId);
    console.log('Current selectedPharmacies:', selectedPharmacies);
    
    setSelectedPharmacies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pharmacyId)) {
        newSet.delete(pharmacyId);
        console.log('Removed pharmacy:', pharmacyId);
      } else {
        newSet.add(pharmacyId);
        console.log('Added pharmacy:', pharmacyId);
      }
      console.log('New selectedPharmacies:', newSet);
      return newSet;
    });
  }, [selectedPharmacies]); // Ajout de la dépendance

  const toggleRegion = useCallback((region: string) => {
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
    setSelectedPharmacies(new Set());
    setSelectedCARange(null);
    setSelectedRegions(new Set());
  }, []);

  const applyFilters = useCallback(() => {
    const pharmacyIds = Array.from(selectedPharmacies);
    useFiltersStore.getState().setPharmacyFilters(pharmacyIds);
  }, [selectedPharmacies]);

  const clearPharmacyFilters = useCallback(() => {
    setSelectedPharmacies(new Set());
    setSelectedCARange(null);
    setSelectedRegions(new Set());
    useFiltersStore.getState().clearPharmacyFilters();
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
    regions
  };
}