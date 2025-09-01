// src/hooks/laboratories/useLaboratorySearch.ts
import { useState, useEffect, useCallback } from 'react';
import { useFiltersStore, type SelectedLaboratory } from '@/stores/useFiltersStore';

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
  readonly getSelectedLaboratoriesFromStore: () => SelectedLaboratory[]; // SIMPLIFIÉ
}

/**
 * Hook useLaboratorySearch - VERSION SIMPLIFIÉE AVEC STORE
 * 
 * SIMPLIFICATIONS :
 * - Utilise directement selectedLaboratories du store
 * - Plus besoin d'API supplémentaire ou de cache
 * - getSelectedLaboratoriesFromStore() lit juste le store
 * - applyFilters utilise setLaboratoryFiltersWithNames
 */
export function useLaboratorySearch(): UseLaboratorySearchReturn {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('laboratory');
  
  // États locaux pour les sélections en attente
  const [selectedLaboratories, setSelectedLaboratories] = useState<Set<string>>(new Set());
  const [laboratoryProductMap, setLaboratoryProductMap] = useState<Map<string, string[]>>(new Map());
  const [pendingProductCodes, setPendingProductCodes] = useState<Set<string>>(new Set());
  const [previousStoreCodes, setPreviousStoreCodes] = useState<Set<string>>(new Set());

  // Récupération depuis le store - SIMPLIFIÉ
  const storedLaboratoryCodes = useFiltersStore(state => state.laboratories);
  const storedSelectedLaboratories = useFiltersStore(state => state.selectedLaboratories);

  // Initialisation avec les codes du store
  useEffect(() => {
    console.log('🔄 [useLaboratorySearch] Initializing from store:', storedLaboratoryCodes.length);
    
    const storedCodesSet = new Set(storedLaboratoryCodes);
    setPendingProductCodes(storedCodesSet);
    setPreviousStoreCodes(storedCodesSet);
  }, []); // Initialisation unique

  // Calculer pendingProductCodes = store + nouveaux sélectionnés
  useEffect(() => {
    const allPendingCodes = new Set(previousStoreCodes);
    
    selectedLaboratories.forEach(labName => {
      const productCodes = laboratoryProductMap.get(labName) || [];
      productCodes.forEach(code => allPendingCodes.add(code));
    });
    
    setPendingProductCodes(allPendingCodes);
    console.log('🧪 [useLaboratorySearch] Updated pending codes:', {
      fromStore: previousStoreCodes.size,
      fromNewSelections: allPendingCodes.size - previousStoreCodes.size,
      total: allPendingCodes.size
    });
  }, [selectedLaboratories, laboratoryProductMap, previousStoreCodes]);

  // FONCTION SIMPLIFIÉE : Lire directement le store
  const getSelectedLaboratoriesFromStore = useCallback((): SelectedLaboratory[] => {
    console.log('📖 [useLaboratorySearch] Reading selected laboratories from store:', storedSelectedLaboratories.length);
    return storedSelectedLaboratories;
  }, [storedSelectedLaboratories]);

  // Fonction de recherche avec debounce
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

      // Mettre à jour le mapping laboratory -> product codes
      const newMap = new Map<string, string[]>();
      data.laboratories.forEach(laboratory => {
        newMap.set(laboratory.laboratory_name, laboratory.product_codes);
      });
      setLaboratoryProductMap(newMap);

    } catch (err) {
      console.error('❌ Erreur recherche laboratoires:', err);
      setError('Erreur lors de la recherche');
      setLaboratories([]);
      setLaboratoryProductMap(new Map());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effet de debounce pour la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery, searchMode);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchMode, performSearch]);

  // Reset des résultats quand la requête est trop courte
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setLaboratories([]);
      setLaboratoryProductMap(new Map());
      setIsLoading(false);
      setError(null);
    }
  }, [searchQuery]);

  // Clear des résultats quand le mode change
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      setLaboratories([]);
      setLaboratoryProductMap(new Map());
      setIsLoading(true);
    }
  }, [searchMode]);

  // Toggle laboratory pour nouvelles sélections
  const toggleLaboratory = useCallback((labName: string, productCodes: string[]) => {
    console.log('🔄 [useLaboratorySearch] Toggle laboratory:', labName);
    
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

    setLaboratoryProductMap(prev => {
      const newMap = new Map(prev);
      newMap.set(labName, productCodes);
      return newMap;
    });
  }, []);

  const clearSelection = useCallback(() => {
    console.log('🗑️ [useLaboratorySearch] Clear new selections only');
    setSelectedLaboratories(new Set());
    setPendingProductCodes(previousStoreCodes);
  }, [previousStoreCodes]);

  // FONCTION MODIFIÉE : Utilise setLaboratoryFiltersWithNames
  const applyFilters = useCallback(() => {
    console.log('✅ [useLaboratorySearch] Applying filters to store with names');
    
    // Construire la liste des laboratoires avec leurs infos
    const newLaboratoriesInfo: SelectedLaboratory[] = [];
    const allProductCodes: string[] = [];

    // Ajouter les laboratoires déjà dans le store (persistance)
    storedSelectedLaboratories.forEach(lab => {
      newLaboratoriesInfo.push(lab);
      allProductCodes.push(...lab.productCodes);
    });

    // Ajouter les nouveaux laboratoires sélectionnés
    selectedLaboratories.forEach(labName => {
      const productCodes = laboratoryProductMap.get(labName) || [];
      const labInfo = laboratories.find(lab => lab.laboratory_name === labName);
      
      if (labInfo && !newLaboratoriesInfo.some(existing => existing.name === labName)) {
        newLaboratoriesInfo.push({
          name: labName,
          productCodes: productCodes,
          productCount: labInfo.product_count
        });
        allProductCodes.push(...productCodes);
      }
    });

    // Mettre à jour le store avec codes ET noms
    const setLaboratoryFiltersWithNames = useFiltersStore.getState().setLaboratoryFiltersWithNames;
    setLaboratoryFiltersWithNames(allProductCodes, newLaboratoriesInfo);
    
    console.log('📊 Applied laboratories to store:', {
      totalLabs: newLaboratoriesInfo.length,
      totalCodes: allProductCodes.length,
      names: newLaboratoriesInfo.map(lab => lab.name)
    });

    // Reset des nouvelles sélections
    setSelectedLaboratories(new Set());
    setPreviousStoreCodes(new Set(allProductCodes));
  }, [selectedLaboratories, laboratoryProductMap, laboratories, storedSelectedLaboratories]);

  const clearLaboratoryFilters = useCallback(() => {
    console.log('🗑️ [useLaboratorySearch] Clear ALL laboratory filters');
    const clearLaboratoryFilters = useFiltersStore.getState().clearLaboratoryFilters;
    clearLaboratoryFilters(); // Clear à la fois codes ET noms dans le store
    
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
    getSelectedLaboratoriesFromStore, // Version simplifiée
  };
}