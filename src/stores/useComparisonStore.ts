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
 * - Gestion éléments A et B avec validation cohérence
 * - Modal de recherche avec target (A/B)
 * - Actions swap, clear, validation
 * - URL génération pour page comparaison finale
 */

const initialState: ComparisonState = {
  comparisonType: null,
  elementA: null,
  elementB: null,
  isModalOpen: false,
  modalTarget: null,
};

export const useComparisonStore = create<ComparisonState & ComparisonActions>()((set, get) => ({
  ...initialState,

  setComparisonType: (type: ComparisonType | null) => {
    set({
      comparisonType: type,
      // Reset éléments si changement de type
      elementA: null,
      elementB: null,
    });
  },

  setElementA: (element: ComparisonElement | null) => {
    const state = get();
    
    // Validation : type cohérent avec comparisonType
    if (element && state.comparisonType) {
      const expectedType = state.comparisonType === 'products' ? 'product' :
                          state.comparisonType === 'laboratories' ? 'laboratory' :
                          state.comparisonType === 'categories' ? 'category' : null;
      
      if (!expectedType || element.type !== expectedType) {
        console.warn('❌ Type élément incohérent:', { expected: expectedType, got: element.type });
        return;
      }
    }
    
    console.log('✅ setElementA:', element?.name);
    set({ elementA: element });
  },

  setElementB: (element: ComparisonElement | null) => {
    const state = get();
    
    // Validation : type cohérent avec comparisonType
    if (element && state.comparisonType) {
      const expectedType = state.comparisonType === 'products' ? 'product' :
                          state.comparisonType === 'laboratories' ? 'laboratory' :
                          state.comparisonType === 'categories' ? 'category' : null;
      
      if (!expectedType || element.type !== expectedType) {
        console.warn('❌ Type élément incohérent:', { expected: expectedType, got: element.type });
        return;
      }
    }
    
    // Validation : pas le même élément que A
    if (element && state.elementA && element.id === state.elementA.id) {
      console.warn('⚠️ Impossible de comparer un élément avec lui-même');
      return;
    }
    
    console.log('✅ setElementB:', element?.name);
    set({ elementB: element });
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
      isModalOpen: false,
      modalTarget: null,
    });
  },

  clearElement: (position: 'A' | 'B') => {
    set({
      [position === 'A' ? 'elementA' : 'elementB']: null,
    });
  },

  openModal: (target: 'A' | 'B') => {
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
    return !!(
      state.comparisonType &&
      state.elementA &&
      state.elementB &&
      state.elementA.id !== state.elementB.id
    );
  },

  getComparisonUrl: () => {
    const state = get();
    if (!state.canCompare()) return null;
    
    const params = new URLSearchParams({
      type: state.comparisonType!,
      elementA: state.elementA!.id,
      elementB: state.elementB!.id,
    });
    
    return `/dashboard/comparison-results?${params.toString()}`;
  },
}));