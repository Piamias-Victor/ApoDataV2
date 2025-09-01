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
 * Hook useLaboratorySearch - AVEC PENDING STATE ET CUMUL
 * 
 * CORRECTIONS :
 * - pendingProductCodes initialisé avec les codes du store (cumul)
 * - toggleLaboratory cumule avec les sélections existantes
 * - applyFilters fusionne pending + store
 * - Persistance visuelle des sélections précédentes
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

  // État pour tracker les codes du store (pour persistance visuelle)
  const [previousStoreCodes, setPreviousStoreCodes] = useState<Set<string>>(new Set());

  // Récupération des codes laboratoires appliqués depuis le store
  const storedLaboratoryCodes = useFiltersStore(state => state.laboratories);

  // CORRECTION : Initialisation avec les codes du store pour cumul
  useEffect(() => {
    console.log('🔄 [useLaboratorySearch] Initializing from store:', storedLaboratoryCodes);
    
    const storedCodesSet = new Set(storedLaboratoryCodes);
    setPendingProductCodes(storedCodesSet);
    setPreviousStoreCodes(storedCodesSet);
    
    console.log('🟢 [useLaboratorySearch] Initialized pending with store codes:', Array.from(storedCodesSet));
  }, []); // Volontairement vide pour initialiser UNE SEULE FOIS

  // CORRECTION : Calculer pendingProductCodes = store + nouveaux sélectionnés
  useEffect(() => {
    const allPendingCodes = new Set(previousStoreCodes);
    
    // Ajouter les codes des laboratoires nouvellement sélectionnés
    selectedLaboratories.forEach(labName => {
      const productCodes = laboratoryProductMap.get(labName) || [];
      productCodes.forEach(code => allPendingCodes.add(code));
    });
    
    setPendingProductCodes(allPendingCodes);
    console.log('🧪 [useLaboratorySearch] Updated pending product codes:', {
      fromStore: previousStoreCodes.size,
      fromNewSelections: allPendingCodes.size - previousStoreCodes.size,
      total: allPendingCodes.size
    });
  }, [selectedLaboratories, laboratoryProductMap, previousStoreCodes]);

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

  // CORRECTION : toggleLaboratory pour nouvelles sélections seulement
  const toggleLaboratory = useCallback((labName: string, productCodes: string[]) => {
    console.log('🔄 [useLaboratorySearch] Toggle laboratory (new selection):', labName);
    
    setSelectedLaboratories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(labName)) {
        newSet.delete(labName);
        console.log('➖ Removed from new selections:', labName);
      } else {
        newSet.add(labName);
        console.log('➕ Added to new selections:', labName);
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
    console.log('🗑️ [useLaboratorySearch] Clear new selections only');
    setSelectedLaboratories(new Set());
    // Restaurer seulement les codes du store
    setPendingProductCodes(previousStoreCodes);
  }, [previousStoreCodes]);

  // CORRECTION : applyFilters fusionne store + pending
  const applyFilters = useCallback(() => {
    console.log('✅ [useLaboratorySearch] Applying cumulated filters to store');
    console.log('  - Previous store codes:', previousStoreCodes.size);
    console.log('  - New selected laboratories:', Array.from(selectedLaboratories));
    console.log('  - Total pending product codes:', Array.from(pendingProductCodes));
    
    const setLaboratoryFilters = useFiltersStore.getState().setLaboratoryFilters;
    setLaboratoryFilters(Array.from(pendingProductCodes));
    
    // Mettre à jour le tracking des codes du store
    setPreviousStoreCodes(pendingProductCodes);
    // Clear les nouvelles sélections car elles sont maintenant dans le store
    setSelectedLaboratories(new Set());
  }, [selectedLaboratories, pendingProductCodes]);

  // clearLaboratoryFilters reset TOUT
  const clearLaboratoryFilters = useCallback(() => {
    console.log('🗑️ [useLaboratorySearch] Clear ALL laboratory filters');
    const clearLaboratoryFilters = useFiltersStore.getState().clearLaboratoryFilters;
    clearLaboratoryFilters();
    setSelectedLaboratories(new Set());
    setPendingProductCodes(new Set());
    setPreviousStoreCodes(new Set());
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