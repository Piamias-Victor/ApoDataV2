import { StateCreator } from 'zustand';
import { FilterState, FilterActions, FilterSettings } from '@/types/filters';
import { calculateFilterOperators } from '../utils/storeUtils';

export interface SettingsSlice {
    settings: FilterSettings;
    setProductType: (type: FilterSettings['productType']) => void;
    setTvaRates: (rates: number[]) => void;
    setPriceRange: (range: { min: number; max: number } | null) => void;
    setIsGeneric: (isGeneric: 'ALL' | 'PRINCEPS_GENERIC' | 'GENERIC' | 'PRINCEPS') => void;
    setLppCodes: (codes: string[]) => void;
    setRefundCodes: (codes: string[]) => void;
    setReimbursementStatus: (status: 'ALL' | 'REIMBURSED' | 'NOT_REIMBURSED') => void;
    setPurchasePriceNetRange: (range: { min: number; max: number } | null) => void;
    setPurchasePriceGrossRange: (range: { min: number; max: number } | null) => void;
    setSellPriceRange: (range: { min: number; max: number } | null) => void;
    setDiscountRange: (range: { min: number; max: number } | null) => void;
    setMarginRange: (range: { min: number; max: number } | null) => void;
}

export const createSettingsSlice: StateCreator<FilterState & FilterActions, [], [], SettingsSlice> = (set) => ({
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

    setProductType: (productType) => set((state) => ({ settings: { ...state.settings, productType } })),

    setTvaRates: (tvaRates) => set((state) => {
        const update = { settings: { ...state.settings, tvaRates } };
        const operatorsUpdate = calculateFilterOperators(state as FilterState, update as Partial<FilterState>); // Type assertion due to partial state update
        // Actually, we pass the merged hypothetical state to calculator if possible, or partial.
        // My utility accepts Partial<FilterState> as second arg.
        // It merges: { ...state, ...updatedFields }.
        // Here update is { settings: ... }. Correct.
        return operatorsUpdate ? { ...update, ...operatorsUpdate } : update;
    }),

    setPriceRange: (priceRange) => set((state) => ({ settings: { ...state.settings, priceRange } })),

    setIsGeneric: (isGeneric) => set((state) => {
        const update = { settings: { ...state.settings, isGeneric } };
        const operatorsUpdate = calculateFilterOperators(state as FilterState, update as Partial<FilterState>);
        return operatorsUpdate ? { ...update, ...operatorsUpdate } : update;
    }),

    setLppCodes: (lppCodes) => set((state) => ({ settings: { ...state.settings, lppCodes } })),
    setRefundCodes: (refundCodes) => set((state) => ({ settings: { ...state.settings, refundCodes } })),

    setReimbursementStatus: (reimbursementStatus) => set((state) => {
        const update = { settings: { ...state.settings, reimbursementStatus } };
        const operatorsUpdate = calculateFilterOperators(state as FilterState, update as Partial<FilterState>);
        return operatorsUpdate ? { ...update, ...operatorsUpdate } : update;
    }),

    setPurchasePriceNetRange: (range) => set((state) => {
        const update = { settings: { ...state.settings, purchasePriceNetRange: range } };
        const operatorsUpdate = calculateFilterOperators(state as FilterState, update as Partial<FilterState>);
        return operatorsUpdate ? { ...update, ...operatorsUpdate } : update;
    }),

    setPurchasePriceGrossRange: (range) => set((state) => {
        const update = { settings: { ...state.settings, purchasePriceGrossRange: range } };
        const operatorsUpdate = calculateFilterOperators(state as FilterState, update as Partial<FilterState>);
        return operatorsUpdate ? { ...update, ...operatorsUpdate } : update;
    }),

    setSellPriceRange: (range) => set((state) => {
        const update = { settings: { ...state.settings, sellPriceRange: range } };
        const operatorsUpdate = calculateFilterOperators(state as FilterState, update as Partial<FilterState>);
        return operatorsUpdate ? { ...update, ...operatorsUpdate } : update;
    }),

    setDiscountRange: (range) => set((state) => {
        const update = { settings: { ...state.settings, discountRange: range } };
        const operatorsUpdate = calculateFilterOperators(state as FilterState, update as Partial<FilterState>);
        return operatorsUpdate ? { ...update, ...operatorsUpdate } : update;
    }),

    setMarginRange: (range) => set((state) => {
        const update = { settings: { ...state.settings, marginRange: range } };
        const operatorsUpdate = calculateFilterOperators(state as FilterState, update as Partial<FilterState>);
        return operatorsUpdate ? { ...update, ...operatorsUpdate } : update;
    }),
});
