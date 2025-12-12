import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/stores/useFilterStore';
import { AchatsKpiRequest, StockKpiResponse } from '@/types/kpi';

const fetchStockKpi = async (request: AchatsKpiRequest): Promise<StockKpiResponse> => {
    const response = await fetch('/api/kpi/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return response.json();
};

export const useStockKpi = () => {
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
        categories: categories.map(c => ({ code: c.name, type: c.type })),
        pharmacyIds: pharmacies.map(p => p.id),

        // Exclusions
        excludedPharmacyIds: excludedPharmacies.map(p => p.id),
        excludedLaboratories: excludedLaboratories.map(l => l.name),
        excludedCategories: excludedCategories.map(c => ({ code: c.name, type: c.type })),
        excludedProductCodes: excludedProducts.map(p => p.code),

        filterOperators: filterOperators,

        // Add settings filters
        reimbursementStatus: settings.reimbursementStatus,
        isGeneric: settings.isGeneric,

        // No price ranges for Stock (as per scope, stock value is discrete)
        // If needed, we could add them, but standard Stock KPI usually just filters by product/pharmacy attributes.
    };

    return useQuery({
        queryKey: ['kpi', 'stock', request],
        queryFn: () => fetchStockKpi(request),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
