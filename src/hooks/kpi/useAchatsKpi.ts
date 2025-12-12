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
            excludedPharmacies: filterState.excludedPharmacies.map(p => p.id),
            excludedLaboratories: filterState.excludedLaboratories.map(l => l.id),
            excludedCategories: filterState.excludedCategories.map(c => ({ code: c.id, type: c.type })),
            excludedProducts: filterState.excludedProducts.map(p => p.code),
            filterOperators: filterState.filterOperators,
            settings: {
                tvaRates: filterState.settings.tvaRates,
                reimbursementStatus: filterState.settings.reimbursementStatus,
                isGeneric: filterState.settings.isGeneric,
                purchasePriceNetRange: filterState.settings.purchasePriceNetRange,
                purchasePriceGrossRange: filterState.settings.purchasePriceGrossRange,
                sellPriceRange: filterState.settings.sellPriceRange,
                discountRange: filterState.settings.discountRange,
                marginRange: filterState.settings.marginRange
            }
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
                // Exclusions
                ...(filterState.excludedPharmacies.length > 0 && {
                    excludedPharmacyIds: filterState.excludedPharmacies.map(p => p.id)
                }),
                ...(filterState.excludedLaboratories.length > 0 && {
                    excludedLaboratories: filterState.excludedLaboratories.map(l => l.id)
                }),
                ...(filterState.excludedCategories.length > 0 && {
                    excludedCategories: filterState.excludedCategories.map(c => ({
                        code: c.id.includes(':') ? c.id.split(':')[1] : c.id,
                        type: c.type
                    }))
                }),
                ...(filterState.excludedProducts.length > 0 && {
                    excludedProductCodes: filterState.excludedProducts.map(p => p.code)
                }),
                // Settings Filters
                ...(filterState.settings.tvaRates.length > 0 && {
                    tvaRates: filterState.settings.tvaRates
                }),
                ...(filterState.settings.reimbursementStatus !== 'ALL' && {
                    reimbursementStatus: filterState.settings.reimbursementStatus
                }),
                ...(filterState.settings.isGeneric !== 'ALL' && {
                    isGeneric: filterState.settings.isGeneric
                }),
                ...(filterState.settings.purchasePriceNetRange &&
                    (filterState.settings.purchasePriceNetRange.min > 0 || filterState.settings.purchasePriceNetRange.max < 100000) && {
                    purchasePriceNetRange: filterState.settings.purchasePriceNetRange
                }),
                ...(filterState.settings.purchasePriceGrossRange &&
                    (filterState.settings.purchasePriceGrossRange.min > 0 || filterState.settings.purchasePriceGrossRange.max < 100000) && {
                    purchasePriceGrossRange: filterState.settings.purchasePriceGrossRange
                }),
                ...(filterState.settings.sellPriceRange &&
                    (filterState.settings.sellPriceRange.min > 0 || filterState.settings.sellPriceRange.max < 100000) && {
                    sellPriceRange: filterState.settings.sellPriceRange
                }),
                ...(filterState.settings.discountRange &&
                    (filterState.settings.discountRange.min > 0 || filterState.settings.discountRange.max < 100) && {
                    discountRange: filterState.settings.discountRange
                }),
                ...(filterState.settings.marginRange &&
                    (filterState.settings.marginRange.min > 0 || filterState.settings.marginRange.max < 100) && {
                    marginRange: filterState.settings.marginRange
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
