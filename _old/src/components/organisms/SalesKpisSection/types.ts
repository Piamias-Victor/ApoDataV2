// src/components/organisms/SalesKpisSection/types.ts

/**
 * Types pour SalesKpisSection - KPI spécialisés ventes avec parts de marché
 */

export interface SalesKpisSectionProps {
  readonly dateRange: { start: string; end: string };
  readonly comparisonDateRange?: { start: string | null; end: string | null };
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

// Interface pour données KPI calculées ventes
export interface SalesKpiData {
  readonly quantite_vendue: number;
  readonly ca_ttc: number;
  readonly part_marche_ca_pct: number;
  readonly part_marche_marge_pct: number;
  readonly nb_references_selection: number;
  readonly nb_references_80pct_ca: number;
  readonly montant_marge: number;
  readonly taux_marge_pct: number;
  readonly comparison?: {
    readonly quantite_vendue: number;
    readonly ca_ttc: number;
    readonly part_marche_ca_pct: number;
    readonly part_marche_marge_pct: number;
    readonly nb_references_selection: number;
    readonly nb_references_80pct_ca: number;
    readonly montant_marge: number;
    readonly taux_marge_pct: number;
  };
}

// Interface pour KPI individuel transformé ventes
export interface TransformedSalesKpi {
  readonly title: string;
  readonly value: number;
  readonly unit: 'currency' | 'percentage' | 'number';
  readonly comparison?: {
    readonly value: number;
    readonly percentage: number;
    readonly trend: 'up' | 'down' | 'neutral';
  } | undefined;
  readonly variant: 'primary' | 'secondary' | 'success' | 'warning';
  readonly subtitle: string;
}

// Interface pour groupement des KPI en DualKpiCard
export interface GroupedSalesKpis {
  readonly quantityCa: {
    readonly main: TransformedSalesKpi;     // Quantité Vendue
    readonly secondary: TransformedSalesKpi; // CA TTC
  };
  readonly marketShare: {
    readonly main: TransformedSalesKpi;     // Part Marché CA
    readonly secondary: TransformedSalesKpi; // Part Marché Marge
  };
  readonly references: {
    readonly main: TransformedSalesKpi;     // Nb Références
    readonly secondary: TransformedSalesKpi; // % Références Vendues
  };
  readonly margin: {
    readonly main: TransformedSalesKpi;     // Montant Marge
    readonly secondary: TransformedSalesKpi; // Taux Marge
  };
}