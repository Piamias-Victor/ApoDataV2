// src/hooks/laboratories/useLaboratorySearch.ts
import { useState, useEffect, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';

export type SearchMode = 'laboratory' | 'product';

export interface MatchingProduct {
  readonly name: string;
  readonly code_13_ref: string;
}

export interface Laboratory {
  readonly laboratory_name: string;
  readonly product_count: number;
  readonly product_codes: string[];
  readonly matching_products?: MatchingProduct[];
}

interface SearchResponse {
  readonly laboratories: Laboratory[];
  readonly count: number;
  readonly queryTime: number;
  readonly mode: SearchMode;
}

interface UseLaboratorySearchReturn {
  readonly laboratories: Laboratory[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
  readonly searchMode: SearchMode;
  readonly setSearchMode: (mode: SearchMode) => void;
  readonly selectedLaboratories: Set<string>;
  readonly toggleLaboratory: (labName: string, productCodes: string[]) => void;
  readonly clearSelection: () => void;
  readonly applyFilters: () => void;
  readonly clearLaboratoryFilters: () => void;
}

/**
 * Hook useLaboratorySearch - Recherche laboratoires avec mode dual
 * 
 * Modes :
 * - 'laboratory': recherche directe par nom laboratoire
 * - 'product': recherche produit → trouve laboratoires
 * 
 * Gère la recherche intelligente avec :
 * - Debounce 300ms
 * - États loading/error
 * - Sélection par laboratoire (tous les produits)
 * - Minimum 2 caractères
 * - Storage des code_13_ref dans le store
 */
export function useLaboratorySearch(): UseLaboratorySearchReturn {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('laboratory');
  
  // Get stored laboratory product codes from Zustand
  const storedLaboratoryCodes = useFiltersStore(state => state.laboratories);
  const [selectedLaboratories, setSelectedLaboratories] = useState<Set<string>>(new Set());
  
  // Map to store laboratory name -> product codes for selection logic
  const [laboratoryProductMap, setLaboratoryProductMap] = useState<Map<string, string[]>>(new Map());

  // Initialize selected laboratories from stored codes
  useEffect(() => {
    if (storedLaboratoryCodes.length > 0) {
      // Find which laboratories are currently selected based on stored codes
      const storedCodesSet = new Set(storedLaboratoryCodes);
      
      // Check current laboratories to see which ones have all their products selected
      const currentlySelected = new Set<string>();
      for (const [labName, productCodes] of laboratoryProductMap.entries()) {
        const allCodesSelected = productCodes.every(code => storedCodesSet.has(code));
        if (allCodesSelected && productCodes.length > 0) {
          currentlySelected.add(labName);
        }
      }
      
      setSelectedLaboratories(currentlySelected);
    }
  }, [storedLaboratoryCodes, laboratoryProductMap]);

  // Debounced search function
  const performSearch = useCallback(async (query: string, mode: SearchMode) => {
    if (!query || query.trim().length < 2) {
      setLaboratories([]);
      setLaboratoryProductMap(new Map());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/laboratories/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim(), mode }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      setLaboratories(data.laboratories);

      // Update laboratory -> product codes mapping
      const newMap = new Map<string, string[]>();
      data.laboratories.forEach(lab => {
        newMap.set(lab.laboratory_name, lab.product_codes);
      });
      setLaboratoryProductMap(newMap);

    } catch (err) {
      console.error('Erreur recherche laboratoires:', err);
      setError('Erreur lors de la recherche');
      setLaboratories([]);
      setLaboratoryProductMap(new Map());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery, searchMode);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchMode, performSearch]);

  // Reset results when query is too short
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setLaboratories([]);
      setLaboratoryProductMap(new Map());
      setIsLoading(false);
      setError(null);
    }
  }, [searchQuery]);

  // Clear results when mode changes
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setLaboratories([]);
      setLaboratoryProductMap(new Map());
      setIsLoading(true);
    }
  }, [searchMode]);

  const toggleLaboratory = useCallback((labName: string, productCodes: string[]) => {
    const currentStoredCodes = useFiltersStore.getState().laboratories;
    const currentStoredSet = new Set(currentStoredCodes);
    
    // Check if this laboratory is currently selected (all its codes are in store)
    const isCurrentlySelected = productCodes.every(code => currentStoredSet.has(code)) && productCodes.length > 0;
    
    let newStoredCodes: string[];
    
    if (isCurrentlySelected) {
      // Remove all codes from this laboratory
      newStoredCodes = currentStoredCodes.filter(code => !productCodes.includes(code));
      setSelectedLaboratories(prev => {
        const newSet = new Set(prev);
        newSet.delete(labName);
        return newSet;
      });
    } else {
      // Add all codes from this laboratory
      const codesToAdd = productCodes.filter(code => !currentStoredSet.has(code));
      newStoredCodes = [...currentStoredCodes, ...codesToAdd];
      setSelectedLaboratories(prev => {
        const newSet = new Set(prev);
        newSet.add(labName);
        return newSet;
      });
    }
    
    // Update store immediately for real-time UI feedback
    useFiltersStore.getState().setLaboratoryFilters(newStoredCodes);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedLaboratories(new Set());
    useFiltersStore.getState().clearLaboratoryFilters();
  }, []);

  const applyFilters = useCallback(() => {
    // Filters are already applied in real-time via toggleLaboratory
    // This is just for consistency with the drawer interface
  }, []);

  const clearLaboratoryFilters = useCallback(() => {
    const clearLaboratoryFilters = useFiltersStore.getState().clearLaboratoryFilters;
    clearLaboratoryFilters();
    setSelectedLaboratories(new Set());
  }, []);

  return {
    laboratories,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    selectedLaboratories,
    toggleLaboratory,
    clearSelection,
    applyFilters,
    clearLaboratoryFilters,
  };
}