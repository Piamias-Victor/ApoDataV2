// src/components/organisms/ProductsTableGeneric/types.ts
/**
 * Types pour ProductsTableGeneric avec expansion détails
 */

export interface GenericProductMetrics {
  readonly laboratory_name: string;
  readonly product_name: string;
  readonly code_ean: string;
  readonly prix_brut_grossiste: number | null;
  readonly avg_buy_price_ht: number;
  readonly remise_percent: number;
  readonly quantity_bought: number;
  readonly ca_achats: number;
  readonly quantity_sold: number;
  readonly ca_ventes: number;
  readonly margin_rate_percent: number;
}

export type SortableColumn = 
  | 'laboratory_name'
  | 'product_name'
  | 'code_ean'
  | 'prix_brut_grossiste'
  | 'avg_buy_price_ht'
  | 'remise_percent'
  | 'quantity_bought'
  | 'ca_achats'
  | 'quantity_sold'
  | 'ca_ventes'
  | 'margin_rate_percent';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  column: SortableColumn;
  direction: SortDirection;
}

export interface ProductsTableGenericProps {
  readonly productCodes: string[];
  readonly dateRange: { start: string; end: string };
  readonly className?: string;
  readonly onRefresh?: () => void;
}