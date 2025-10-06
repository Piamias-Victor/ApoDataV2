// src/types/laboratory.ts
export interface LaboratoryMarketShare {
  readonly laboratory_name: string;
  readonly ca_selection: number;
  readonly ca_total_group: number;
  readonly part_marche_ca_pct: number;
  readonly marge_selection: number;
  readonly marge_total_group: number;
  readonly part_marche_marge_pct: number;
  readonly product_count: number;
  readonly quantity_sold: number;
  readonly margin_rate_percent: number;
  readonly is_referent: boolean;
}

export type LaboratorySortableColumn = 
  | 'laboratory_name'
  | 'product_count'
  | 'ca_selection'
  | 'marge_selection'
  | 'part_marche_ca_pct'
  | 'part_marche_marge_pct'
  | 'quantity_sold'
  | 'margin_rate_percent';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  column: LaboratorySortableColumn | null;
  direction: SortDirection;
}