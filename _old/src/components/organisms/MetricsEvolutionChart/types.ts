// src/components/organisms/MetricsEvolutionChart/types.ts
export type ViewMode = 'daily' | 'weekly' | 'monthly';
export type DataMode = 'values' | 'cumulative';

export interface MetricsEvolutionChartProps {
  readonly dateRange: { start: string; end: string };
  readonly filters?: {
    readonly productCodes?: string[];
    readonly pharmacyId?: string | undefined;
  };
  readonly className?: string;
  readonly onRefresh?: () => void;
}

export interface AggregatedDataPoint {
  readonly date: string;
  readonly period: string; // Pour affichage (ex: "2024-01", "2024-W03")
  readonly ventes: number;
  readonly achats: number;
  readonly marge: number;
  readonly stock: number;
}

export interface ChartDataPoint extends AggregatedDataPoint {
  readonly cumulVentes: number;
  readonly cumulAchats: number;
  readonly cumulMarge: number;
  readonly cumulStock: number;
}