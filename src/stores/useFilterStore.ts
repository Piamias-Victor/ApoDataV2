import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FilterState, FilterActions } from '@/types/filters';
import { createCoreSlice } from './slices/createCoreSlice';
import { createSettingsSlice } from './slices/createSettingsSlice';
import { createExclusionSlice } from './slices/createExclusionSlice';
import { createUiSlice } from './slices/createUiSlice';

// Combine Slices

export const useFilterStore = create<FilterState & FilterActions>()(
    persist(
        (...a) => ({
            ...createCoreSlice(...a),
            ...createSettingsSlice(...a),
            ...createExclusionSlice(...a),
            ...createUiSlice(...a),

            // Shared Actions
            getFilterState: () => {
                const state = a[1](); // get()
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
                    excludedPharmacies: state.excludedPharmacies,
                };
            },
            loadFilterState: (stateToLoad) => {
                a[0]({ // set()
                    ...stateToLoad,
                    // Preserve UI state
                    isFilterOpen: a[1]().isFilterOpen,
                    activeDrawer: a[1]().activeDrawer,
                });
            },
            resetAll: () => {
                // To reset, we can just call 'create' functions again? No.
                // We should manually trigger reset or define a reset object.
                // Since initial state is distributed, 'resetAll' is tricky.
                // But we can import initial state from a constant if we exported it, 
                // OR we can just hardcode the reset here as it was.
                // Actually, I should have exported `initialState` from a shared place or just redefine it here.
                // I will redefine it for simplicity as it's static.
                const currentYear = new Date().getFullYear();
                a[0]({
                    pharmacies: [],
                    dateRange: { start: `${currentYear}-01-01`, end: `${currentYear}-12-31` },
                    comparisonDateRange: { start: `${currentYear - 1}-01-01`, end: `${currentYear - 1}-12-31` },
                    products: [],
                    laboratories: [],
                    categories: [],
                    groups: [],
                    settings: {
                        productType: 'ALL',
                        tvaRates: [],
                        priceRange: null,
                        isGeneric: 'ALL',
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
                    filterOperators: [],
                    excludedProducts: [],
                    excludedLaboratories: [],
                    excludedCategories: [],
                    excludedPharmacies: [],
                    isFilterOpen: false,
                    activeDrawer: null,
                });
            }
        }),
        {
            name: 'apodata-filter-store-v5', // Increment version
            partialize: (state) => state,
        }
    )
);
