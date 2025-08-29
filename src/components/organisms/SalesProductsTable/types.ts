// src/components/organisms/SalesProductsTable/types.ts

/**
 * Types pour SalesProductsTable - Tableau ventes détaillé par produit
 */

export interface SalesProductMetrics {
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
}

export interface SalesProductsResponse {
  readonly products: SalesProductMetrics[];
  readonly totalQuantiteVendue: number;
  readonly totalMargeSelection: number;
  readonly count: number;
  readonly queryTime: number;
  readonly cached: boolean;
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
export interface SalesProductsTableProps {
  readonly dateRange: { start: string; end: string };
  readonly comparisonDateRange?: { start: string | null; end: string | null } | undefined;
  readonly filters?: {
    products?: string[];
    laboratories?: string[];
    categories?: string[];
    pharmacies?: string[];
  };
  readonly onRefresh?: () => void;
  readonly className?: string;
}

// Types pour évolution temporelle (graphique détail)
export interface SalesEvolutionEntry {
  readonly periode: string;
  readonly quantite_vendue: number;
  readonly prix_vente_moyen: number;
  readonly prix_achat_moyen: number;
  readonly taux_marge_moyen: number;
  readonly montant_ventes: number;
}

export interface SalesEvolutionData {
  readonly evolution: SalesEvolutionEntry[];
  readonly productName: string;
  readonly queryTime: number;
  readonly cached: boolean;
}