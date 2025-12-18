import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useFilterStore } from '@/stores/useFilterStore';

export interface SimulationStats {
    realized_sales_ttc: number;
    realized_purchases_ht: number;
    prev_total_sales_ttc: number;
    prev_total_purchases_ht: number;
    prev_remaining_sales_ttc: number;
    prev_remaining_purchases_ht: number;
}

import { useShallow } from 'zustand/react/shallow';

export const useSimulationStats = () => {
    const filters = useFilterStore(useShallow((state) => ({
        pharmacies: state.pharmacies,
        products: state.products,
        laboratories: state.laboratories,
        categories: state.categories,
        groups: state.groups,
        settings: state.settings,
        filterOperators: state.filterOperators,
        excludedProducts: state.excludedProducts,
        excludedLaboratories: state.excludedLaboratories,
        excludedCategories: state.excludedCategories,
        excludedPharmacies: state.excludedPharmacies,
        // DATES ARE EXCLUDED PURPOSELY
    })));

    const queryParams = new URLSearchParams();

    // We pass the entire filter state (minus dates) as a JSON string
    // This allows the backend to use FilterQueryBuilder easily
    queryParams.append('filters', JSON.stringify(filters));

    // Keep pharmacyId param for potential legacy compatibility if needed, 
    // but the new API logic will likely read from 'filters' or we update API to look at 'filters.pharmacies'.
    // Let's rely on the 'filters' param.

    const { data, error, isLoading } = useSWR<SimulationStats>(
        `/api/stats/simulation?${queryParams.toString()}`,
        fetcher
    );

    return {
        data,
        isLoading,
        isError: error
    };
};
