// src/types/priceIncrease.ts

/**
 * Produit dans un catalogue CSV
 */
export interface CatalogProduct {
    readonly code_ean: string;
    readonly prix_ht: number;
}

/**
 * Comparaison de prix entre 2025 et 2026
 */
export interface PriceComparison {
    readonly code_ean: string;
    readonly nom_produit: string;
    readonly laboratoire: string;
    readonly prix_2025: number;
    readonly prix_2026: number;
    readonly hausse_pourcent: number;
    readonly hausse_euros: number;
    // Données ventes (période du store)
    readonly quantite_vendue: number;
    readonly ca_ttc: number;
    readonly prix_vente_moyen_ttc: number;
    readonly marge_actuelle_euros: number;
    readonly marge_actuelle_pourcent: number;
    // Simulation avec nouveau prix
    readonly nouvelle_marge_euros: number;
    readonly nouvelle_marge_pourcent: number;
    readonly perte_gain_marge_euros: number;
    readonly perte_gain_marge_pourcent: number;
}

/**
 * Résultats de l'analyse de hausse tarifaire
 */
export interface PriceIncreaseAnalysis {
    readonly hmp_globale: number; // Hausse Moyenne Prix en %
    readonly nb_produits: number;
    readonly impact_marge_total_euros: number; // Gain/Perte total en €
    readonly top10_hausses_pourcent: PriceComparison[];
    readonly top10_hausses_euros: PriceComparison[];
    readonly all_comparisons: PriceComparison[];
}

/**
 * État de l'import CSV
 */
export interface CsvImportState {
    readonly catalog2025: CatalogProduct[] | null;
    readonly catalog2026: CatalogProduct[] | null;
    readonly isLoading: boolean;
    readonly error: string | null;
}
