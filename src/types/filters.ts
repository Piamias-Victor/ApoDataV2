// src/types/filters.ts

export interface SelectedLaboratory {
    id: string; // group_id ou lab_id
    name: string;
}

export interface SelectedCategory {
    id: string;
    name: string;
    type: 'bcb_segment_l0' | 'bcb_segment_l1' | 'bcb_segment_l2' | 'bcb_segment_l3' | 'bcb_segment_l4' | 'bcb_segment_l5' | 'bcb_family';
}

export interface SelectedPharmacy {
    id: string;
    name: string;
    address?: string;
    ca?: number; // Chiffre d'affaires
    id_nat?: string;
    region?: string;
}

export interface SelectedGroup { // Clusters
    id: string;
    name: string;
}

export interface SelectedProduct {
    code: string; // CIP13 ou EAN
    name: string;
    bcb_product_id?: number; // For grouping
}

export interface DateRange {
    start: string | null; // Format ISO YYYY-MM-DD
    end: string | null;
}

export interface FilterSettings {
    productType: 'ALL' | 'MEDICAMENT' | 'PARAPHARMACIE';
    tvaRates: number[]; // ex: [2.1, 5.5, 20]
    priceRange: { min: number; max: number } | null;
    isGeneric: 'ALL' | 'PRINCEPS_GENERIC' | 'GENERIC' | 'PRINCEPS'; // Updated options
    lppCodes: string[];
    refundCodes: string[];
    reimbursementStatus: 'ALL' | 'REIMBURSED' | 'NOT_REIMBURSED';
    marketType: 'ALL' | 'HOSPITAL' | 'OFFICINE';
    // Product Price Filters
    purchasePriceNetRange: { min: number; max: number } | null;
    purchasePriceGrossRange: { min: number; max: number } | null;
    sellPriceRange: { min: number; max: number } | null;
    discountRange: { min: number; max: number } | null;
    marginRange: { min: number; max: number } | null;
}

// Individual filter item for operator configuration
export interface FilterItem {
    type: 'pharmacy' | 'laboratory' | 'category' | 'product' | 'tva' | 'reimbursement' | 'generic' | 'priceRange';
    id: string; // Unique identifier
    name: string; // Display name
    value: any; // The actual filter value
}

// Operators between filters (array of operators, one less than number of filters)
export type FilterOperators = ('AND' | 'OR')[];

export interface FilterState {
    // 1. Target
    pharmacies: SelectedPharmacy[];
    dateRange: DateRange;
    comparisonDateRange: DateRange;
    useNMinus1: boolean;

    // 2. Scope
    products: SelectedProduct[];
    laboratories: SelectedLaboratory[];
    categories: SelectedCategory[];
    groups: SelectedGroup[];

    // 3. Attributes
    settings: FilterSettings;

    // 4. Logical Operators
    filterOperators: FilterOperators; // Operators between each filter

    // 5. Exclusions
    excludedProducts: SelectedProduct[];
    excludedLaboratories: SelectedLaboratory[];
    excludedCategories: SelectedCategory[];
    excludedPharmacies: SelectedPharmacy[]; // Added excludedPharmacies

    // 6. View State
    isFilterOpen: boolean;
    activeDrawer: string | null;
}
