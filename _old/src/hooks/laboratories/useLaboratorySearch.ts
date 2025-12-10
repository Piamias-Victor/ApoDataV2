// src/hooks/laboratories/useLaboratorySearch.ts
import { useState, useEffect, useCallback } from 'react';
import { useFiltersStore, type SelectedLaboratory } from '@/stores/useFiltersStore';

export type SearchMode = 'laboratory' | 'product';
export type LabOrBrandMode = 'laboratory' | 'brand'; // NOUVEAU

export interface MatchingProduct {
  readonly name: string;
  readonly code_13_ref: string;
}

export interface Laboratory {
  readonly laboratory_name: string;
  readonly product_count: number;
  readonly product_codes: string[];
  readonly matching_products?: MatchingProduct[];
  readonly source_type?: 'laboratory' | 'brand'; // NOUVEAU
}

interface SearchResponse {
  readonly laboratories: Laboratory[];
  readonly count: number;
  readonly queryTime: number;
  readonly mode: SearchMode;
  readonly labOrBrandMode: LabOrBrandMode; // NOUVEAU
}

interface UseLaboratorySearchReturn {
  readonly laboratories: Laboratory[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
  readonly searchMode: SearchMode;
  readonly setSearchMode: (mode: SearchMode) => void;
  readonly labOrBrandMode: LabOrBrandMode; // NOUVEAU
  readonly setLabOrBrandMode: (mode: LabOrBrandMode) => void; // NOUVEAU
  readonly selectedLaboratories: Set<string>;
  readonly toggleLaboratory: (labName: string, productCodes: string[], sourceType: 'laboratory' | 'brand') => void; // MODIFIÉ
  readonly clearSelection: () => void;
  readonly applyFilters: () => void;
  readonly clearLaboratoryFilters: () => void;
  readonly pendingProductCodes: Set<string>;
  readonly getSelectedLaboratoriesFromStore: () => SelectedLaboratory[];
}

/**
 * Hook useLaboratorySearch - VERSION AVEC LAB/BRAND
 * 
 * FONCTIONNALITÉS :
 * - Toggle Laboratoire (bcb_lab) / Marque (bcb_brand)
 * - Recherche sur le champ approprié selon mode
 * - Stockage du sourceType pour distinction visuelle
 * - Clear automatique de la recherche au switch Lab/Brand
 */
export function useLaboratorySearch(): UseLaboratorySearchReturn {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('laboratory');
  const [labOrBrandMode, setLabOrBrandMode] = useState<LabOrBrandMode>('laboratory'); // NOUVEAU

  // États locaux pour les sélections en attente
  const [selectedLaboratories, setSelectedLaboratories] = useState<Set<string>>(new Set());
  const [laboratoryProductMap, setLaboratoryProductMap] = useState<Map<string, { codes: string[], type: 'laboratory' | 'brand' }>>(new Map()); // MODIFIÉ
  const [laboratoryInfoMap, setLaboratoryInfoMap] = useState<Map<string, Laboratory>>(new Map()); // NOUVEAU - Pour stocker les infos complètes
  const [pendingProductCodes, setPendingProductCodes] = useState<Set<string>>(new Set());
  const [previousStoreCodes, setPreviousStoreCodes] = useState<Set<string>>(new Set());

  // Récupération depuis le store
  const storedLaboratoryCodes = useFiltersStore(state => state.laboratories);
  const storedSelectedLaboratories = useFiltersStore(state => state.selectedLaboratories);

  // Initialisation avec les codes du store - SE RÉEXÉCUTE quand le store change
  useEffect(() => {
    console.log('🔄 [useLaboratorySearch] Reinitializing from store:', storedLaboratoryCodes.length);

    const storedCodesSet = new Set(storedLaboratoryCodes);
    setPreviousStoreCodes(storedCodesSet);
  }, [storedLaboratoryCodes]); // Dépend seulement de storedLaboratoryCodes

  // Calculer pendingProductCodes = store + nouveaux sélectionnés
  useEffect(() => {
    const allPendingCodes = new Set(previousStoreCodes);

    selectedLaboratories.forEach(labName => {
      const productInfo = laboratoryProductMap.get(labName);
      if (productInfo) {
        productInfo.codes.forEach(code => allPendingCodes.add(code));
      }
    });

    setPendingProductCodes(allPendingCodes);
    console.log('🧪 [useLaboratorySearch] Updated pending codes:', {
      fromStore: previousStoreCodes.size,
      fromNewSelections: allPendingCodes.size - previousStoreCodes.size,
      total: allPendingCodes.size
    });
  }, [selectedLaboratories, laboratoryProductMap, previousStoreCodes]);

  // Lire directement le store
  const getSelectedLaboratoriesFromStore = useCallback((): SelectedLaboratory[] => {
    console.log('📖 [useLaboratorySearch] Reading selected laboratories from store:', storedSelectedLaboratories.length);
    return storedSelectedLaboratories;
  }, [storedSelectedLaboratories]);

  // Fonction de recherche avec debounce - MODIFIÉE
  const performSearch = useCallback(async (query: string, mode: SearchMode, labOrBrand: LabOrBrandMode) => {
    if (!query || query.trim().length < 3) {
      setLaboratories([]);
      // NE PAS VIDER laboratoryProductMap ICI
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
          mode,
          labOrBrandMode: labOrBrand // NOUVEAU
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      setLaboratories(data.laboratories);

      // Mettre à jour le mapping laboratory -> product codes avec type - MERGE au lieu de REMPLACE
      setLaboratoryProductMap(prev => {
        const newMap = new Map(prev);
        data.laboratories.forEach(laboratory => {
          newMap.set(laboratory.laboratory_name, {
            codes: laboratory.product_codes,
            type: laboratory.source_type || labOrBrand
          });
        });
        return newMap;
      });

    } catch (err) {
      console.error('❌ Erreur recherche laboratoires:', err);
      setError('Erreur lors de la recherche');
      setLaboratories([]);
      // Ne pas vider la map en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effet de debounce pour la recherche - MODIFIÉ
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery, searchMode, labOrBrandMode);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchMode, labOrBrandMode, performSearch]);

  // Reset des résultats quand la requête est trop courte
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setLaboratories([]);
      // NE PAS VIDER laboratoryProductMap
      setIsLoading(false);
      setError(null);
    }
  }, [searchQuery]);

  // NOUVEAU - Handler pour le switch Lab/Brand avec clear de recherche
  const handleSetLabOrBrandMode = useCallback((mode: LabOrBrandMode) => {
    console.log('🔄 [useLaboratorySearch] Switching lab/brand mode to:', mode);
    setLabOrBrandMode(mode);
    setSearchQuery(''); // Vider la recherche
    setLaboratories([]); // Clear résultats
    // NE PAS VIDER laboratoryProductMap
  }, []);

  // Clear des résultats quand le mode change
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      setLaboratories([]);
      // NE PAS VIDER laboratoryProductMap
      setIsLoading(true);
    }
  }, [searchMode]);

  // Toggle laboratory pour nouvelles sélections - MODIFIÉ
  const toggleLaboratory = useCallback((labName: string, productCodes: string[], sourceType: 'laboratory' | 'brand') => {
    console.log('🔄 [useLaboratorySearch] Toggle laboratory:', labName, 'type:', sourceType);

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

    // IMPORTANT: Ne pas écraser laboratoryProductMap, juste ajouter/mettre à jour
    setLaboratoryProductMap(prev => {
      const newMap = new Map(prev);
      // Toujours garder l'entrée pour pouvoir la retrouver dans applyFilters
      newMap.set(labName, { codes: productCodes, type: sourceType });
      return newMap;
    });

    // NOUVEAU: Stocker aussi les infos complètes du laboratoire
    setLaboratoryInfoMap(prev => {
      const newMap = new Map(prev);
      // Chercher dans les résultats actuels
      const labInfo = laboratories.find(lab => lab.laboratory_name === labName);
      if (labInfo) {
        newMap.set(labName, labInfo);
      }
      return newMap;
    });
  }, [laboratories]);

  const clearSelection = useCallback(() => {
    console.log('🗑️ [useLaboratorySearch] Clear new selections only');
    setSelectedLaboratories(new Set());
    setPendingProductCodes(previousStoreCodes);
  }, [previousStoreCodes]);

  // Appliquer les filtres avec sourceType - MODIFIÉ
  const applyFilters = useCallback(() => {
    console.log('✅ [useLaboratorySearch] Applying filters to store with names');
    console.log('📊 [DEBUG] Current state:', {
      storedSelectedLaboratories: storedSelectedLaboratories.length,
      storedLabNames: storedSelectedLaboratories.map(l => l.name),
      selectedLaboratories: selectedLaboratories.size,
      selectedLabNames: Array.from(selectedLaboratories)
    });

    const newLaboratoriesInfo: SelectedLaboratory[] = [];
    const allProductCodes: string[] = [];

    // Ajouter les laboratoires déjà dans le store (persistance)
    console.log('🔄 [DEBUG] Adding stored laboratories...');
    storedSelectedLaboratories.forEach(lab => {
      console.log(`  ➕ Adding stored lab: ${lab.name} (${lab.productCodes.length} codes)`);
      newLaboratoriesInfo.push(lab);
      allProductCodes.push(...lab.productCodes);
    });

    // Ajouter les nouveaux laboratoires sélectionnés
    console.log('🔄 [DEBUG] Adding new laboratories...');
    selectedLaboratories.forEach(labName => {
      const productInfo = laboratoryProductMap.get(labName);
      const labInfo = laboratoryInfoMap.get(labName); // CHANGÉ: Utiliser laboratoryInfoMap au lieu de laboratories.find()

      const alreadyExists = newLaboratoriesInfo.some(existing => existing.name === labName);
      console.log(`  🔍 Checking ${labName}: exists=${alreadyExists}, hasInfo=${!!labInfo}, hasProductInfo=${!!productInfo}`);

      if (labInfo && productInfo && !alreadyExists) {
        console.log(`  ➕ Adding new lab: ${labName} (${productInfo.codes.length} codes)`);
        newLaboratoriesInfo.push({
          name: labName,
          productCodes: productInfo.codes,
          productCount: labInfo.product_count,
          sourceType: productInfo.type // NOUVEAU - stocker le type
        });
        allProductCodes.push(...productInfo.codes);
      }
    });

    console.log('📊 [DEBUG] Final result:', {
      totalLabs: newLaboratoriesInfo.length,
      labNames: newLaboratoriesInfo.map(l => l.name),
      totalCodes: allProductCodes.length
    });

    // Mettre à jour le store avec codes ET noms
    const setLaboratoryFiltersWithNames = useFiltersStore.getState().setLaboratoryFiltersWithNames;
    setLaboratoryFiltersWithNames(allProductCodes, newLaboratoriesInfo);

    console.log('📊 Applied laboratories to store:', {
      totalLabs: newLaboratoriesInfo.length,
      totalCodes: allProductCodes.length,
      names: newLaboratoriesInfo.map(lab => `${lab.name} (${lab.sourceType || 'unknown'})`)
    });

    // Reset des nouvelles sélections
    setSelectedLaboratories(new Set());
    setPreviousStoreCodes(new Set(allProductCodes));
  }, [selectedLaboratories, laboratoryProductMap, laboratories, storedSelectedLaboratories]);

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
    labOrBrandMode, // NOUVEAU
    setLabOrBrandMode: handleSetLabOrBrandMode, // NOUVEAU avec handler
    selectedLaboratories,
    toggleLaboratory,
    clearSelection,
    applyFilters,
    clearLaboratoryFilters,
    pendingProductCodes,
    getSelectedLaboratoriesFromStore,
  };
}