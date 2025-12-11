// src/hooks/kpi/useAchatsKpi.ts
import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/stores/useFilterStore';
import { AchatsKpiResponse } from '@/types/kpi';

/**
 * Hook to fetch Achats KPI data
 * Uses FilterStore for date range and filters
 */
export function useAchatsKpi() {
    const filterState = useFilterStore();

    return useQuery<AchatsKpiResponse>({
        queryKey: ['kpi', 'achats', {
            dateRange: filterState.dateRange,
            comparisonDateRange: filterState.comparisonDateRange,
            products: filterState.products.map(p => p.code),
            laboratories: filterState.laboratories.map(l => l.id),
            categories: filterState.categories.map(c => ({ code: c.id, type: c.type })),
            pharmacies: filterState.pharmacies.map(p => p.id),
            filterOperators: filterState.filterOperators
        }],
        queryFn: async ({ signal }) => {
            // Build request from FilterStore
            const request = {
                dateRange: {
                    start: filterState.dateRange.start || '2025-01-01',
                    end: filterState.dateRange.end || '2025-12-31'
                },
                ...(filterState.comparisonDateRange.start && filterState.comparisonDateRange.end && {
                    comparisonDateRange: {
                        start: filterState.comparisonDateRange.start,
                        end: filterState.comparisonDateRange.end
                    }
                }),
                ...(filterState.products.length > 0 && {
                    productCodes: filterState.products.map(p => p.code)
                }),
                ...(filterState.laboratories.length > 0 && {
                    laboratories: filterState.laboratories.map(l => l.id)
                }),
                ...(filterState.categories.length > 0 && {
                    categories: filterState.categories.map(c => ({
                        // Strip prefix if present (e.g., "bcb_segment_l1:Solaire" -> "Solaire")
                        code: c.id.includes(':') ? c.id.split(':')[1] : c.id,
                        type: c.type
                    }))
                }),
                ...(filterState.pharmacies.length > 0 && {
                    pharmacyIds: filterState.pharmacies.map(p => p.id)
                }),
                filterOperators: filterState.filterOperators
            };

            const response = await fetch('/api/kpi/achats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
                signal // Pass signal to enable request cancellation
            });

            if (!response.ok) {
                throw new Error('Failed to fetch Achats KPI');
            }

            return response.json();
        },
        staleTime: 12 * 60 * 60 * 1000, // 12h - same as backend cache
        gcTime: 24 * 60 * 60 * 1000, // 24h (renamed from cacheTime in React Query v5)
        enabled: !!filterState.dateRange.start && !!filterState.dateRange.end
    });
}
