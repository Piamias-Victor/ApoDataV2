import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useFilterStore } from '@/stores/useFilterStore';
import { AchatsKpiRequest } from '@/types/kpi';
import { PriceProductAnalysis } from '@/repositories/kpi/priceRepository';

interface UsePriceProductsParams {
    page: number;
    limit: number;
    orderBy: string;
    orderDirection: 'asc' | 'desc';
    search?: string;
}

async function fetchPriceProducts(request: AchatsKpiRequest, params: UsePriceProductsParams): Promise<PriceProductAnalysis[]> {
    const response = await fetch('/api/kpi/price/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            kpiRequest: request,
            ...params
        }),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return response.json();
}

export const usePriceProducts = (params: UsePriceProductsParams): UseQueryResult<PriceProductAnalysis[], Error> => {
    const store = useFilterStore();

    const request: AchatsKpiRequest = {
        dateRange: {
            start: store.dateRange.start || '',
            end: store.dateRange.end || ''
        },
        pharmacyIds: store.pharmacies.map(p => p.id),
        laboratories: store.laboratories.map(l => l.name),
        categories: store.categories.map(c => ({ code: c.name, type: c.type })),
        productCodes: store.products.map(p => p.code),
        filterOperators: store.filterOperators,

        excludedPharmacyIds: store.excludedPharmacies.map(p => p.id),
        excludedLaboratories: store.excludedLaboratories.map(l => l.name),
        excludedCategories: store.excludedCategories.map(c => ({ code: c.name, type: c.type })),
        excludedProductCodes: store.excludedProducts.map(p => p.code),
    };

    return useQuery<PriceProductAnalysis[], Error>({
        queryKey: ['price-products', request, params],
        queryFn: () => fetchPriceProducts(request, params),
        // keepPreviousData is deprecated in v5. Use placeholderData: keepPreviousData or identity.
        // But let's check installed version. package.json says ^5.90.12.
        // So keepPreviousData option is REMOVED.
        // I should use `placeholderData: (previousData) => previousData`
        // User requested to show skeleton on loading, so we remove placeholderData to let data be undefined during fetch.
        // placeholderData: (previousData) => previousData,
    });
};
