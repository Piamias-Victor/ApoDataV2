import { useMemo } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';
import { AchatsKpiRequest } from '@/types/kpi';

/**
 * Hook centralisant la création de l'objet de requête KPI
 * à partir du store de filtres.
 * Garantit que tous les KPIs utilisent exactement les mêmes paramètres.
 */
export const useKpiRequest = (): AchatsKpiRequest => {
    const store = useFilterStore();

    return useMemo(() => ({
        dateRange: {
            start: store.dateRange.start || '',
            end: store.dateRange.end || ''
        },
        comparisonDateRange: {
            start: store.comparisonDateRange.start || '',
            end: store.comparisonDateRange.end || ''
        },
        productCodes: store.products.map(p => p.code),
        laboratories: store.laboratories.map(l => l.name),
        categories: store.categories.map(c => ({ code: c.name, type: c.type })),
        pharmacyIds: store.pharmacies.map(p => p.id),

        excludedPharmacyIds: store.excludedPharmacies.map(p => p.id),
        excludedLaboratories: store.excludedLaboratories.map(l => l.name),
        excludedCategories: store.excludedCategories.map(c => ({ code: c.name, type: c.type })),
        excludedProductCodes: store.excludedProducts.map(p => p.code),

        filterOperators: store.filterOperators,
        reimbursementStatus: store.settings.reimbursementStatus,
        isGeneric: store.settings.isGeneric,
        tvaRates: store.settings.tvaRates,
        groups: store.groups.map(g => g.name),


        // Potential future extensions:
        // customFilter: store.customFilter...
    }), [
        store.dateRange,
        store.comparisonDateRange.start, // Added dependency
        store.comparisonDateRange.end,   // Added dependency
        store.products,
        store.laboratories,
        store.categories,
        store.pharmacies,
        store.excludedPharmacies,
        store.excludedLaboratories,
        store.excludedCategories,
        store.excludedProducts,
        store.filterOperators,
        store.filterOperators,
        store.settings,
        store.groups
    ]);
};
