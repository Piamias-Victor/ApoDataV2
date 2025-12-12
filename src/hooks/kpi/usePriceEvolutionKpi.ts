import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/stores/useFilterStore';
import { AchatsKpiRequest, PriceEvolutionResponse } from '@/types/kpi';

const fetchPriceEvolutionKpi = async (request: AchatsKpiRequest): Promise<PriceEvolutionResponse> => {
    const response = await fetch('/api/kpi/price-evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return response.json();
};

export const usePriceEvolutionKpi = () => {
    const {
        dateRange,
        comparisonDateRange,
        products,
        laboratories,
        categories,
        pharmacies,
        filterOperators,
        settings,
        excludedPharmacies,
        excludedLaboratories,
        excludedCategories,
        excludedProducts
    } = useFilterStore();

    const request: AchatsKpiRequest = {
        dateRange: {
            start: dateRange.start || '',
            end: dateRange.end || ''
        },
        ...(comparisonDateRange?.start && comparisonDateRange?.end && {
            comparisonDateRange: {
                start: comparisonDateRange.start,
                end: comparisonDateRange.end
            }
        }),
        productCodes: products.map(p => p.code),
        laboratories: laboratories.map(l => l.name),
        categories: categories.map(c => ({ code: c.name, type: c.type })),
        pharmacyIds: pharmacies.map(p => p.id),

        // Exclusions
        excludedPharmacyIds: excludedPharmacies.map(p => p.id),
        excludedLaboratories: excludedLaboratories.map(l => l.name),
        excludedCategories: excludedCategories.map(c => ({ code: c.name, type: c.type })),
        excludedProductCodes: excludedProducts.map(p => p.code),

        filterOperators: filterOperators,
        reimbursementStatus: settings.reimbursementStatus,
        isGeneric: settings.isGeneric,
        tvaRates: settings.tvaRates,
    };

    return useQuery({
        queryKey: ['kpi', 'price-evolution', request],
        queryFn: () => fetchPriceEvolutionKpi(request),
        staleTime: 1000 * 60 * 5,
    });
};
