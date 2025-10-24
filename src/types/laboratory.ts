// src/types/laboratory.ts
export interface LaboratoryMarketShare {
  readonly laboratory_name: string;
  readonly product_count: number;
  
  // RANKING (calculé backend)
  readonly rang_actuel: number;
  readonly rang_precedent: number | null;
  readonly gain_rang: number | null;
  
  // PÉRIODE ACTUELLE - ACHATS
  readonly quantity_bought: number;
  readonly ca_achats: number;
  
  // PÉRIODE ACTUELLE - VENTES
  readonly quantity_sold: number;
  readonly ca_selection: number;
  readonly part_marche_ca_pct: number;
  
  // PÉRIODE ACTUELLE - MARGE
  readonly marge_selection: number;
  readonly margin_rate_percent: number;
  
  // PÉRIODE COMPARAISON - ACHATS (si disponible)
  readonly ca_achats_comparison: number | null;
  
  // PÉRIODE COMPARAISON - VENTES (si disponible)
  readonly ca_selection_comparison: number | null;
  readonly part_marche_ca_pct_comparison: number | null;
  
  // ÉVOLUTIONS CALCULÉES (backend)
  readonly evol_achats_pct: number | null;
  readonly evol_ventes_pct: number | null;
  readonly evol_pdm_pct: number | null;
  
  // LEGACY (compatibilité - ancien système)
  readonly ca_total_group?: number;
  readonly marge_total_group?: number;
  readonly part_marche_marge_pct?: number;
  readonly part_marche_achats_pct?: number;
  readonly is_referent: boolean;
}

export type LaboratorySortableColumn = 
  | 'laboratory_name'
  | 'rang_actuel'
  | 'gain_rang'
  | 'product_count'
  | 'ca_achats'
  | 'ca_selection'
  | 'evol_achats_pct'
  | 'evol_ventes_pct'
  | 'part_marche_ca_pct'
  | 'evol_pdm_pct'
  | 'marge_selection'
  | 'part_marche_marge_pct'
  | 'quantity_sold'
  | 'quantity_bought'
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