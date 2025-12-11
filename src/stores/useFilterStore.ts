// src/stores/useFilterStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FilterState, SelectedLaboratory, SelectedCategory, SelectedGroup, SelectedProduct, SelectedPharmacy, DateRange, FilterSettings } from '@/types/filters';

interface FilterActions {
    // Setters Scope
    setProducts: (products: SelectedProduct[]) => void;
    setLaboratories: (laboratories: SelectedLaboratory[]) => void;
    setCategories: (categories: SelectedCategory[]) => void;
    setGroups: (groups: SelectedGroup[]) => void;

    // Setters Attributes
    setProductType: (type: FilterSettings['productType']) => void;
    setTvaRates: (rates: number[]) => void;
    setPriceRange: (range: { min: number; max: number } | null) => void;
    setIsGeneric: (isGeneric: boolean | undefined) => void;
    setLppCodes: (codes: string[]) => void;
    setRefundCodes: (codes: string[]) => void;
    setReimbursementStatus: (status: 'ALL' | 'REIMBURSED' | 'NOT_REIMBURSED') => void;

    // Price Range Setters
    setPurchasePriceNetRange: (range: { min: number; max: number } | null) => void;
    setPurchasePriceGrossRange: (range: { min: number; max: number } | null) => void;
    setSellPriceRange: (range: { min: number; max: number } | null) => void;
    setDiscountRange: (range: { min: number; max: number } | null) => void;
    setMarginRange: (range: { min: number; max: number } | null) => void;

    // Setters Target
    setPharmacies: (pharmacies: SelectedPharmacy[]) => void;
    setDateRange: (range: DateRange) => void;
    setComparisonDateRange: (range: DateRange) => void;

    // Filter Operators
    setFilterOperator: (index: number, operator: 'AND' | 'OR') => void;
    resetFilterOperators: () => void;

    // Exclusions
    setExcludedProducts: (products: SelectedProduct[]) => void;
    setExcludedLaboratories: (laboratories: SelectedLaboratory[]) => void;
    setExcludedCategories: (categories: SelectedCategory[]) => void;
    resetExclusions: () => void;

    // Save/Load
    getFilterState: () => Omit<FilterState, 'isFilterOpen' | 'activeDrawer'>;
    loadFilterState: (state: Omit<FilterState, 'isFilterOpen' | 'activeDrawer'>) => void;

    resetAll: () => void;
}

const initialState: FilterState = {
    pharmacies: [],
    dateRange: { start: null, end: null },
    comparisonDateRange: { start: null, end: null },
    products: [],
    laboratories: [],
    categories: [],
    groups: [],
    settings: {
        productType: 'ALL',
        tvaRates: [],
        priceRange: null,
        isGeneric: undefined,
        lppCodes: [],
        refundCodes: [],
        reimbursementStatus: 'ALL',
        marketType: 'ALL',
        purchasePriceNetRange: null,
        purchasePriceGrossRange: null,
        sellPriceRange: null,
        discountRange: null,
        marginRange: null,
    },
    useNMinus1: false,
    filterOperators: [], // Empty by default
    // Exclusions
    excludedProducts: [],
    excludedLaboratories: [],
    excludedCategories: [],
    // View state
    isFilterOpen: false,
    activeDrawer: null,
};

export const useFilterStore = create<FilterState & FilterActions>()(
    persist(
        (set, get) => {
            // Helper to sync filterOperators with current filter count
            const syncFilterOperators = () => {
                const state = get();
                let filterCount = 0;

                // Count all active filters
                filterCount += state.pharmacies.length;
                filterCount += state.laboratories.length;
                filterCount += state.categories.length;
                filterCount += state.products.length;
                filterCount += state.settings.tvaRates.length;
                if (state.settings.reimbursementStatus !== 'ALL') filterCount++;
                if (state.settings.isGeneric !== undefined) filterCount++;

                // Count price ranges (non-default values)
                if (state.settings.purchasePriceNetRange &&
                    (state.settings.purchasePriceNetRange.min !== 0 || state.settings.purchasePriceNetRange.max !== 100000)) filterCount++;
                if (state.settings.purchasePriceGrossRange &&
                    (state.settings.purchasePriceGrossRange.min !== 0 || state.settings.purchasePriceGrossRange.max !== 100000)) filterCount++;
                if (state.settings.sellPriceRange &&
                    (state.settings.sellPriceRange.min !== 0 || state.settings.sellPriceRange.max !== 100000)) filterCount++;
                if (state.settings.discountRange &&
                    (state.settings.discountRange.min !== 0 || state.settings.discountRange.max !== 100)) filterCount++;
                if (state.settings.marginRange &&
                    (state.settings.marginRange.min !== 0 || state.settings.marginRange.max !== 100)) filterCount++;

                const requiredOperators = Math.max(0, filterCount - 1);
                const currentOperators = state.filterOperators;

                if (currentOperators.length !== requiredOperators) {
                    const newOperators = [...currentOperators];

                    // Add missing operators (default to AND)
                    while (newOperators.length < requiredOperators) {
                        newOperators.push('AND');
                    }

                    // Remove extra operators
                    if (newOperators.length > requiredOperators) {
                        newOperators.splice(requiredOperators);
                    }

                    set({ filterOperators: newOperators });
                }
            };

            return {
                ...initialState,

                // Actions
                setProducts: (products) => {
                    set({ products });
                    syncFilterOperators();
                },
                setLaboratories: (laboratories) => {
                    set({ laboratories });
                    syncFilterOperators();
                },
                setCategories: (categories) => {
                    set({ categories });
                    syncFilterOperators();
                },
                setGroups: (groups) => {
                    set({ groups });
                    syncFilterOperators();
                },

                setProductType: (productType) => set((state) => ({ settings: { ...state.settings, productType } })),
                setTvaRates: (tvaRates) => {
                    set((state) => ({ settings: { ...state.settings, tvaRates } }));
                    syncFilterOperators();
                },
                setPriceRange: (priceRange) => set((state) => ({ settings: { ...state.settings, priceRange } })),
                setIsGeneric: (isGeneric) => {
                    set((state) => ({ settings: { ...state.settings, isGeneric } }));
                    syncFilterOperators();
                },
                setLppCodes: (lppCodes) => set((state) => ({ settings: { ...state.settings, lppCodes } })),
                setRefundCodes: (refundCodes) => set((state) => ({ settings: { ...state.settings, refundCodes } })),
                setReimbursementStatus: (reimbursementStatus) => {
                    set((state) => ({ settings: { ...state.settings, reimbursementStatus } }));
                    syncFilterOperators();
                },

                setPurchasePriceNetRange: (range) => {
                    set((state) => ({ settings: { ...state.settings, purchasePriceNetRange: range } }));
                    syncFilterOperators();
                },
                setPurchasePriceGrossRange: (range) => {
                    set((state) => ({ settings: { ...state.settings, purchasePriceGrossRange: range } }));
                    syncFilterOperators();
                },
                setSellPriceRange: (range) => {
                    set((state) => ({ settings: { ...state.settings, sellPriceRange: range } }));
                    syncFilterOperators();
                },
                setDiscountRange: (range) => {
                    set((state) => ({ settings: { ...state.settings, discountRange: range } }));
                    syncFilterOperators();
                },
                setMarginRange: (range) => {
                    set((state) => ({ settings: { ...state.settings, marginRange: range } }));
                    syncFilterOperators();
                },

                setPharmacies: (pharmacies) => {
                    set({ pharmacies });
                    syncFilterOperators();
                },
                setDateRange: (dateRange) => set({ dateRange }),
                setComparisonDateRange: (comparisonDateRange) => set({ comparisonDateRange }),

                // Filter Operators Actions
                setFilterOperator: (index, operator) => set((state) => {
                    const newOperators = [...state.filterOperators];
                    newOperators[index] = operator;
                    return { filterOperators: newOperators };
                }),
                resetFilterOperators: () => set({ filterOperators: [] }),

                // Exclusions Actions
                setExcludedProducts: (excludedProducts) => set({ excludedProducts }),
                setExcludedLaboratories: (excludedLaboratories) => set({ excludedLaboratories }),
                setExcludedCategories: (excludedCategories) => set({ excludedCategories }),
                resetExclusions: () => set({
                    excludedProducts: [],
                    excludedLaboratories: [],
                    excludedCategories: []
                }),

                // Save/Load methods
                getFilterState: () => {
                    const state = get();
                    return {
                        pharmacies: state.pharmacies,
                        dateRange: state.dateRange,
                        comparisonDateRange: state.comparisonDateRange,
                        products: state.products,
                        laboratories: state.laboratories,
                        categories: state.categories,
                        groups: state.groups,
                        settings: state.settings,
                        useNMinus1: state.useNMinus1,
                        filterOperators: state.filterOperators,
                        excludedProducts: state.excludedProducts,
                        excludedLaboratories: state.excludedLaboratories,
                        excludedCategories: state.excludedCategories,
                    };
                },
                loadFilterState: (state) => {
                    set({
                        ...state,
                        isFilterOpen: get().isFilterOpen,
                        activeDrawer: get().activeDrawer,
                    });
                },

                resetAll: () => set(initialState),
            };
        },
        {
            name: 'apodata-filter-store-v3', // Changed version to clear old data
            partialize: (state) => {
                // Optionnel: ne pas persister certaines clés si besoin
                return state;
            }
        }
    )
);
