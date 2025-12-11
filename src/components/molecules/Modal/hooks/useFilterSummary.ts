// src/components/molecules/Modal/hooks/useFilterSummary.ts
import { useMemo } from 'react';
import { FilterState } from '@/types/filters';

export interface FilterCounts {
    products: number;
    laboratories: number;
    categories: number;
    pharmacies: number;
    excludedProducts: number;
    excludedLaboratories: number;
    excludedCategories: number;
}

/**
 * Hook to calculate filter counts from filter state
 * @param filterState - The current filter state
 * @returns Object containing counts for each filter type
 */
export const useFilterSummary = (filterState: Omit<FilterState, 'isFilterOpen' | 'activeDrawer'>): FilterCounts => {
    return useMemo(() => ({
        products: filterState.products.length,
        laboratories: filterState.laboratories.length,
        categories: filterState.categories.length,
        pharmacies: filterState.pharmacies.length,
        excludedProducts: filterState.excludedProducts.length,
        excludedLaboratories: filterState.excludedLaboratories.length,
        excludedCategories: filterState.excludedCategories.length,
    }), [
        filterState.products.length,
        filterState.laboratories.length,
        filterState.categories.length,
        filterState.pharmacies.length,
        filterState.excludedProducts.length,
        filterState.excludedLaboratories.length,
        filterState.excludedCategories.length,
    ]);
};
