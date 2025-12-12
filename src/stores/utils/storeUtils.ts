import { FilterState } from '@/types/filters';

/**
 * Helper to calculate the required number of filter operators based on active filters.
 * Returns the object to merge into state: { filterOperators: string[] }
 */
export const calculateFilterOperators = (state: FilterState, updatedFields: Partial<FilterState> = {}): { filterOperators: string[] } | null => {
    // Merge current state with updates to check 'next' state
    const nextState = { ...state, ...updatedFields };

    let filterCount = 0;

    // Count all active filters
    // Count active FILTER GROUPS (not individual items) to match LogicalOperatorFilterPanel logic
    if (nextState.pharmacies.length > 0) filterCount++;
    if (nextState.laboratories.length > 0) filterCount++;
    if (nextState.categories.length > 0) filterCount++;
    if (nextState.products.length > 0) filterCount++;
    if (nextState.settings.tvaRates.length > 0) filterCount++;
    if (nextState.settings.reimbursementStatus !== 'ALL') filterCount++;
    if (nextState.settings.isGeneric !== 'ALL') filterCount++;

    // Price Ranges (bundled as one group)
    let hasPriceRange = false;
    if (nextState.settings.purchasePriceNetRange &&
        (nextState.settings.purchasePriceNetRange.min !== 0 || nextState.settings.purchasePriceNetRange.max !== 100000)) hasPriceRange = true;
    else if (nextState.settings.purchasePriceGrossRange &&
        (nextState.settings.purchasePriceGrossRange.min !== 0 || nextState.settings.purchasePriceGrossRange.max !== 100000)) hasPriceRange = true;
    else if (nextState.settings.sellPriceRange &&
        (nextState.settings.sellPriceRange.min !== 0 || nextState.settings.sellPriceRange.max !== 100000)) hasPriceRange = true;
    else if (nextState.settings.discountRange &&
        (nextState.settings.discountRange.min !== 0 || nextState.settings.discountRange.max !== 100)) hasPriceRange = true;
    else if (nextState.settings.marginRange &&
        (nextState.settings.marginRange.min !== 0 || nextState.settings.marginRange.max !== 100)) hasPriceRange = true;

    if (hasPriceRange) filterCount++;

    const requiredOperators = Math.max(0, filterCount - 1);
    const currentOperators = nextState.filterOperators || [];

    if (currentOperators.length !== requiredOperators) {
        const newOperators = [...currentOperators];

        // Add missing operators (default to AND)
        while (newOperators.length < requiredOperators) {
            newOperators.push('AND');
        }

        // Remove extra operators
        if (newOperators.length > requiredOperators) {
            newOperators.splice(requiredOperators);
        }

        return { filterOperators: newOperators };
    }

    return null; // No change needed
};
