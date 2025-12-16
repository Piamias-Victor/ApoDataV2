import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/stores/useFilterStore';
import { AchatsKpiRequest } from '@/types/kpi';
import { PriceGlobalKpiResult } from '@/repositories/kpi/priceRepository';

async function fetchPriceKpis(request: AchatsKpiRequest): Promise<PriceGlobalKpiResult> {
    const response = await fetch('/api/kpi/price', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return response.json();
}

export const usePriceKpi = () => {
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

        // Exclusions
        excludedPharmacyIds: store.excludedPharmacies.map(p => p.id),
        excludedLaboratories: store.excludedLaboratories.map(l => l.name),
        excludedCategories: store.excludedCategories.map(c => ({ code: c.name, type: c.type })),
        excludedProductCodes: store.excludedProducts.map(p => p.code),
    };

    return useQuery({
        queryKey: ['price-kpis', request],
        queryFn: () => fetchPriceKpis(request),
        staleTime: 5 * 60 * 1000,
    });
};
