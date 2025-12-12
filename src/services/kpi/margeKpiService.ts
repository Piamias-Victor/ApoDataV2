import { AchatsKpiRequest, MargeKpiResponse } from '@/types/kpi';
import { fetchMargeData } from '@/repositories/kpi/margeRepository';
import { queryCache, withCache } from '@/lib/cache/queryCache';

export async function getMargeKpi(request: AchatsKpiRequest): Promise<MargeKpiResponse> {
    const startTime = Date.now();
    console.log('📊 [Service] Getting Marge KPI');

    const currentCacheKey = queryCache.generateKey('marge', {
        dateRange: request.dateRange,
        productCodes: request.productCodes,
        laboratories: request.laboratories,
        categories: request.categories,
        pharmacyIds: request.pharmacyIds,
        filterOperators: request.filterOperators,
        tvaRates: request.tvaRates,
        reimbursementStatus: request.reimbursementStatus,
        isGeneric: request.isGeneric,
        purchasePriceNetRange: request.purchasePriceNetRange,
        purchasePriceGrossRange: request.purchasePriceGrossRange,
        sellPriceRange: request.sellPriceRange,
        discountRange: request.discountRange,
        marginRange: request.marginRange
    });

    // Fetch current period data with cache
    const currentData = await withCache(currentCacheKey, () => fetchMargeData(request));

    let evolution_percent: number | undefined;

    if (request.comparisonDateRange) {
        console.log('📊 [Service] Calculating evolution for Marge');

        const comparisonCacheKey = queryCache.generateKey('marge', {
            dateRange: request.comparisonDateRange,
            productCodes: request.productCodes,
            laboratories: request.laboratories,
            categories: request.categories,
            pharmacyIds: request.pharmacyIds,
            filterOperators: request.filterOperators,
            tvaRates: request.tvaRates,
            reimbursementStatus: request.reimbursementStatus,
            isGeneric: request.isGeneric,
            purchasePriceNetRange: request.purchasePriceNetRange,
            purchasePriceGrossRange: request.purchasePriceGrossRange,
            sellPriceRange: request.sellPriceRange,
            discountRange: request.discountRange,
            marginRange: request.marginRange
        });

        const comparisonData = await withCache(comparisonCacheKey, () =>
            fetchMargeData({
                ...request,
                dateRange: request.comparisonDateRange!
            })
        );

        if (comparisonData.montant_marge > 0) {
            evolution_percent = ((currentData.montant_marge - comparisonData.montant_marge) / comparisonData.montant_marge) * 100;

            console.log('📊 [Service] Marge Evolution calculated:', {
                current: currentData.montant_marge,
                comparison: comparisonData.montant_marge,
                evolution: evolution_percent
            });
        }
    }

    // Calculate Margin Percentage
    const marge_percent = currentData.montant_ht > 0
        ? (currentData.montant_marge / currentData.montant_ht) * 100
        : 0;

    const duration = Date.now() - startTime;

    return {
        montant_marge: currentData.montant_marge,
        marge_percent: marge_percent,
        evolution_percent,
        duration: `${duration}ms`
    };
}
