// src/stores/useComparisonStore.ts
import { create } from 'zustand';
import type { 
  ComparisonState, 
  ComparisonActions, 
  ComparisonType, 
  ComparisonElement 
} from '@/types/comparison';

/**
 * Store Zustand pour gestion état comparaisons
 * 
 * Features :
 * - Sélection type comparaison (produits/laboratoires/catégories)
 * - Gestion éléments A, B et C avec validation cohérence
 * - Modal de recherche avec target (A/B/C)
 * - Actions swap, clear, validation
 * - URL génération pour page comparaison finale
 */

const initialState: ComparisonState = {
  comparisonType: null,
  elementA: null,
  elementB: null,
  elementC: null,
  isModalOpen: false,
  modalTarget: null,
};

const validateElementType = (element: ComparisonElement, comparisonType: ComparisonType): boolean => {
  const expectedType = comparisonType === 'products' ? 'product' :
                      comparisonType === 'laboratories' ? 'laboratory' :
                      comparisonType === 'categories' ? 'category' : null;
  
  return expectedType === element.type;
};

const validateUniqueElement = (element: ComparisonElement, existingElements: (ComparisonElement | null)[]): boolean => {
  return !existingElements.some(existing => existing && existing.id === element.id);
};

export const useComparisonStore = create<ComparisonState & ComparisonActions>()((set, get) => ({
  ...initialState,

  setComparisonType: (type: ComparisonType | null) => {
    set({
      comparisonType: type,
      elementA: null,
      elementB: null,
      elementC: null,
    });
  },

  setElementA: (element: ComparisonElement | null) => {
    const state = get();
    
    if (element && state.comparisonType) {
      if (!validateElementType(element, state.comparisonType)) {
        console.warn('❌ Type élément incohérent');
        return;
      }
      
      if (!validateUniqueElement(element, [state.elementB, state.elementC])) {
        console.warn('⚠️ Élément déjà sélectionné');
        return;
      }
    }
    
    console.log('✅ setElementA:', element?.name);
    set({ elementA: element });
  },

  setElementB: (element: ComparisonElement | null) => {
    const state = get();
    
    if (element && state.comparisonType) {
      if (!validateElementType(element, state.comparisonType)) {
        console.warn('❌ Type élément incohérent');
        return;
      }
      
      if (!validateUniqueElement(element, [state.elementA, state.elementC])) {
        console.warn('⚠️ Élément déjà sélectionné');
        return;
      }
    }
    
    console.log('✅ setElementB:', element?.name);
    set({ elementB: element });
  },

  setElementC: (element: ComparisonElement | null) => {
    const state = get();
    
    if (element && state.comparisonType) {
      if (!validateElementType(element, state.comparisonType)) {
        console.warn('❌ Type élément incohérent');
        return;
      }
      
      if (!validateUniqueElement(element, [state.elementA, state.elementB])) {
        console.warn('⚠️ Élément déjà sélectionné');
        return;
      }
    }
    
    console.log('✅ setElementC:', element?.name);
    set({ elementC: element });
  },

  swapElements: () => {
    const state = get();
    if (!state.elementA || !state.elementB) return;
    
    set({
      elementA: state.elementB,
      elementB: state.elementA,
    });
  },

  clearAll: () => {
    set({
      comparisonType: null,
      elementA: null,
      elementB: null,
      elementC: null,
      isModalOpen: false,
      modalTarget: null,
    });
  },

  clearElement: (position: 'A' | 'B' | 'C') => {
    if (position === 'A') set({ elementA: null });
    else if (position === 'B') set({ elementB: null });
    else if (position === 'C') set({ elementC: null });
  },

  openModal: (target: 'A' | 'B' | 'C') => {
    const state = get();
    if (!state.comparisonType) {
      console.warn('❌ Type de comparaison requis avant ouverture modal');
      return;
    }
    
    set({
      isModalOpen: true,
      modalTarget: target,
    });
  },

  closeModal: () => {
    set({
      isModalOpen: false,
      modalTarget: null,
    });
  },

  canCompare: () => {
    const state = get();
    const elements = [state.elementA, state.elementB, state.elementC].filter(Boolean);
    return !!(state.comparisonType && elements.length >= 2);
  },

  getComparisonUrl: () => {
    const state = get();
    if (!state.canCompare()) return null;
    
    const params = new URLSearchParams({
      type: state.comparisonType!,
      elementA: state.elementA!.id,
      elementB: state.elementB!.id,
    });
    
    if (state.elementC) {
      params.set('elementC', state.elementC.id);
    }
    
    return `/dashboard/comparison-results?${params.toString()}`;
  },
}));