// src/components/organisms/PriceEvolutionChart/types.ts
export interface PriceEvolutionChartProps {
  readonly dateRange: { start: string; end: string };
  readonly filters?: {
    readonly productCodes?: string[];
    readonly pharmacyId?: string;
  };
  readonly className?: string;
  readonly onRefresh?: () => void;
}

export interface PriceChartDataPoint {
  readonly period: string;
  readonly quantite: number;
  readonly prixVente: number;
  readonly prixAchat: number;
  readonly tauxMarge: number;
}

export interface PriceMetricsEntry {
  readonly mois: string;
  readonly quantite_vendue_mois: number;
  readonly prix_vente_ttc_moyen: number;
  readonly prix_achat_ht_moyen: number;
  readonly taux_marge_moyen_pourcentage: number;
}