// src/stores/useFiltersStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterState {
  readonly products: string[];
  readonly laboratories: string[];
  readonly categories: string[];
  readonly pharmacy: string[];
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
  readonly setLaboratoryFilters: (codes: string[]) => void;
  readonly setCategoryFilters: (codes: string[]) => void;
  readonly setPharmacyFilters: (codes: string[]) => void;
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
 * Retourne toujours des strings valides
 */
const getDefaultAnalysisDates = (): { start: string; end: string } => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Fonction helper pour garantir une string
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
  laboratories: [],
  categories: [],
  pharmacy: [],
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

      setLaboratoryFilters: (codes: string[]) => {
        set({ laboratories: codes });
      },

      setCategoryFilters: (codes: string[]) => {
        set({ categories: codes });
      },

      setPharmacyFilters: (codes: string[]) => {
        const state = get();
        if (state.isPharmacyLocked) {
          console.warn('🔒 Pharmacy filter is locked - operation denied');
          return;
        }
        set({ pharmacy: codes });
      },

      setDateRange: (start: string | null, end: string | null) => {
        set({ dateRange: { start, end } });
      },

      setAnalysisDateRange: (start: string, end: string) => {
        // Validation : dates vides interdites
        if (!start.trim() || !end.trim()) {
          console.warn('❌ Analysis dates cannot be empty');
          return;
        }
        
        // Validation : start <= end
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
            laboratories: [],
            categories: [],
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
        set({ products: [] });
      },

      clearLaboratoryFilters: () => {
        set({ laboratories: [] });
      },

      clearCategoryFilters: () => {
        set({ categories: [] });
      },

      clearPharmacyFilters: () => {
        const state = get();
        if (state.isPharmacyLocked) {
          console.warn('🔒 Pharmacy filter is locked - cannot clear');
          return;
        }
        set({ pharmacy: [] });
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
      version: 4,
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
          // Migration v3 → v4 : forcer dates par défaut si nulles
          const freshDates = getDefaultAnalysisDates();
          return {
            ...persistedState,
            analysisDateRange: {
              start: persistedState.analysisDateRange?.start || freshDates.start,
              end: persistedState.analysisDateRange?.end || freshDates.end,
            },
          };
        }
        return persistedState;
      },
    }
  )
);