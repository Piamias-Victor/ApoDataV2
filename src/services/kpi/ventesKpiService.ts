import { AchatsKpiRequest, VentesKpiResponse } from '@/types/kpi';
import { fetchVentesData } from '@/repositories/kpi/ventesRepository';
import { queryCache, withCache } from '@/lib/cache/queryCache';

export async function getVentesKpi(request: AchatsKpiRequest): Promise<VentesKpiResponse> {
    const startTime = Date.now();
    console.log('📊 [Service] Getting Ventes KPI');

    const currentCacheKey = queryCache.generateKey('ventes', {
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
    const currentData = await withCache(currentCacheKey, () => fetchVentesData(request));

    let evolution_percent: number | undefined;

    if (request.comparisonDateRange) {
        console.log('📊 [Service] Calculating evolution for Ventes');

        const comparisonCacheKey = queryCache.generateKey('ventes', {
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
            fetchVentesData({
                ...request,
                dateRange: request.comparisonDateRange!
            })
        );

        if (comparisonData.montant_ht > 0) {
            evolution_percent = ((currentData.montant_ht - comparisonData.montant_ht) / comparisonData.montant_ht) * 100;

            console.log('📊 [Service] Ventes Evolution calculated:', {
                current: currentData.montant_ht,
                comparison: comparisonData.montant_ht,
                evolution: evolution_percent
            });
        }
    }

    const duration = Date.now() - startTime;

    return {
        montant_ht: currentData.montant_ht,
        quantite_vendue: currentData.quantite_vendue,
        evolution_percent,
        duration: `${duration}ms`
    };
}
