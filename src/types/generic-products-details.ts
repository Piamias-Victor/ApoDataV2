// src/types/generic-products-details.ts
/**
 * Types pour l'expansion détails temporels des produits génériques
 * Alignés sur la structure SalesProductRow mais adaptés aux métriques génériques
 */

export interface GenericProductDetail {
  readonly code_ean: string;
  readonly product_name: string;
  readonly laboratory_name: string;
  readonly periode: string;
  readonly periode_libelle: string;
  readonly type_ligne: 'DETAIL' | 'SYNTHESE';
  readonly quantity_bought: number;
  readonly quantity_sold: number;
  readonly ca_achats: number;
  readonly ca_ventes: number;
  readonly avg_buy_price_ht: number;
  readonly margin_rate_percent: number;
  readonly prix_brut_grossiste: number | null;
  readonly remise_percent: number;
}

export interface GenericProductDetailsResponse {
  readonly details: GenericProductDetail[];
  readonly productName: string;
  readonly laboratoryName: string;
  readonly queryTime: number;
  readonly cached: boolean;
}

export interface GenericProductDetailsRequest {
  readonly codeEan: string;
  readonly dateRange: { start: string; end: string };
  readonly pharmacyIds?: string[];
}

// Type pour les données du graphique
export interface GenericChartDataPoint {
  readonly periode: string;
  readonly quantityBought: number;
  readonly quantitySold: number;
  readonly prixAchat: number;
  readonly prixBrut: number | null;
  readonly marginRate: number;
  readonly remise: number;
  readonly caAchats: number;
  readonly caVentes: number;
}