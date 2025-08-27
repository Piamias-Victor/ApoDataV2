// src/components/molecules/DualKpiCard/types.ts

/**
 * Types pour DualKpiCard - Composant KPI avec 2 valeurs
 */

export type DualKpiUnit = 'currency' | 'percentage' | 'number' | 'days';

export type DualKpiVariant = 'primary' | 'secondary' | 'success' | 'warning';

export type DualTrendDirection = 'up' | 'down' | 'neutral';

export interface DualKpiComparison {
  readonly value: number;
  readonly percentage: number;
  readonly trend: DualTrendDirection;
}

export interface DualKpiValue {
  readonly title: string;
  readonly value: number;
  readonly unit: DualKpiUnit;
  readonly comparison?: DualKpiComparison | undefined;
}

export interface DualKpiCardProps {
  readonly mainKpi: DualKpiValue;
  readonly secondaryKpi: DualKpiValue;
  readonly variant?: DualKpiVariant;
  readonly loading?: boolean;
  readonly error?: string | null;
  readonly className?: string;
}