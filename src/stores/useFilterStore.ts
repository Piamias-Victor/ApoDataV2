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

    // Global
    setExcludedProducts: (codes: string[]) => void;
    setLogicOperator: (operator: 'AND' | 'OR') => void;
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
    excludedProductCodes: [],
    logicOperator: 'AND',
    // View state
    isFilterOpen: false,
    activeDrawer: null,
};

export const useFilterStore = create<FilterState & FilterActions>()(
    persist(
        (set) => ({
            ...initialState,

            // Actions
            setProducts: (products) => set({ products }),
            setLaboratories: (laboratories) => set({ laboratories }),
            setCategories: (categories) => set({ categories }),
            setGroups: (groups) => set({ groups }),

            setProductType: (productType) => set((state) => ({ settings: { ...state.settings, productType } })),
            setTvaRates: (tvaRates) => set((state) => ({ settings: { ...state.settings, tvaRates } })),
            setPriceRange: (priceRange) => set((state) => ({ settings: { ...state.settings, priceRange } })),
            setIsGeneric: (isGeneric) => set((state) => ({ settings: { ...state.settings, isGeneric } })),
            setLppCodes: (lppCodes) => set((state) => ({ settings: { ...state.settings, lppCodes } })),
            setRefundCodes: (refundCodes) => set((state) => ({ settings: { ...state.settings, refundCodes } })),
            setReimbursementStatus: (reimbursementStatus) => set((state) => ({ settings: { ...state.settings, reimbursementStatus } })),

            setPurchasePriceNetRange: (range) => set((state) => ({ settings: { ...state.settings, purchasePriceNetRange: range } })),
            setPurchasePriceGrossRange: (range) => set((state) => ({ settings: { ...state.settings, purchasePriceGrossRange: range } })),
            setSellPriceRange: (range) => set((state) => ({ settings: { ...state.settings, sellPriceRange: range } })),
            setDiscountRange: (range) => set((state) => ({ settings: { ...state.settings, discountRange: range } })),
            setMarginRange: (range) => set((state) => ({ settings: { ...state.settings, marginRange: range } })),

            setPharmacies: (pharmacies) => set({ pharmacies }),
            setDateRange: (dateRange) => set({ dateRange }),
            setComparisonDateRange: (comparisonDateRange) => set({ comparisonDateRange }),

            setExcludedProducts: (excludedProductCodes) => set({ excludedProductCodes }),
            setLogicOperator: (logicOperator) => set({ logicOperator }),

            resetAll: () => set(initialState)
        }),
        {
            name: 'apodata-filter-store-v2', // Unique name for V2
            partialize: (state) => {
                // Optionnel: ne pas persister certaines clés si besoin
                return state;
            }
        }
    )
);
