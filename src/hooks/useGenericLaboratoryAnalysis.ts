
import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/stores/useFilterStore';
import { GenericLaboratoryRow } from '@/types/kpi';

export const useGenericLaboratoryAnalysis = () => {
    // 1. Get filters from store
    const {
        dateRange,
        // comparisonDateRange, // Unused
        products,
        laboratories,
        categories,
        pharmacies,
        groups,

        // Exclusions
        excludedProducts,
        excludedLaboratories,
        excludedCategories,
        excludedPharmacies,

        // Filter Operators (Root)
        filterOperators,

        // Settings
        settings
    } = useFilterStore();

    // Map properties
    // Note: products etc are already IDs/Codes usually
    const pharmacyIds = pharmacies ? pharmacies.map(p => p.id) : [];

    // Extract settings
    const {
        reimbursementStatus,
        isGeneric,
        tvaRates
    } = settings;

    // 2. Prepare Request Body
    const groupNames = groups.map(g => g.name);
    const safeCategories = categories.map(c => ({ code: c.id, type: c.type || 'unknown' }));
    const safeExcludedCategories = excludedCategories.map(c => ({ code: c.id, type: c.type || 'unknown' })); // Corrected: excludedCategories is same type as categories in store usually

    const requestBody = {
        dateRange,
        productCodes: products,
        laboratories,
        categories: safeCategories,
        pharmacyIds, // Pass all selected pharmacies? Usually analysis is on 1 main pharmacy or all? 
        // Standard is: if >0, filter by them. If 0, global (but dependent on context).
        // Generic Analysis is likely for "My Pharmacy" vs "Group".
        // If multiple pharmacies selected, "My Pharmacy" = Aggregation of them.
        groups: groupNames,

        excludedProductCodes: excludedProducts,
        excludedLaboratories,
        excludedCategories: safeExcludedCategories,
        excludedPharmacyIds: excludedPharmacies.map(p => p.id),

        filterOperators,
        reimbursementStatus,
        isGeneric,
        tvaRates
    };

    return useQuery({
        queryKey: ['generic-laboratory-analysis', requestBody],
        queryFn: async () => {
            const response = await fetch('/api/generic/laboratories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) throw new Error('Network response was not ok');
            return response.json() as Promise<GenericLaboratoryRow[]>;
        },
        enabled: true
    });
};
