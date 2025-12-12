// src/types/kpi.ts
export interface AchatsKpiRequest {
    dateRange: {
        start: string;
        end: string;
    };
    comparisonDateRange?: {
        start: string;
        end: string;
    };
    productCodes?: string[];
    laboratories?: string[]; // Names of laboratories (bcb_lab)
    categories?: { code: string; type: string }[]; // Typed categories
    pharmacyIds?: string[];
    filterOperators?: ('AND' | 'OR')[];
    // New Filters
    tvaRates?: number[];
    reimbursementStatus?: 'ALL' | 'REIMBURSED' | 'NOT_REIMBURSED';
    isGeneric?: 'ALL' | 'PRINCEPS_GENERIC' | 'GENERIC' | 'PRINCEPS';
    purchasePriceNetRange?: { min: number; max: number };
    purchasePriceGrossRange?: { min: number; max: number };
    sellPriceRange?: { min: number; max: number };
    discountRange?: { min: number; max: number };
    marginRange?: { min: number; max: number };
}

export interface AchatsKpiResponse {
    montant_ht: number;
    quantite_achetee: number;
    evolution_percent?: number | undefined;
}
