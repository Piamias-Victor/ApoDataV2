// src/components/organisms/ProductsTable/types.ts

export interface ProductMetrics {
  readonly product_name: string;
  readonly code_ean: string;
  readonly current_stock: number;
  readonly quantity_sold: number;
  readonly ca_ttc: number;
  readonly purchase_amount: number;
  readonly total_margin_ht: number;
  readonly margin_rate_percent: number;
  readonly avg_sell_price_ttc: number;
  readonly avg_buy_price_ht: number;
  readonly unit_margin_ht: number;
  readonly quantity_sold_comparison: number | null; // AJOUT pour comparaison
}

export type ViewMode = 'totals' | 'averages';

export type SortDirection = 'asc' | 'desc' | null;

export type SortableColumn = 
  | 'product_name'
  | 'code_ean' 
  | 'current_stock'
  | 'quantity_sold'
  | 'quantity_sold_evolution' // AJOUT pour tri sur évolution
  | 'ca_ttc'
  | 'purchase_amount'
  | 'total_margin_ht'
  | 'margin_rate_percent'
  | 'avg_sell_price_ttc'
  | 'avg_buy_price_ht'
  | 'unit_margin_ht';

export interface SortConfig {
  readonly column: SortableColumn | null;
  readonly direction: SortDirection;
}

export interface ColumnConfig {
  readonly key: SortableColumn;
  readonly label: string;
  readonly visible: boolean;
  readonly sortable: boolean;
  readonly format?: 'currency' | 'number' | 'percentage' | 'text';
  readonly align?: 'left' | 'center' | 'right';
}

export interface TableState {
  readonly searchQuery: string;
  readonly sortConfig: SortConfig;
  readonly viewMode: ViewMode;
  readonly currentPage: number;
  readonly itemsPerPage: number;
}

export interface PaginationInfo {
  readonly totalItems: number;
  readonly totalPages: number;
  readonly currentPage: number;
  readonly startIndex: number;
  readonly endIndex: number;
}