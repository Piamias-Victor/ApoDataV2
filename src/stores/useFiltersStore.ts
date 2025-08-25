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
}

interface FilterActions {
  readonly setProductFilters: (codes: string[]) => void;
  readonly setLaboratoryFilters: (codes: string[]) => void;
  readonly setCategoryFilters: (codes: string[]) => void;
  readonly setPharmacyFilters: (codes: string[]) => void;
  readonly setDateRange: (start: string | null, end: string | null) => void;
  readonly clearAllFilters: () => void;
  readonly clearProductFilters: () => void;
  readonly clearLaboratoryFilters: () => void;
  readonly clearCategoryFilters: () => void;
  readonly clearPharmacyFilters: () => void;
  readonly clearDateRange: () => void;
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
};

/**
 * Store Zustand global pour tous les filtres
 * 
 * Persisté en localStorage avec :
 * - Filtres produits (codes EAN)
 * - Filtres laboratoires
 * - Filtres catégories
 * - Filtres pharmacie (admin only)
 * - Plage de dates
 */
export const useFiltersStore = create<FilterState & FilterActions>()(
  persist(
    (set) => ({
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
        set({ pharmacy: codes });
      },

      setDateRange: (start: string | null, end: string | null) => {
        set({ dateRange: { start, end } });
      },

      clearAllFilters: () => {
        set(initialState);
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
        set({ pharmacy: [] });
      },

      clearDateRange: () => {
        set({ dateRange: { start: null, end: null } });
      },
    }),
    {
      name: 'apodata-filters',
      version: 1,
    }
  )
);