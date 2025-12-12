// src/types/kpi.ts
export type Grain = 'day' | 'week' | 'month';

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
    // Exclusions
    excludedProductCodes?: string[];
    excludedLaboratories?: string[];
    excludedCategories?: { code: string; type: string }[];
    excludedPharmacyIds?: string[];
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

export interface VentesKpiResponse {
    montant_ht: number;
    quantite_vendue: number;
    evolution_percent?: number | undefined;
    duration?: string;
}

export interface MargeKpiResponse {
    montant_marge: number;
    marge_percent: number;
    evolution_percent?: number | undefined;
    duration?: string;
}

export interface InventoryDaysResponse {
    days: number;
    evolution_percent?: number | undefined;
    duration?: string;
}

export interface ReceptionRateResponse {
    rate: number;
    evolution_percent?: number | undefined;
    duration?: string;
}
export interface PriceEvolutionResponse {
    purchase_price: number;
    purchase_evolution_percent?: number | undefined;
    sell_price: number;
    sell_evolution_percent?: number | undefined;
    duration?: string;
}

export interface StockKpiResponse {
    stock_value_ht: number;
    stock_quantity: number;
    evolution_percent?: number | undefined;
    duration?: string;
}
