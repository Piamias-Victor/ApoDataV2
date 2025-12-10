// src/hooks/pharmacies/usePharmacyGroupComparison.ts
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { BaseHookReturn } from '@/hooks/common/types';

/**
 * Metrics structure for a single entity (selected pharmacies or group)
 */
export interface MetricsData {
    readonly ca_sell_in: number;
    readonly ca_sell_in_comparison?: number;
    readonly evol_sell_in_pct?: number;

    readonly ca_sell_out: number;
    readonly ca_sell_out_comparison?: number;
    readonly evol_sell_out_pct?: number;

    readonly marge: number;
    readonly marge_comparison?: number;
    readonly evol_marge_pct?: number;

    readonly taux_marge: number;
    readonly taux_marge_comparison?: number;

    readonly stock: number;
    readonly stock_comparison?: number;
}

/**
 * Response interface for pharmacy group comparison
 */
export interface PharmacyGroupComparisonData {
    readonly selectedPharmacies: MetricsData;
    readonly groupAverage: MetricsData;
    readonly pharmacyCount: number;
    readonly totalPharmaciesInGroup: number;
    readonly queryTime: number;
    readonly cached: boolean;
}

/**
 * Hook parameters
 */
interface UsePharmacyGroupComparisonParams {
    readonly enabled?: boolean;
    readonly dateRange: {
        readonly start: string;
        readonly end: string;
    };
    readonly comparisonDateRange?: {
        readonly start: string | null;
        readonly end: string | null;
    } | undefined;
    readonly pharmacyIds: string[];
    readonly productCodes?: string[] | undefined;
}

/**
 * Hook return type
 */
interface UsePharmacyGroupComparisonReturn extends BaseHookReturn<PharmacyGroupComparisonData> { }

/**
 * Hook for fetching pharmacy group comparison data
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = usePharmacyGroupComparison({
 *   enabled: pharmacyIds.length > 0,
 *   dateRange: { start: '2024-01-01', end: '2024-01-31' },
 *   pharmacyIds: ['uuid-1', 'uuid-2'],
 *   productCodes: ['EAN1', 'EAN2']
 * });
 * ```
 */
export function usePharmacyGroupComparison({
    enabled = true,
    dateRange,
    comparisonDateRange,
    pharmacyIds,
    productCodes
}: UsePharmacyGroupComparisonParams): UsePharmacyGroupComparisonReturn {

    // Disable fetch if no pharmacies are selected
    const shouldFetch = enabled && pharmacyIds.length > 0;

    console.log('🔄 [usePharmacyGroupComparison] Hook called:', {
        enabled: shouldFetch,
        pharmacyIds: pharmacyIds.length,
        productCodes: productCodes?.length || 0,
        hasComparison: !!(comparisonDateRange?.start && comparisonDateRange?.end)
    });

    const result = useStandardFetch<PharmacyGroupComparisonData>('/api/pharmacies/group-comparison', {
        enabled: shouldFetch,
        dateRange,
        comparisonDateRange,
        includeComparison: !!(comparisonDateRange?.start && comparisonDateRange?.end),
        filters: {
            pharmacyIds,
            ...(productCodes && productCodes.length > 0 && { productCodes })
        }
    });

    return result;
}
