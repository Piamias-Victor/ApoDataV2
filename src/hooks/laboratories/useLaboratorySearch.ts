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
  readonly pendingProductCodes: Set<string>;
}

/**
 * Hook useLaboratorySearch - AVEC PENDING STATE
 * 
 * Nouvelles fonctionnalités :
 * - Pending state pour laboratories et product codes
 * - toggleLaboratory modifie seulement les sélections locales
 * - applyFilters applique les product codes accumulés au store
 * - Tracking des codes produits pending pour feedback visuel
 */
export function useLaboratorySearch(): UseLaboratorySearchReturn {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('laboratory');
  
  // PENDING STATE - États locaux
  const [selectedLaboratories, setSelectedLaboratories] = useState<Set<string>>(new Set());
  const [laboratoryProductMap, setLaboratoryProductMap] = useState<Map<string, string[]>>(new Map());
  const [pendingProductCodes, setPendingProductCodes] = useState<Set<string>>(new Set());

  // Récupération des codes laboratoires appliqués depuis le store (pour initialisation)
  const storedLaboratoryCodes = useFiltersStore(state => state.laboratories);

  // Initialize selected laboratories from store when component mounts
  useEffect(() => {
    console.log('🔄 [useLaboratorySearch] Initializing from store:', storedLaboratoryCodes);
    
    // Pour l'initialisation, on assume que tous les codes stockés forment les laboratoires sélectionnés
    // En mode pending, on les met dans pendingProductCodes
    setPendingProductCodes(new Set(storedLaboratoryCodes));
    
    // Note: On ne peut pas reconstituer facilement selectedLaboratories depuis les codes produits
    // car on n'a pas la mapping inverse. C'est une limitation acceptable.
  }, []); // Volontairement vide pour initialiser UNE SEULE FOIS

  // Recalculate pending product codes when selected laboratories change
  useEffect(() => {
    const allPendingCodes = new Set<string>();
    
    selectedLaboratories.forEach(labName => {
      const productCodes = laboratoryProductMap.get(labName) || [];
      productCodes.forEach(code => allPendingCodes.add(code));
    });
    
    setPendingProductCodes(allPendingCodes);
    console.log('🧪 [useLaboratorySearch] Updated pending product codes:', Array.from(allPendingCodes));
  }, [selectedLaboratories, laboratoryProductMap]);

  // Debounced search function
  const performSearch = useCallback(async (query: string, mode: SearchMode) => {
    if (!query || query.trim().length < 3) {
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
        body: JSON.stringify({ 
          query: query.trim(),
          mode 
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      setLaboratories(data.laboratories);

      // Update laboratory -> product codes mapping
      const newMap = new Map<string, string[]>();
      data.laboratories.forEach(laboratory => {
        newMap.set(laboratory.laboratory_name, laboratory.product_codes);
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
    if (searchQuery.trim().length < 3) {
      setLaboratories([]);
      setLaboratoryProductMap(new Map());
      setIsLoading(false);
      setError(null);
    }
  }, [searchQuery]);

  // Clear results when mode changes
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      setLaboratories([]);
      setLaboratoryProductMap(new Map());
      setIsLoading(true);
    }
  }, [searchMode]);

  // MODIFIÉ : toggleLaboratory affecte seulement l'état local (pending)
  const toggleLaboratory = useCallback((labName: string, productCodes: string[]) => {
    console.log('🔄 [useLaboratorySearch] Toggle laboratory (pending):', labName);
    
    setSelectedLaboratories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(labName)) {
        newSet.delete(labName);
        console.log('➖ Removed laboratory:', labName);
      } else {
        newSet.add(labName);
        console.log('➕ Added laboratory:', labName);
      }
      return newSet;
    });

    // Ensure the mapping is updated
    setLaboratoryProductMap(prev => {
      const newMap = new Map(prev);
      newMap.set(labName, productCodes);
      return newMap;
    });
  }, []);

  const clearSelection = useCallback(() => {
    console.log('🗑️ [useLaboratorySearch] Clear pending selection');
    setSelectedLaboratories(new Set());
    setPendingProductCodes(new Set());
  }, []);

  // MODIFIÉ : applyFilters applique les codes produits accumulés au store
  const applyFilters = useCallback(() => {
    console.log('✅ [useLaboratorySearch] Applying filters to store');
    console.log('  - Selected laboratories:', Array.from(selectedLaboratories));
    console.log('  - Pending product codes:', Array.from(pendingProductCodes));
    
    const setLaboratoryFilters = useFiltersStore.getState().setLaboratoryFilters;
    setLaboratoryFilters(Array.from(pendingProductCodes));
  }, [selectedLaboratories, pendingProductCodes]);

  // MODIFIÉ : clearLaboratoryFilters reset le store ET tous les états locaux
  const clearLaboratoryFilters = useCallback(() => {
    console.log('🗑️ [useLaboratorySearch] Clear laboratory filters (store + local)');
    const clearLaboratoryFilters = useFiltersStore.getState().clearLaboratoryFilters;
    clearLaboratoryFilters();
    setSelectedLaboratories(new Set());
    setPendingProductCodes(new Set());
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
    pendingProductCodes,
  };
}