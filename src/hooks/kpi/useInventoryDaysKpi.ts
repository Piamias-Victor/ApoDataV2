import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/stores/useFilterStore';
import { AchatsKpiRequest, InventoryDaysResponse } from '@/types/kpi';

const fetchInventoryDaysKpi = async (request: AchatsKpiRequest): Promise<InventoryDaysResponse> => {
    const response = await fetch('/api/kpi/inventory-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return response.json();
};

export const useInventoryDaysKpi = () => {
    const {
        dateRange,
        comparisonDateRange,
        products,
        laboratories,
        categories,
        pharmacies,
        filterOperators,
        settings
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
        filterOperators: filterOperators,
        reimbursementStatus: settings.reimbursementStatus,
        isGeneric: settings.isGeneric,
    };

    return useQuery({
        queryKey: ['kpi', 'inventory-days', request],
        queryFn: () => fetchInventoryDaysKpi(request),
        staleTime: 1000 * 60 * 5,
    });
};
