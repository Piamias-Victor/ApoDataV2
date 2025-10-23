// src/types/laboratory.ts
export interface LaboratoryMarketShare {
  readonly laboratory_name: string;
  readonly product_count: number;
  
  // ACHATS
  readonly quantity_bought: number;
  readonly ca_achats: number;
  readonly part_marche_achats_pct: number;
  
  // MARGE
  readonly margin_rate_percent: number;
  
  // VENTES
  readonly quantity_sold: number;
  readonly ca_selection: number;
  readonly part_marche_ca_pct: number;
  
  // Anciens champs (compatibilité)
  readonly marge_selection: number;
  readonly ca_total_group: number;
  readonly marge_total_group: number;
  readonly part_marche_marge_pct: number;
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

export type GenericLaboratorySortableColumn = 
  | 'laboratory_name'
  | 'product_count'
  | 'quantity_bought'
  | 'ca_achats'
  | 'part_marche_achats_pct'
  | 'margin_rate_percent'
  | 'quantity_sold'
  | 'ca_selection'
  | 'part_marche_ca_pct';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  column: LaboratorySortableColumn | null;
  direction: SortDirection;
}

export interface GenericSortConfig {
  column: GenericLaboratorySortableColumn | null;
  direction: SortDirection;
}