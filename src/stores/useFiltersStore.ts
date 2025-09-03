// src/stores/useFiltersStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Interface pour stocker les infos laboratoires
interface SelectedLaboratory {
  readonly name: string;
  readonly productCodes: string[];
  readonly productCount: number;
}

// Interface pour stocker les infos catégories
interface SelectedCategory {
  readonly name: string;
  readonly type: 'universe' | 'category';
  readonly productCodes: string[];
  readonly productCount: number;
}

// Interface pour stocker les infos produits
interface SelectedProduct {
  readonly name: string;
  readonly code: string;
  readonly brandLab?: string | undefined;
  readonly universe?: string | undefined;
}

// NOUVEAU : Interface pour stocker les infos pharmacies
interface SelectedPharmacy {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly ca: number;
  readonly area: string;
  readonly employees_count: number;
  readonly id_nat: string;
}

interface FilterState {
  readonly products: string[];
  readonly selectedProducts: SelectedProduct[];
  readonly laboratories: string[];
  readonly selectedLaboratories: SelectedLaboratory[];
  readonly categories: string[];
  readonly selectedCategories: SelectedCategory[];
  readonly pharmacy: string[];
  readonly selectedPharmacies: SelectedPharmacy[]; // NOUVEAU : noms des pharmacies
  readonly dateRange: {
    readonly start: string | null;
    readonly end: string | null;
  };
  readonly analysisDateRange: {
    readonly start: string;
    readonly end: string;
  };
  readonly comparisonDateRange: {
    readonly start: string | null;
    readonly end: string | null;
  };
  readonly isPharmacyLocked: boolean;
}

interface FilterActions {
  readonly setProductFilters: (codes: string[]) => void;
  readonly setProductFiltersWithNames: (codes: string[], products: SelectedProduct[]) => void;
  readonly setLaboratoryFilters: (codes: string[]) => void;
  readonly setLaboratoryFiltersWithNames: (codes: string[], laboratories: SelectedLaboratory[]) => void;
  readonly setCategoryFilters: (codes: string[]) => void;
  readonly setCategoryFiltersWithNames: (codes: string[], categories: SelectedCategory[]) => void;
  readonly setPharmacyFilters: (codes: string[]) => void;
  readonly setPharmacyFiltersWithNames: (ids: string[], pharmacies: SelectedPharmacy[]) => void; // NOUVEAU
  readonly setDateRange: (start: string | null, end: string | null) => void;
  readonly setAnalysisDateRange: (start: string, end: string) => void;
  readonly setComparisonDateRange: (start: string | null, end: string | null) => void;
  readonly clearAllFilters: () => void;
  readonly clearProductFilters: () => void;
  readonly clearLaboratoryFilters: () => void;
  readonly clearCategoryFilters: () => void;
  readonly clearPharmacyFilters: () => void;
  readonly clearDateRange: () => void;
  readonly clearAnalysisDateRange: () => void;
  readonly clearComparisonDateRange: () => void;
  readonly lockPharmacyFilter: (pharmacyId: string) => void;
  readonly unlockPharmacyFilter: () => void;
  readonly resetToDefaultDates: () => void;
}

/**
 * Calcule les dates par défaut : 1er du mois en cours → aujourd'hui
 */
const getDefaultAnalysisDates = (): { start: string; end: string } => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const toDateString = (date: Date): string => {
    try {
      const isoString = date.toISOString();
      return isoString.split('T')[0] || '';
    } catch {
      return '';
    }
  };
  
  return {
    start: toDateString(firstDayOfMonth),
    end: toDateString(today)
  };
};

const defaultDates = getDefaultAnalysisDates();

const initialState: FilterState = {
  products: [],
  selectedProducts: [],
  laboratories: [],
  selectedLaboratories: [],
  categories: [],
  selectedCategories: [],
  pharmacy: [],
  selectedPharmacies: [], // NOUVEAU : initialisé vide
  dateRange: {
    start: null,
    end: null,
  },
  analysisDateRange: {
    start: defaultDates.start,
    end: defaultDates.end,
  },
  comparisonDateRange: {
    start: null,
    end: null,
  },
  isPharmacyLocked: false,
};

export const useFiltersStore = create<FilterState & FilterActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setProductFilters: (codes: string[]) => {
        set({ products: codes });
      },

      setProductFiltersWithNames: (codes: string[], products: SelectedProduct[]) => {
        console.log('📦 [Store] Setting product filters with names:', {
          codes: codes.length,
          products: products.length
        });
        
        set({ 
          products: codes,
          selectedProducts: products
        });
      },

      setLaboratoryFilters: (codes: string[]) => {
        set({ laboratories: codes });
      },

      setLaboratoryFiltersWithNames: (codes: string[], laboratories: SelectedLaboratory[]) => {
        console.log('🏥 [Store] Setting laboratory filters with names:', {
          codes: codes.length,
          laboratories: laboratories.length
        });
        
        set({ 
          laboratories: codes,
          selectedLaboratories: laboratories
        });
      },

      setCategoryFilters: (codes: string[]) => {
        set({ categories: codes });
      },

      setCategoryFiltersWithNames: (codes: string[], categories: SelectedCategory[]) => {
        console.log('🏷️ [Store] Setting category filters with names:', {
          codes: codes.length,
          categories: categories.length
        });
        
        set({ 
          categories: codes,
          selectedCategories: categories
        });
      },

      setPharmacyFilters: (codes: string[]) => {
        const state = get();
        if (state.isPharmacyLocked) {
          console.warn('🔒 Pharmacy filter is locked - operation denied');
          return;
        }
        set({ pharmacy: codes });
      },

      // NOUVELLE FONCTION : Mettre à jour IDs ET noms des pharmacies
      setPharmacyFiltersWithNames: (ids: string[], pharmacies: SelectedPharmacy[]) => {
        const state = get();
        if (state.isPharmacyLocked) {
          console.warn('🔒 Pharmacy filter is locked - operation denied');
          return;
        }

        console.log('🏪 [Store] Setting pharmacy filters with names:', {
          ids: ids.length,
          pharmacies: pharmacies.length
        });
        
        set({ 
          pharmacy: ids,
          selectedPharmacies: pharmacies
        });
      },

      setDateRange: (start: string | null, end: string | null) => {
        set({ dateRange: { start, end } });
      },

      setAnalysisDateRange: (start: string, end: string) => {
        if (!start.trim() || !end.trim()) {
          console.warn('❌ Analysis dates cannot be empty');
          return;
        }
        
        if (new Date(start) > new Date(end)) {
          console.warn('❌ Start date must be before end date');
          return;
        }
        
        set({ analysisDateRange: { start, end } });
      },

      setComparisonDateRange: (start: string | null, end: string | null) => {
        set({ comparisonDateRange: { start, end } });
      },

      clearAllFilters: () => {
        const state = get();
        const freshDates = getDefaultAnalysisDates();
        
        if (state.isPharmacyLocked) {
          set({
            products: [],
            selectedProducts: [],
            laboratories: [],
            selectedLaboratories: [],
            categories: [],
            selectedCategories: [],
            dateRange: { start: null, end: null },
            analysisDateRange: { start: freshDates.start, end: freshDates.end },
            comparisonDateRange: { start: null, end: null },
          });
        } else {
          set({
            ...initialState,
            analysisDateRange: { start: freshDates.start, end: freshDates.end },
          });
        }
      },

      clearProductFilters: () => {
        console.log('🗑️ [Store] Clearing product filters and names');
        set({ 
          products: [],
          selectedProducts: []
        });
      },

      clearLaboratoryFilters: () => {
        console.log('🗑️ [Store] Clearing laboratory filters and names');
        set({ 
          laboratories: [],
          selectedLaboratories: []
        });
      },

      clearCategoryFilters: () => {
        console.log('🗑️ [Store] Clearing category filters and names');
        set({ 
          categories: [],
          selectedCategories: []
        });
      },

      clearPharmacyFilters: () => {
        const state = get();
        if (state.isPharmacyLocked) {
          console.warn('🔒 Pharmacy filter is locked - cannot clear');
          return;
        }
        console.log('🗑️ [Store] Clearing pharmacy filters and names');
        set({ 
          pharmacy: [],
          selectedPharmacies: [] // NOUVEAU : clear aussi les noms
        });
      },

      clearDateRange: () => {
        set({ dateRange: { start: null, end: null } });
      },

      clearAnalysisDateRange: () => {
        const freshDates = getDefaultAnalysisDates();
        set({ 
          analysisDateRange: { 
            start: freshDates.start, 
            end: freshDates.end 
          } 
        });
      },

      clearComparisonDateRange: () => {
        set({ comparisonDateRange: { start: null, end: null } });
      },

      resetToDefaultDates: () => {
        const freshDates = getDefaultAnalysisDates();
        set({ 
          analysisDateRange: { 
            start: freshDates.start, 
            end: freshDates.end 
          } 
        });
      },

      lockPharmacyFilter: (pharmacyId: string) => {
        set({
          pharmacy: [pharmacyId],
          isPharmacyLocked: true,
        });
      },

      unlockPharmacyFilter: () => {
        set({ isPharmacyLocked: false });
      },
    }),
    {
      name: 'apodata-filters',
      version: 8, // INCRÉMENTÉ pour la migration
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          return {
            ...persistedState,
            isPharmacyLocked: false,
          };
        }
        if (version < 3) {
          return {
            ...persistedState,
            analysisDateRange: { start: null, end: null },
            comparisonDateRange: { start: null, end: null },
          };
        }
        if (version < 4) {
          const freshDates = getDefaultAnalysisDates();
          return {
            ...persistedState,
            analysisDateRange: {
              start: persistedState.analysisDateRange?.start || freshDates.start,
              end: persistedState.analysisDateRange?.end || freshDates.end,
            },
          };
        }
        if (version < 5) {
          return {
            ...persistedState,
            selectedLaboratories: [],
          };
        }
        if (version < 6) {
          return {
            ...persistedState,
            selectedCategories: [],
          };
        }
        if (version < 7) {
          return {
            ...persistedState,
            selectedProducts: [],
          };
        }
        if (version < 8) {
          // Migration v7 → v8 : ajouter selectedPharmacies
          return {
            ...persistedState,
            selectedPharmacies: [], // NOUVEAU champ
          };
        }
        return persistedState;
      },
    }
  )
);

// Export des types pour usage externe
export type { SelectedLaboratory, SelectedCategory, SelectedProduct, SelectedPharmacy };