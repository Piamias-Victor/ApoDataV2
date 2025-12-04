// src/types/declaration-bri.ts

/**
 * Données agrégées par pharmacie pour la feuille "Total"
 */
export interface PharmacyTotal {
    readonly pharmacy_name: string;
    readonly id_nat: string;
    readonly total_quantity_sold: number;
}

/**
 * Données agrégées par produit pour la feuille "Produit"
 */
export interface ProductTotal {
    readonly code_ean: string;
    readonly product_name: string;
    readonly laboratory: string;
    readonly total_quantity_sold: number;
}

/**
 * Détails par produit et pharmacie pour les feuilles individuelles
 */
export interface ProductPharmacyDetail {
    readonly pharmacy_name: string;
    readonly id_nat: string;
    readonly quantity_sold: number;
}

/**
 * Structure complète des données d'export BRI
 */
export interface BriExportData {
    readonly pharmacyTotals: PharmacyTotal[];
    readonly productTotals: ProductTotal[];
    readonly productDetails: Map<string, ProductPharmacyDetail[]>; // Key = code_ean
}

/**
 * Paramètres de filtrage pour l'export BRI
 */
export interface BriExportFilters {
    readonly analysisDateRange: {
        readonly start: string;
        readonly end: string;
    };
    readonly comparisonDateRange?: {
        readonly start: string | null;
        readonly end: string | null;
    };
    readonly pharmacyIds?: string[];
    readonly productCodes?: string[]; // Optionnel - si absent ou vide, exporte tous les produits
    readonly laboratoryCodes?: string[];
    readonly categoryCodes?: string[];
}
