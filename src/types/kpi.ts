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

export interface LaboratoryAnalysisRow {
    laboratory_name: string;

    // My Pharmacy Metrics
    my_rank: number;
    my_sales_ttc: number;
    my_sales_qty: number;
    my_purchases_ht: number;
    my_purchases_qty: number;

    my_margin_ht: number; // Added
    my_margin_rate: number;
    my_pdm_pct: number;
    my_pdm_purchases_pct: number; // Added

    my_stock_qty: number; // Added
    my_stock_value_ht: number; // Added
    my_days_of_stock: number; // Added

    // Group Metrics
    group_rank: number;
    group_avg_sales_ttc: number;
    group_avg_sales_qty: number;
    group_avg_purchases_ht: number;
    group_avg_purchases_qty: number;
    group_avg_margin_rate: number;
    group_pdm_pct: number; // Avg PDM in group

    // Evolutions
    my_sales_evolution: number;
    group_sales_evolution: number;
    my_purchases_evolution: number;
    group_purchases_evolution: number;

    // Detailed Evolutions
    my_sales_qty_evolution: number;
    group_sales_qty_evolution: number;
    my_purchases_qty_evolution: number;
    group_purchases_qty_evolution: number;
    my_margin_rate_evolution: number;
    group_margin_rate_evolution: number;
    my_pdm_evolution: number;
    group_pdm_evolution: number;
    my_pdm_purchases_evolution: number; // Added

    my_stock_qty_evolution: number; // Added
    my_stock_value_ht_evolution: number; // Added
    my_margin_ht_evolution: number; // Added
}

export interface ProductAnalysisRow {
    product_name: string;
    ean13: string;
    laboratory_name: string;

    // My Pharmacy Metrics
    my_rank: number;
    my_sales_ttc: number;
    my_sales_qty: number;
    my_purchases_ht: number;
    my_purchases_qty: number;
    my_margin_rate: number;
    my_margin_ht: number; // Added
    my_pdm_pct: number;
    my_pdm_purchases_pct: number; // Added

    my_stock_qty: number; // Added
    my_stock_value_ht: number; // Added
    my_days_of_stock: number; // Added

    // Group Metrics
    group_rank: number;
    group_avg_sales_ttc: number;
    group_avg_sales_qty: number;
    group_avg_purchases_ht: number;
    group_avg_purchases_qty: number;
    group_avg_margin_rate: number;
    group_pdm_pct: number;

    // Evolutions
    my_sales_evolution: number;
    group_sales_evolution: number;
    my_purchases_evolution: number;
    group_purchases_evolution: number;

    // Detailed Evolutions
    my_sales_qty_evolution: number;
    group_sales_qty_evolution: number;
    my_purchases_qty_evolution: number;
    group_purchases_qty_evolution: number;
    my_margin_rate_evolution: number;
    group_margin_rate_evolution: number;
    my_pdm_evolution: number;
    group_pdm_evolution: number;

    my_pdm_purchases_evolution: number; // Added
    my_margin_ht_evolution: number; // Added
    my_stock_qty_evolution: number; // Added
    my_stock_value_ht_evolution: number; // Added

    avg_purchase_price: number; // Added
    avg_sell_price: number; // Added
}
