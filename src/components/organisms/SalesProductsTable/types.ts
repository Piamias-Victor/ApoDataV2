// src/components/organisms/SalesProductsTable/types.ts
/**
 * Types pour SalesProductsTable - Tableau ventes détaillé par produit
 * CORRECTION : Unification des types pour éviter les conflits
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
  quantite_vendue_comparison?: number;
}

// CORRECTION : Alias pour compatibilité avec hook useSalesProducts
export type ProductSalesSummary = SalesProductMetrics;

export interface SalesProductsResponse {
  readonly products: SalesProductMetrics[];
  readonly totalQuantiteVendue: number;
  readonly totalMargeSelection: number;
  readonly count: number;
  readonly queryTime: number;
  readonly cached: boolean;
}

// CORRECTION : Types pour tri des colonnes (compatible avec les nouvelles propriétés)
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

// CORRECTION : Union types pour compatibilité avec ProductsTable existant
export type SortableColumn = 
  | 'product_name'
  | 'code_ean' 
  | 'current_stock'
  | 'quantity_sold'
  | 'ca_ttc'
  | 'purchase_amount'
  | 'total_margin_ht'
  | 'margin_rate_percent'
  | 'avg_sell_price_ttc'
  | 'avg_buy_price_ht'
  | 'unit_margin_ht'
  | 'quantite_vendue'  // AJOUT pour compatibilité SalesTable
  | 'nom'              // AJOUT pour compatibilité SalesTable
  | 'prix_achat_moyen' 
  | 'prix_vente_moyen'
  | 'taux_marge_moyen'
  | 'part_marche_quantite_pct'
  | 'part_marche_marge_pct'
  | 'montant_ventes_ttc'
  | 'montant_marge_total';