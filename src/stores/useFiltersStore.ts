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

// Interface pour stocker les infos pharmacies
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
  readonly selectedPharmacies: SelectedPharmacy[];
  
  readonly excludedProducts: string[];
  readonly selectedExcludedProducts: SelectedProduct[];
  
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
  readonly setPharmacyFiltersWithNames: (ids: string[], pharmacies: SelectedPharmacy[]) => void;
  
  readonly setExcludedProducts: (codes: string[]) => void;
  readonly setExcludedProductsWithNames: (codes: string[], products: SelectedProduct[]) => void;
  readonly clearExcludedProducts: () => void;
  
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
  
  readonly recalculateProductCodes: () => void;
  readonly getFinalProductCodes: () => string[];
}

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
  selectedPharmacies: [],
  excludedProducts: [],
  selectedExcludedProducts: [],
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

      // 🔥 HELPER INTERNE - Appliquer les exclusions aux product codes
      recalculateProductCodes: () => {
        const state = get();
        const excludedSet = new Set(state.excludedProducts);
        
        // 1️⃣ Filtrer products
        const filteredProducts = state.products.filter(code => !excludedSet.has(code));
        
        // 2️⃣ Filtrer selectedLaboratories
        const filteredLabs = state.selectedLaboratories.map(lab => ({
          ...lab,
          productCodes: lab.productCodes.filter(code => !excludedSet.has(code)),
          productCount: lab.productCodes.filter(code => !excludedSet.has(code)).length,
        }));
        
        // 3️⃣ Filtrer selectedCategories
        const filteredCats = state.selectedCategories.map(cat => ({
          ...cat,
          productCodes: cat.productCodes.filter(code => !excludedSet.has(code)),
          productCount: cat.productCodes.filter(code => !excludedSet.has(code)).length,
        }));
        
        console.log('🎯 [FiltersStore] Product codes recalculated:', {
          products: { before: state.products.length, after: filteredProducts.length },
          excluded: excludedSet.size,
        });
        
        // 4️⃣ Mettre à jour le store avec les codes filtrés
        set({
          products: filteredProducts,
          selectedLaboratories: filteredLabs,
          selectedCategories: filteredCats,
        });
      },

      setProductFilters: (codes: string[]) => {
        set({ products: codes });
        get().recalculateProductCodes();
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
        
        get().recalculateProductCodes();
      },

      setLaboratoryFilters: (codes: string[]) => {
        set({ laboratories: codes });
        get().recalculateProductCodes();
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
        
        get().recalculateProductCodes();
      },

      setCategoryFilters: (codes: string[]) => {
        set({ categories: codes });
        get().recalculateProductCodes();
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
        
        get().recalculateProductCodes();
      },

      setPharmacyFilters: (codes: string[]) => {
        const state = get();
        if (state.isPharmacyLocked) {
          console.warn('🔒 Pharmacy filter is locked - operation denied');
          return;
        }
        set({ pharmacy: codes });
      },

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

      setExcludedProducts: (codes: string[]) => {
        console.log('🚫 [Store] Setting excluded products:', codes.length);
        set({ excludedProducts: codes });
        get().recalculateProductCodes();
      },

      setExcludedProductsWithNames: (codes: string[], products: SelectedProduct[]) => {
        console.log('🚫 [Store] Setting excluded products with names:', {
          codes: codes.length,
          products: products.length
        });
        
        set({ 
          excludedProducts: codes,
          selectedExcludedProducts: products
        });
        
        get().recalculateProductCodes();
      },

      clearExcludedProducts: () => {
        console.log('🗑️ [Store] Clearing excluded products');
        set({ 
          excludedProducts: [],
          selectedExcludedProducts: []
        });
        get().recalculateProductCodes();
      },

      setDateRange: (start: string | null, end: string | null) => {
        set({ dateRange: { start, end } });
      },

      setAnalysisDateRange: (start: string, end: string) => {
        if (!start || !end) {
          console.warn('❌ Analysis dates cannot be empty');
          return;
        }

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
            excludedProducts: [],
            selectedExcludedProducts: [],
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
          selectedPharmacies: []
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

      getFinalProductCodes: () => {
        const state = get();
        
        const allCodes = new Set<string>();
        
        state.products.forEach(code => allCodes.add(code));
        
        state.selectedLaboratories.forEach(lab => {
          lab.productCodes.forEach(code => allCodes.add(code));
        });
        
        state.selectedCategories.forEach(cat => {
          cat.productCodes.forEach(code => allCodes.add(code));
        });
        
        const finalCodes = Array.from(allCodes);
        
        console.log('🎯 [Store] Final product codes calculated:', {
          total: finalCodes.length,
          products: state.products.length,
          labs: state.selectedLaboratories.length,
          cats: state.selectedCategories.length,
        });
        
        return finalCodes;
      },
    }),
    {
      name: 'apodata-filters',
      version: 9,
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
          return {
            ...persistedState,
            selectedPharmacies: [],
          };
        }
        if (version < 9) {
          return {
            ...persistedState,
            excludedProducts: [],
            selectedExcludedProducts: [],
          };
        }
        return persistedState;
      },
    }
  )
);

export type { SelectedLaboratory, SelectedCategory, SelectedProduct, SelectedPharmacy };