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
    groups?: string[]; // Generic groups (bcb_generic_group)
}

export interface GenericLaboratoryRow extends LaboratoryAnalysisRow {
    product_count: number;
    product_count_evolution: number;
}

export interface AchatsKpiResponse {
    montant_ht: number;
    montant_ttc: number;
    quantite_achetee: number;
    quantite_achetee_evolution?: number;
    evolution_percent?: number | undefined;
}

export interface VentesKpiResponse {
    montant_ht: number;
    montant_ttc: number;
    quantite_vendue: number;
    quantite_vendue_evolution?: number;
    evolution_percent?: number | undefined;
    duration?: string;
}

export interface MargeKpiResponse {
    montant_marge: number;
    marge_percent: number;
    marge_percent_evolution?: number;
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

    // Price Info (NEW)
    prix_brut: number;
    discount_pct: number;

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

// --- Stock Dashboard Specifics ---

export interface StockReceptionKpiResponse {
    qte_commandee: number;
    qte_receptionnee: number;
    taux_reception: number;
    evolution_percent?: number;

    montant_commande_ht: number;
    montant_receptionne_ht: number;
    montant_evolution_percent?: number;
}

export interface StockCurrentKpiResponse {
    stock_qte: number;
    stock_value_ht: number;
    nb_references: number;
    evolution_percent?: number; // Value evolution
}

export interface StockInventoryKpiResponse {
    days_of_stock: number;
    avg_stock_value_12m: number;
    evolution_percent?: number;
}

export interface StockDiscrepancyKpiResponse {
    nb_references_with_discrepancy: number; // Products with qte_r < qte
    percent_references_with_discrepancy: number;
    discrepancy_product_codes: { code: string; label: string }[]; // For Ctrl+click action
}
