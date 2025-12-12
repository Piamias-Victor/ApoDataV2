import { AchatsKpiRequest } from '@/types/kpi';
import { queryCache, withCache } from '@/lib/cache/queryCache';

export interface KpiServiceOptions<TData, TResult> {
    /** The cache key prefix (e.g., 'achats', 'ventes') */
    key: string;
    /** Function to fetch data from repository */
    fetchData: (req: AchatsKpiRequest) => Promise<TData>;
    /** Function to format the final response, calculating extra fields if needed */
    formatResponse: (currentData: TData, evolutionPercent?: number, comparisonData?: TData) => TResult;
    /** 
     * Function to extract the value used for evolution calculation. 
     * If not provided, evolution will not be calculated automatically.
     * Returns the value to compare (e.g., montant_ht)
     */
    calculateEvolutionValue?: (data: TData) => number;
}

/**
 * Generic helper to fetch KPI data with caching and evolution calculation.
 */
export async function getKpiDataWithEvolution<TData, TResult>(
    request: AchatsKpiRequest,
    options: KpiServiceOptions<TData, TResult>
): Promise<TResult & { duration: string }> {
    const startTime = Date.now();
    const { key, fetchData, formatResponse, calculateEvolutionValue } = options;

    // 1. Generate Cache Key using full request (handles all exclusions/filters)
    // We assume request contains all necessary fields as per previous fixes.
    // Explicitly destructuring to ensure consistent key generation if generateKey is picky,
    // but passing 'request' usually works if it matches the shape.
    // However, to be 100% safe and consistent with my recent fixes, I will use a standardized object builder.
    // Actually, queryCache.generateKey handles objects fine.
    // The previous issue was manual construction missing fields.
    // Here we pass the full request object + any specific overrides if needed.

    // For services that need "targetDate" (Stock/Inventory), they pass it in request or handled inside fetchData?
    // Inventory uses { ...request, targetDate }.
    // We can allow key generation to be customized or just pass request.
    // Let's rely on standard request for most, but allow override?
    // Let's keep it simple: Pass request. The Repository function handles logic.
    // But Cache Key needs to be unique.

    // Let's just pass `request`.
    const currentCacheKey = queryCache.generateKey(key, request);

    // 2. Fetch Current Data
    const currentData = await withCache(currentCacheKey, () => fetchData(request));

    let evolution_percent: number | undefined;
    let comparisonData: TData | undefined;

    // 3. Fetch Comparison Data if available
    if (request.comparisonDateRange?.start && request.comparisonDateRange?.end) {
        // Create comparison request
        const { comparisonDateRange, ...restRequest } = request;
        const comparisonRequest = {
            ...restRequest,
            dateRange: comparisonDateRange
        };

        const comparisonCacheKey = queryCache.generateKey(key, comparisonRequest);

        comparisonData = await withCache(comparisonCacheKey, () => fetchData(comparisonRequest));

        // 4. Calculate Evolution
        if (calculateEvolutionValue && comparisonData) {
            const currentVal = calculateEvolutionValue(currentData);
            const compVal = calculateEvolutionValue(comparisonData);

            if (compVal && compVal !== 0) {
                evolution_percent = ((currentVal - compVal) / compVal) * 100;
            }
        }
    }

    const duration = `${Date.now() - startTime}ms`;

    // 5. Format Response
    const result = formatResponse(currentData, evolution_percent, comparisonData);

    return {
        ...result,
        duration
    };
}
