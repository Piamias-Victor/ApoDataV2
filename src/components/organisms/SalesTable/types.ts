// src/components/organisms/SalesTable/types.ts

/**
 * Types pour SalesTable - Tableau ventes avec expansion détails
 * Basé sur ProductsMonthlyTable mais adapté aux données ventes
 */

export interface SalesProductRow {
  readonly nom: string;
  readonly code_ean: string;
  readonly periode: string;
  readonly periode_libelle: string;
  readonly type_ligne: 'DETAIL' | 'SYNTHESE';
  readonly quantite_vendue: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
  readonly part_marche_quantite_pct: number;
  readonly part_marche_marge_pct: number;
  readonly montant_ventes_ttc: number;
  readonly montant_marge_total: number;
  readonly quantite_vendue_comparison: number | null; // AJOUT pour comparaison
}

export interface ProductSalesSummary {
  readonly nom: string;
  readonly code_ean: string;
  readonly quantite_vendue: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
  readonly part_marche_quantite_pct: number;
  readonly part_marche_marge_pct: number;
  readonly montant_ventes_ttc: number;
  readonly montant_marge_total: number;
  readonly quantite_vendue_comparison: number | null; // AJOUT pour comparaison
}

// Types pour tri des colonnes
export type SalesSortableColumn = 
  | 'nom' 
  | 'code_ean'
  | 'quantite_vendue'
  | 'prix_achat_moyen'
  | 'prix_vente_moyen'
  | 'taux_marge_moyen'
  | 'part_marche_quantite_pct'
  | 'part_marche_marge_pct'
  | 'montant_ventes_ttc'
  | 'montant_marge_total';

export type SortDirection = 'asc' | 'desc' | null;

export interface SalesSortConfig {
  column: SalesSortableColumn | null;
  direction: SortDirection;
}

// Types pour pagination
export interface SalesPaginationInfo {
  readonly totalItems: number;
  readonly totalPages: number;
  readonly currentPage: number;
  readonly startIndex: number;
  readonly endIndex: number;
}

// Props du composant principal
export interface SalesTableProps {
  readonly className?: string;
  readonly onRefresh?: () => void;
}

// Types pour le traitement des données
export interface ProcessedSalesData {
  readonly products: ProductSalesSummary[];
  readonly pagination: SalesPaginationInfo;
}