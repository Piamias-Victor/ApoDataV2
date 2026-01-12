import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useFilterStore } from '@/stores/useFilterStore';
import { useShallow } from 'zustand/react/shallow';
import { PharmacyMonthlyStat } from '@/repositories/kpi/PharmacyMonthlyRepository';

export const usePharmacyMonthlyStats = () => {
    const filters = useFilterStore(useShallow((state) => ({
        // We exclude pharmacies from filters because we want ALL pharmacies in this table usually, 
        // OR we respect it if user wants to see trends for just one. 
        // Standard behavior: Pass full context.
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
        
        // Dates are crucial here to define Year N and N-1
        dateRange: state.dateRange
    })));

    const queryParams = new URLSearchParams();
    // @ts-ignore
    queryParams.append('startDate', new Date(filters.dateRange.start).toISOString());
    // @ts-ignore
    queryParams.append('endDate', new Date(filters.dateRange.end).toISOString());
    
    // Pass other filters
    const filterContext = { ...filters };
    // @ts-ignore
    delete filterContext.dateRange;
    queryParams.append('filters', JSON.stringify(filterContext));

    const { data, error, isLoading } = useSWR<PharmacyMonthlyStat[]>(
        `/api/stats/pharmacies/monthly?${queryParams.toString()}`,
        fetcher
    );

    return {
        data,
        isLoading,
        isError: error
    };
};
