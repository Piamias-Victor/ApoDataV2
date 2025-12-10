// src/components/organisms/CompetitiveTable/types.ts
export interface CompetitiveMetrics {
  readonly product_name: string;
  readonly code_ean: string;
  readonly prix_vente_min_global: number;
  readonly prix_vente_max_global: number;
  readonly prix_vente_moyen_global: number;
  readonly nb_pharmacies_vendant: number;
  readonly prix_vente_moyen_selection: number;
  readonly prix_achat_moyen_ht: number;
  readonly quantite_vendue_selection: number;
  readonly taux_marge_moyen_selection: number;
  readonly ecart_prix_vs_marche_pct: number;
}

export type CompetitiveSortableColumn = 
  | 'product_name'
  | 'code_ean' 
  | 'prix_vente_min_global'
  | 'prix_vente_max_global'
  | 'prix_vente_moyen_global'
  | 'prix_vente_moyen_selection'
  | 'prix_achat_moyen_ht'
  | 'taux_marge_moyen_selection'
  | 'ecart_prix_vs_marche_pct';

export type SortDirection = 'asc' | 'desc' | null;

export interface CompetitiveSortConfig {
  readonly column: CompetitiveSortableColumn | null;
  readonly direction: SortDirection;
}

export interface CompetitiveColumnConfig {
  readonly key: CompetitiveSortableColumn;
  readonly label: string;
  readonly visible: boolean;
  readonly sortable: boolean;
  readonly format?: 'currency' | 'number' | 'percentage' | 'text';
  readonly align?: 'left' | 'center' | 'right';
}

export interface CompetitivePaginationInfo {
  readonly totalItems: number;
  readonly totalPages: number;
  readonly currentPage: number;
  readonly startIndex: number;
  readonly endIndex: number;
}