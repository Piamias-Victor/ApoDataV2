// src/stores/useFiltersStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SelectedLaboratory {
  readonly name: string;
  readonly productCodes: string[];
  readonly productCount: number;
  readonly sourceType?: 'laboratory' | 'brand';
}

interface SelectedCategory {
  readonly name: string;
  readonly type: 'universe' | 'category';
  readonly productCodes: string[];
  readonly productCount: number;
}

interface SelectedProduct {
  readonly name: string;
  readonly code: string;
  readonly brandLab?: string | undefined;
  readonly universe?: string | undefined;
}

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
  readonly products: string[]; // 🔥 Contient maintenant les codes finaux
  readonly selectedProducts: SelectedProduct[];
  readonly laboratories: string[];
  readonly selectedLaboratories: SelectedLaboratory[];
  readonly categories: string[];
  readonly selectedCategories: SelectedCategory[];
  readonly pharmacy: string[];
  readonly selectedPharmacies: SelectedPharmacy[];

  readonly excludedProducts: string[];
  readonly selectedExcludedProducts: SelectedProduct[];

  readonly filterLogic: 'OR' | 'AND';

  readonly tvaRates: number[];

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

  readonly setFilterLogic: (logic: 'OR' | 'AND') => void;

  readonly setTvaRates: (rates: number[]) => void;
  readonly clearTvaRates: () => void;

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

  readonly getFinalProductCodes: () => string[];
  readonly recalculateProductCodes: () => Promise<void>; // 🔥 ASYNC - Appelle l'API de filtrage TVA
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
  filterLogic: 'OR',
  tvaRates: [],
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

      // 🔥 FONCTION INTERNE - Calcul des codes finaux
      recalculateProductCodes: async () => {
        const state = get();
        const excludedSet = new Set(state.excludedProducts);
        const logic = state.filterLogic;

        // 1. Produits manuels (stockés dans selectedProducts)
        const manualProducts = new Set(
          state.selectedProducts.map(p => p.code).filter(code => !excludedSet.has(code))
        );

        // 2. Produits des laboratoires
        const labProducts = new Set<string>();
        state.selectedLaboratories.forEach(lab => {
          lab.productCodes.forEach(code => {
            if (!excludedSet.has(code)) {
              labProducts.add(code);
            }
          });
        });

        // 3. Produits des catégories avec logique ET/OU
        let categoryProducts: Set<string>;

        if (state.selectedCategories.length === 0) {
          categoryProducts = new Set<string>();
        } else if (logic === 'OR') {
          categoryProducts = new Set<string>();
          state.selectedCategories.forEach(cat => {
            cat.productCodes.forEach(code => {
              if (!excludedSet.has(code)) {
                categoryProducts.add(code);
              }
            });
          });
        } else {
          const categorySets = state.selectedCategories.map(cat =>
            new Set(cat.productCodes.filter(code => !excludedSet.has(code)))
          );

          if (categorySets.length === 1) {
            const firstSet = categorySets[0];
            categoryProducts = firstSet !== undefined ? firstSet : new Set<string>();
          } else {
            categoryProducts = new Set<string>();
            const firstSet = categorySets[0];

            if (firstSet !== undefined) {
              firstSet.forEach(code => {
                const inAllCategories = categorySets.every(set => set.has(code));
                if (inAllCategories) {
                  categoryProducts.add(code);
                }
              });
            }
          }
        }

        // 4. Combinaison finale selon la logique
        let finalCodes: Set<string>;

        const hasLabs = labProducts.size > 0;
        const hasCats = categoryProducts.size > 0;

        if (!hasLabs && !hasCats) {
          finalCodes = manualProducts;
        } else if (hasLabs && !hasCats) {
          finalCodes = new Set([...manualProducts, ...labProducts]);
        } else if (!hasLabs && hasCats) {
          finalCodes = new Set([...manualProducts, ...categoryProducts]);
        } else {
          if (logic === 'OR') {
            finalCodes = new Set([...manualProducts, ...labProducts, ...categoryProducts]);
          } else {
            const intersection = new Set<string>();
            labProducts.forEach(code => {
              if (categoryProducts.has(code)) {
                intersection.add(code);
              }
            });
            finalCodes = new Set([...manualProducts, ...intersection]);
          }
        }

        let result = Array.from(finalCodes);

        // 5. 🔥 NOUVEAU - Appliquer le filtre TVA si des taux sont sélectionnés
        if (state.tvaRates.length > 0 && result.length > 0) {
          try {
            console.log('💰 [Store] Applying TVA filter:', state.tvaRates);

            const response = await fetch('/api/filters/apply-tva', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productCodes: result,
                tvaRates: state.tvaRates,
                dateRange: state.analysisDateRange,
                pharmacyId: state.isPharmacyLocked ? state.pharmacy[0] : null
              })
            });

            if (response.ok) {
              const data = await response.json();
              const beforeTva = result.length;
              result = data.productCodes;

              console.log('✅ [Store] TVA filter applied:', {
                before: beforeTva,
                after: result.length,
                filtered: beforeTva - result.length,
                tvaRates: state.tvaRates
              });
            } else {
              console.error('❌ [Store] TVA filter API error:', response.status);
            }
          } catch (error) {
            console.error('❌ [Store] TVA filter error:', error);
          }
        }

        console.log('🎯 [Store] Product codes recalculated:', {
          logic,
          manual: manualProducts.size,
          labs: labProducts.size,
          categories: categoryProducts.size,
          tvaFiltered: state.tvaRates.length > 0,
          final: result.length,
          excluded: state.excludedProducts.length
        });

        // 🔥 Mettre à jour products directement
        set({ products: result });
      },

      setProductFilters: (codes: string[]) => {
        set({ products: codes });
      },

      setProductFiltersWithNames: (codes: string[], products: SelectedProduct[]) => {
        console.log('📦 [Store] Setting product filters with names:', {
          codes: codes.length,
          products: products.length
        });

        set({ selectedProducts: products });
        get().recalculateProductCodes(); // 🔥 Recalcul auto
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
        get().recalculateProductCodes(); // 🔥 Recalcul auto
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
        get().recalculateProductCodes(); // 🔥 Recalcul auto
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
        get().recalculateProductCodes(); // 🔥 Recalcul auto
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
        get().recalculateProductCodes(); // 🔥 Recalcul auto
      },

      clearExcludedProducts: () => {
        console.log('🗑️ [Store] Clearing excluded products');
        set({
          excludedProducts: [],
          selectedExcludedProducts: []
        });
        get().recalculateProductCodes(); // 🔥 Recalcul auto
      },

      setFilterLogic: (logic: 'OR' | 'AND') => {
        console.log('🔀 [Store] Setting filter logic:', logic);
        set({ filterLogic: logic });
        get().recalculateProductCodes(); // 🔥 CRITIQUE - Recalcul auto quand logique change
      },

      setTvaRates: (rates: number[]) => {
        console.log('💰 [Store] Setting TVA rates:', rates);
        set({ tvaRates: rates });
        get().recalculateProductCodes(); // 🔥 Recalcul auto quand taux TVA changent
      },

      clearTvaRates: () => {
        console.log('🗑️ [Store] Clearing TVA rates');
        set({ tvaRates: [] });
        get().recalculateProductCodes(); // 🔥 Recalcul auto
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
            filterLogic: 'OR',
            tvaRates: [],
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
          selectedProducts: []
        });
        get().recalculateProductCodes(); // 🔥 Recalcul auto
      },

      clearLaboratoryFilters: () => {
        console.log('🗑️ [Store] Clearing laboratory filters and names');
        set({
          laboratories: [],
          selectedLaboratories: []
        });
        get().recalculateProductCodes(); // 🔥 Recalcul auto
      },

      clearCategoryFilters: () => {
        console.log('🗑️ [Store] Clearing category filters and names');
        set({
          categories: [],
          selectedCategories: []
        });
        get().recalculateProductCodes(); // 🔥 Recalcul auto
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

      // 🔥 CONSERVÉ pour compatibilité (retourne directement products)
      getFinalProductCodes: () => {
        const state = get();
        return state.products;
      },
    }),
    {
      name: 'apodata-filters',
      version: 12,
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
        if (version < 10) {
          return {
            ...persistedState,
            selectedLaboratories: (persistedState.selectedLaboratories || []).map((lab: any) => ({
              ...lab,
              sourceType: undefined,
            })),
          };
        }
        if (version < 11) {
          return {
            ...persistedState,
            filterLogic: 'OR',
          };
        }
        if (version < 12) {
          return {
            ...persistedState,
            tvaRates: [],
          };
        }
        return persistedState;
      },
    }
  )
);

export type { SelectedLaboratory, SelectedCategory, SelectedProduct, SelectedPharmacy };