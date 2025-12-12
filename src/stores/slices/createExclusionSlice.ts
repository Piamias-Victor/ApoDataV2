import { StateCreator } from 'zustand';
import { FilterState, FilterActions, SelectedProduct, SelectedLaboratory, SelectedCategory, SelectedPharmacy } from '@/types/filters';

export interface ExclusionSlice {
    excludedProducts: SelectedProduct[];
    excludedLaboratories: SelectedLaboratory[];
    excludedCategories: SelectedCategory[];
    excludedPharmacies: SelectedPharmacy[];

    setExcludedProducts: (products: SelectedProduct[]) => void;
    setExcludedLaboratories: (laboratories: SelectedLaboratory[]) => void;
    setExcludedCategories: (categories: SelectedCategory[]) => void;
    setExcludedPharmacies: (pharmacies: SelectedPharmacy[]) => void;
    resetExclusions: () => void;
}

export const createExclusionSlice: StateCreator<FilterState & FilterActions, [], [], ExclusionSlice> = (set) => ({
    excludedProducts: [],
    excludedLaboratories: [],
    excludedCategories: [],
    excludedPharmacies: [],

    setExcludedProducts: (excludedProducts) => set({ excludedProducts }),
    setExcludedLaboratories: (excludedLaboratories) => set({ excludedLaboratories }),
    setExcludedCategories: (excludedCategories) => set({ excludedCategories }),
    setExcludedPharmacies: (excludedPharmacies) => set({ excludedPharmacies }),
    resetExclusions: () => set({
        excludedProducts: [],
        excludedLaboratories: [],
        excludedCategories: [],
        excludedPharmacies: []
    }),
});
