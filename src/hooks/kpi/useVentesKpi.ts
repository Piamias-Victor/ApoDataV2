import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/stores/useFilterStore';
import { AchatsKpiRequest, VentesKpiResponse } from '@/types/kpi';

const fetchVentesKpi = async (request: AchatsKpiRequest): Promise<VentesKpiResponse> => {
    const response = await fetch('/api/kpi/ventes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return response.json();
};

export const useVentesKpi = () => {
    const {
        dateRange,
        comparisonDateRange, // Retrieve comparison dates
        products,
        laboratories,
        categories,
        pharmacies,
        filterOperators, // Retrieve operators from store
        settings
    } = useFilterStore();

    // Prepare request object
    const request: AchatsKpiRequest = {
        dateRange: {
            start: dateRange.start || '',
            end: dateRange.end || ''
        },
        // Add comparison date range if set
        ...(comparisonDateRange?.start && comparisonDateRange?.end && {
            comparisonDateRange: {
                start: comparisonDateRange.start,
                end: comparisonDateRange.end
            }
        }),
        productCodes: products.map(p => p.code),
        laboratories: laboratories.map(l => l.name),
        categories: categories.map(c => ({ code: c.name, type: c.type })), // Assuming simplified structure for now or mapping correctly
        pharmacyIds: pharmacies.map(p => p.id),
        filterOperators: filterOperators, // Pass operators to API

        // Add settings filters
        tvaRates: settings.tvaRates,
        reimbursementStatus: settings.reimbursementStatus,
        isGeneric: settings.isGeneric,

        // Add range filters if set and not default
        ...((settings.purchasePriceNetRange && (settings.purchasePriceNetRange.min !== 0 || settings.purchasePriceNetRange.max !== 100000)) ? { purchasePriceNetRange: settings.purchasePriceNetRange } : {}),

        ...((settings.purchasePriceGrossRange && (settings.purchasePriceGrossRange.min !== 0 || settings.purchasePriceGrossRange.max !== 100000)) ? { purchasePriceGrossRange: settings.purchasePriceGrossRange } : {}),

        ...((settings.sellPriceRange && (settings.sellPriceRange.min !== 0 || settings.sellPriceRange.max !== 100000)) ? { sellPriceRange: settings.sellPriceRange } : {}),

        ...((settings.discountRange && (settings.discountRange.min !== 0 || settings.discountRange.max !== 100)) ? { discountRange: settings.discountRange } : {}),

        ...((settings.marginRange && (settings.marginRange.min !== 0 || settings.marginRange.max !== 100)) ? { marginRange: settings.marginRange } : {}),
    };

    return useQuery({
        queryKey: ['kpi', 'ventes', request],
        queryFn: () => fetchVentesKpi(request),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
