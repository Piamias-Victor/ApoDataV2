// src/types/comparison.ts

/**
 * Types stricts pour interface comparaisons ApoData Genesis
 * Contraintes métier : comparaison 2-3 éléments identiques pour analyse CA/marge
 */

export type ComparisonType = 'products' | 'laboratories' | 'categories';

/**
 * Élément sélectionnable pour comparaison
 * Métadonnées spécialisées selon le type pharmaceutique
 */
export interface ComparisonElement {
  readonly id: string;
  readonly name: string;
  readonly type: 'product' | 'laboratory' | 'category';
  readonly metadata: {
    readonly code_ean?: string;
    readonly laboratory_name?: string;  
    readonly category_type?: 'universe' | 'category';
    readonly product_codes: string[];
    readonly brand_lab?: string | null;
    readonly universe?: string | null;
  };
}

/**
 * État global store comparaisons
 */
export interface ComparisonState {
  readonly comparisonType: ComparisonType | null;
  readonly elementA: ComparisonElement | null;
  readonly elementB: ComparisonElement | null;
  readonly elementC: ComparisonElement | null;
  readonly isModalOpen: boolean;
  readonly modalTarget: 'A' | 'B' | 'C' | null;
}

/**
 * Actions store comparaisons
 */
export interface ComparisonActions {
  readonly setComparisonType: (type: ComparisonType | null) => void;
  readonly setElementA: (element: ComparisonElement | null) => void;
  readonly setElementB: (element: ComparisonElement | null) => void;
  readonly setElementC: (element: ComparisonElement | null) => void;
  readonly swapElements: () => void;
  readonly clearAll: () => void;
  readonly clearElement: (position: 'A' | 'B' | 'C') => void;
  readonly openModal: (target: 'A' | 'B' | 'C') => void;
  readonly closeModal: () => void;
  readonly canCompare: () => boolean;
  readonly getComparisonUrl: () => string | null;
}

/**
 * Données API produits (basé sur ProductResult existant)
 */
export interface ProductSearchResult {
  readonly name: string;
  readonly code_13_ref: string;
  readonly brand_lab: string | null;
  readonly universe: string | null;
}

/**
 * Données API laboratoires (basé sur LaboratoryResult existant)
 */
export interface LaboratorySearchResult {
  readonly laboratory_name: string;
  readonly product_count: number;
  readonly product_codes: string[];
  readonly matching_products?: Array<{
    readonly name: string;
    readonly code_13_ref: string;
  }>;
}

/**
 * Données API catégories (basé sur CategoryResult existant)
 */
export interface CategorySearchResult {
  readonly category_name: string;
  readonly category_type: 'universe' | 'category';
  readonly product_count: number;
  readonly product_codes: string[];
  readonly matching_products?: Array<{
    readonly name: string;
    readonly code_13_ref: string;
  }>;
}

/**
 * Réponses API de recherche
 */
export interface ProductSearchResponse {
  readonly products: ProductSearchResult[];
  readonly count: number;
  readonly queryTime: number;
}

export interface LaboratorySearchResponse {
  readonly laboratories: LaboratorySearchResult[];
  readonly count: number;
  readonly queryTime: number;
  readonly mode: 'laboratory' | 'product';
}

export interface CategorySearchResponse {
  readonly categories: CategorySearchResult[];
  readonly count: number;
  readonly queryTime: number;
  readonly mode: 'category' | 'product';
}

/**
 * État de recherche pour modal
 */
export interface SearchState<T = ComparisonElement> {
  readonly query: string;
  readonly results: T[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly hasSearched: boolean;
}