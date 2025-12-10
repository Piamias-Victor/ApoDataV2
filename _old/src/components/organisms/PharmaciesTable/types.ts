// src/components/organisms/PharmaciesTable/types.ts

// ========== TYPES MÉTRIQUES PHARMACIE ==========
export interface PharmacyMetrics {
  readonly pharmacy_id: string;
  readonly pharmacy_name: string;

  // Rangs
  readonly rang_ventes_actuel: number;
  readonly rang_ventes_precedent: number | null;
  readonly gain_rang_ventes: number | null;

  // Achats
  readonly ca_achats: number;
  readonly ca_achats_comparison: number | null;
  readonly evol_achats_pct: number | null;
  readonly evol_relative_achats_pct: number | null;

  // Ventes
  readonly ca_ventes: number;
  readonly ca_ventes_comparison: number | null;
  readonly evol_ventes_pct: number | null;
  readonly evol_relative_ventes_pct: number | null;

  // Marge
  readonly pourcentage_marge: number;

  // Données complémentaires
  readonly quantite_vendue: number;
  readonly quantite_achetee: number;
  readonly valeur_stock_ht: number;
  readonly part_marche_pct: number;
}

// ========== TYPES TRI ==========
export type SortableColumn =
  | 'pharmacy_name'
  | 'rang_ventes_actuel'
  | 'gain_rang_ventes'
  | 'ca_achats'
  | 'ca_ventes'
  | 'evol_achats_pct'
  | 'evol_ventes_pct'
  | 'evol_relative_achats_pct'
  | 'evol_relative_ventes_pct'
  | 'pourcentage_marge'
  | 'quantite_vendue'
  | 'quantite_achetee';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  readonly column: SortableColumn;
  readonly direction: SortDirection;
}

// ========== TYPES PAGINATION ==========
export interface PaginationInfo {
  readonly totalItems: number;
  readonly totalPages: number;
  readonly currentPage: number;
  readonly startIndex: number;
  readonly endIndex: number;
}