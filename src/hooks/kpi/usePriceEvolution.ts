import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/stores/useFilterStore';
import { AchatsKpiRequest } from '@/types/kpi';
import { PriceEvolutionDataPoint } from '@/repositories/kpi/priceRepository';

export const usePriceEvolution = (specificProductEan?: string) => {
    const store = useFilterStore();

    const request: AchatsKpiRequest = {
        dateRange: {
            start: store.dateRange.start || '',
            end: store.dateRange.end || ''
        },
        pharmacyIds: store.pharmacies.map(p => p.id),
        laboratories: store.laboratories.map(l => l.name),
        categories: store.categories.map(c => ({ code: c.name, type: c.type })),
        productCodes: specificProductEan ? [specificProductEan] : store.products.map(p => p.code),
        filterOperators: store.filterOperators,

        excludedPharmacyIds: store.excludedPharmacies.map(p => p.id),
        excludedLaboratories: store.excludedLaboratories.map(l => l.name),
        excludedCategories: store.excludedCategories.map(c => ({ code: c.name, type: c.type })),
        excludedProductCodes: store.excludedProducts.map(p => p.code),
    };

    return useQuery({
        queryKey: ['price-evolution', request],
        queryFn: async () => {
            const res = await fetch('/api/kpi/price/evolution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });
            if (!res.ok) throw new Error('Failed to fetch price evolution');
            return res.json() as Promise<PriceEvolutionDataPoint[]>;
        },
        staleTime: 5 * 60 * 1000,
        enabled: !!store.dateRange.start && !!store.dateRange.end
    });
};
