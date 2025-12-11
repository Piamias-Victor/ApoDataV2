// src/services/FilterResolutionService.ts
import { FilterState } from '@/types/filters';

/**
 * Service PUR (Pure function) qui retourne les codes produits manuellement sélectionnés.
 * 
 * Note: Laboratories, categories, groups, TVA, and reimbursement are now ATTRIBUTE filters
 * that are resolved server-side. This service only handles manual product selections.
 */
export const resolveProductCodes = (state: FilterState): string[] => {
    // Only return manually selected product codes
    // Laboratories, categories, and other filters are resolved server-side
    const manualCodes = new Set(state.products.map(p => p.code));

    // Apply exclusions
    state.excludedProductCodes.forEach(code => manualCodes.delete(code));

    return Array.from(manualCodes);
};
