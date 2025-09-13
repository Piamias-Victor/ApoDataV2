// src/components/organisms/PharmaciesTable/types.ts
export interface PharmacyMetrics {
  readonly pharmacy_id: string;
  readonly pharmacy_name: string;
  readonly ca_ttc: number;
  readonly montant_marge: number;
  readonly pourcentage_marge: number;
  readonly valeur_stock_ht: number;
  readonly quantite_vendue: number;
  readonly montant_achat_total: number;
  readonly part_marche_pct: number;
  readonly evolution_ca_pct?: number;
  readonly evolution_relative_pct?: number; // AJOUT: calculé côté API
}

export type SortableColumn = 
  | 'pharmacy_name'
  | 'ca_ttc'
  | 'quantite_vendue'
  | 'valeur_stock_ht'
  | 'montant_marge'
  | 'pourcentage_marge'
  | 'part_marche_pct'
  | 'evolution_ca_pct'
  | 'evolution_relative_pct'; // AJOUT

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  readonly column: SortableColumn | null;
  readonly direction: SortDirection;
}

export interface PaginationInfo {
  readonly totalItems: number;
  readonly totalPages: number;
  readonly currentPage: number;
  readonly startIndex: number;
  readonly endIndex: number;
}