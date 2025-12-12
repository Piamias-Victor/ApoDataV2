import { StateCreator } from 'zustand';
import { FilterState, FilterActions, SelectedProduct, SelectedLaboratory, SelectedCategory, SelectedPharmacy, SelectedGroup, DateRange } from '@/types/filters';
import { calculateFilterOperators } from '../utils/storeUtils';

export interface CoreSlice {
    products: SelectedProduct[];
    laboratories: SelectedLaboratory[];
    categories: SelectedCategory[];
    groups: SelectedGroup[];
    pharmacies: SelectedPharmacy[];
    dateRange: DateRange;
    comparisonDateRange: DateRange;
    useNMinus1: boolean;
    filterOperators: ('AND' | 'OR')[];

    setProducts: (products: SelectedProduct[]) => void;
    setLaboratories: (laboratories: SelectedLaboratory[]) => void;
    setCategories: (categories: SelectedCategory[]) => void;
    setGroups: (groups: SelectedGroup[]) => void;
    setPharmacies: (pharmacies: SelectedPharmacy[]) => void;
    setDateRange: (range: DateRange) => void;
    setComparisonDateRange: (range: DateRange) => void;

    setFilterOperator: (index: number, operator: 'AND' | 'OR') => void;
    resetFilterOperators: () => void;
}

export const createCoreSlice: StateCreator<FilterState & FilterActions, [], [], CoreSlice> = (set) => ({
    products: [],
    laboratories: [],
    categories: [],
    groups: [],
    pharmacies: [],
    dateRange: { start: `${new Date().getFullYear()}-01-01`, end: `${new Date().getFullYear()}-12-31` },
    comparisonDateRange: { start: `${new Date().getFullYear() - 1}-01-01`, end: `${new Date().getFullYear() - 1}-12-31` },
    useNMinus1: false,
    filterOperators: [],

    setProducts: (products) => set((state) => {
        const update = { products };
        const operatorsUpdate = calculateFilterOperators(state, update);
        return operatorsUpdate ? { ...update, ...operatorsUpdate } : update;
    }),
    setLaboratories: (laboratories) => set((state) => {
        const update = { laboratories };
        const operatorsUpdate = calculateFilterOperators(state, update);
        return operatorsUpdate ? { ...update, ...operatorsUpdate } : update;
    }),
    setCategories: (categories) => set((state) => {
        const update = { categories };
        const operatorsUpdate = calculateFilterOperators(state, update);
        return operatorsUpdate ? { ...update, ...operatorsUpdate } : update;
    }),
    setGroups: (groups) => set((state) => {
        const update = { groups };
        const operatorsUpdate = calculateFilterOperators(state, update);
        return operatorsUpdate ? { ...update, ...operatorsUpdate } : update;
    }),
    setPharmacies: (pharmacies) => set((state) => {
        const update = { pharmacies };
        const operatorsUpdate = calculateFilterOperators(state, update);
        return operatorsUpdate ? { ...update, ...operatorsUpdate } : update;
    }),
    setDateRange: (dateRange) => set({ dateRange }),
    setComparisonDateRange: (comparisonDateRange) => set({ comparisonDateRange }),

    setFilterOperator: (index, operator) => set((state) => {
        const newOperators = [...state.filterOperators];
        newOperators[index] = operator;
        return { filterOperators: newOperators };
    }),
    resetFilterOperators: () => set({ filterOperators: [] }),
});
