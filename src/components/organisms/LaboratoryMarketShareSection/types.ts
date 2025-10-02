// src/components/organisms/LaboratoryMarketShareSection/types.ts
export interface LaboratoryMarketShareData {
  readonly laboratory_name: string;
  readonly product_count: number;
  readonly ca_selection: number;
  readonly marge_selection: number;
  readonly part_marche_ca_pct: number;
  readonly part_marche_marge_pct: number;
}

export type LaboratorySortableColumn = 
  | 'laboratory_name'
  | 'product_count'
  | 'ca_selection'
  | 'marge_selection'
  | 'part_marche_ca_pct'
  | 'part_marche_marge_pct';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  readonly column: LaboratorySortableColumn | null;
  readonly direction: SortDirection;
}