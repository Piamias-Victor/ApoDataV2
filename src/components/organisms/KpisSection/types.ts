// src/components/organisms/KpisSection/types.ts

/**
 * Types pour KpisSection - Organism avec filtres cohérents ProductsTable
 */

export interface KpisSectionProps {
  readonly dateRange: { start: string; end: string };
  readonly comparisonDateRange?: { start: string; end: string };
  readonly filters?: {
    readonly products?: string[];
    readonly laboratories?: string[];
    readonly categories?: string[];
    readonly pharmacies?: string[];
  };
  readonly includeComparison?: boolean;
  readonly onRefresh?: () => void;
  readonly className?: string;
}

// Interface pour données KPI calculées (correspondant à l'API)
export interface KpiData {
  readonly ca_ttc: number;
  readonly montant_achat_ht: number;
  readonly montant_marge: number;
  readonly pourcentage_marge: number;
  readonly valeur_stock_ht: number;
  readonly quantite_stock: number;
  readonly quantite_vendue: number;
  readonly quantite_achetee: number;
  readonly jours_de_stock: number | null;
  readonly nb_references_produits: number;
  readonly nb_pharmacies: number;
  readonly comparison?: {
    readonly ca_ttc: number;
    readonly montant_marge: number;
    readonly quantite_vendue: number;
  };
}

// Interface pour KPI individual transformé
export interface TransformedKpi {
  readonly title: string;
  readonly value: number;
  readonly unit: 'currency' | 'percentage' | 'number' | 'days';
  readonly comparison?: {
    readonly value: number;
    readonly percentage: number;
    readonly trend: 'up' | 'down' | 'neutral';
  } | undefined;
  readonly variant: 'primary' | 'secondary' | 'success' | 'warning';
  readonly subtitle: string;
}