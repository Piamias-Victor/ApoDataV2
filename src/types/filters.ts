// src/types/filters.ts

export interface SelectedLaboratory {
    id: string; // group_id ou lab_id
    name: string;
    productCodes: string[];
}

export interface SelectedCategory {
    id: string;
    name: string;
    type: 'universe' | 'category' | 'subcategory';
    productCodes: string[];
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
    productCodes: string[];
}

export interface SelectedProduct {
    code: string; // CIP13 ou EAN
    name: string;
}

export interface DateRange {
    start: string | null; // Format ISO YYYY-MM-DD
    end: string | null;
}

export interface FilterSettings {
    productType: 'ALL' | 'MEDICAMENT' | 'PARAPHARMACIE';
    tvaRates: number[]; // ex: [2.1, 5.5, 20]
    priceRange: { min: number; max: number } | null;
    isGeneric?: boolean | undefined; // true = Generic only, false = Brand only, undefined = All
    lppCodes: string[];
    refundCodes: string[];
    marketType: 'ALL' | 'HOSPITAL' | 'OFFICINE';
}

export interface FilterState {
    // 1. Target
    pharmacies: SelectedPharmacy[];
    dateRange: DateRange;
    comparisonDateRange: DateRange;

    // 2. Scope
    products: SelectedProduct[];
    laboratories: SelectedLaboratory[];
    categories: SelectedCategory[];
    groups: SelectedGroup[];

    // 3. Attributes
    settings: FilterSettings;

    // 4. Global
    excludedProductCodes: string[]; // Blacklist
    logicOperator: 'AND' | 'OR';
}
