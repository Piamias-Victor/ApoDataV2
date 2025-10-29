// src/components/organisms/SalesTable/types.ts

/**
 * Types pour SalesTable - Tableau ventes avec expansion détails
 * Basé sur ProductsMonthlyTable mais adapté aux données ventes
 */

export interface SalesProductRow {
  readonly nom: string;
  readonly code_ean: string;
  readonly bcb_lab: string | null;
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
  readonly quantite_vendue_comparison: number | null;
}

export interface ProductSalesSummary {
  readonly nom: string;
  readonly code_ean: string;
  readonly bcb_lab: string | null;
  readonly quantite_vendue: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
  readonly part_marche_quantite_pct: number;
  readonly part_marche_marge_pct: number;
  readonly montant_ventes_ttc: number;
  readonly montant_marge_total: number;
  readonly quantite_vendue_comparison: number | null;
}

export type SalesSortableColumn = 
  | 'nom' 
  | 'code_ean'
  | 'bcb_lab'
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

export interface SalesPaginationInfo {
  readonly totalItems: number;
  readonly totalPages: number;
  readonly currentPage: number;
  readonly startIndex: number;
  readonly endIndex: number;
}

export interface SalesTableProps {
  readonly className?: string;
  readonly onRefresh?: () => void;
}

export interface ProcessedSalesData {
  readonly products: ProductSalesSummary[];
  readonly pagination: SalesPaginationInfo;
}