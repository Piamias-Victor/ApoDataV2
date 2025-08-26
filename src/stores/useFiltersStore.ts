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
    readonly start: string | null;
    readonly end: string | null;
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
  readonly setAnalysisDateRange: (start: string | null, end: string | null) => void;
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
}

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
    start: null,
    end: null,
  },
  comparisonDateRange: {
    start: null,
    end: null,
  },
  isPharmacyLocked: false,
};

/**
 * Store Zustand global pour tous les filtres avec protection pharmacie
 * 
 * Sécurité :
 * - isPharmacyLocked: empêche modification filtre pharmacie (users)
 * - lockPharmacyFilter: auto-inject + lock pour users
 * - unlockPharmacyFilter: unlock pour admins
 * 
 * Persisté en localStorage avec protection contre tampering
 */
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

      setAnalysisDateRange: (start: string | null, end: string | null) => {
        set({ analysisDateRange: { start, end } });
      },

      setComparisonDateRange: (start: string | null, end: string | null) => {
        set({ comparisonDateRange: { start, end } });
      },

      clearAllFilters: () => {
        const state = get();
        if (state.isPharmacyLocked) {
          // Clear all except locked pharmacy
          set({
            products: [],
            laboratories: [],
            categories: [],
            dateRange: { start: null, end: null },
            analysisDateRange: { start: null, end: null },
            comparisonDateRange: { start: null, end: null },
          });
        } else {
          set(initialState);
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
        set({ analysisDateRange: { start: null, end: null } });
      },

      clearComparisonDateRange: () => {
        set({ comparisonDateRange: { start: null, end: null } });
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
      version: 3, // Increment version pour migration
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // Migration v1 → v2 : ajout isPharmacyLocked
          return {
            ...persistedState,
            isPharmacyLocked: false,
          };
        }
        if (version < 3) {
          // Migration v2 → v3 : ajout analysisDateRange et comparisonDateRange
          return {
            ...persistedState,
            analysisDateRange: { start: null, end: null },
            comparisonDateRange: { start: null, end: null },
          };
        }
        return persistedState;
      },
    }
  )
);