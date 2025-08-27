// src/components/molecules/KpiCard/types.ts

/**
 * Types pour KpiCard - Composant molecule pharmaceutique
 * Conformité interface API + design cohérent ProductsTable
 */

export type KpiUnit = 'currency' | 'percentage' | 'number' | 'days';

export type KpiVariant = 'primary' | 'secondary' | 'success' | 'warning';

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface KpiComparison {
  readonly value: number;
  readonly percentage: number;
  readonly trend: TrendDirection;
}

export interface KpiCardProps {
  readonly title: string;
  readonly value: number;
  readonly unit: KpiUnit;
  readonly comparison?: KpiComparison | undefined;
  readonly variant?: KpiVariant;
  readonly loading?: boolean;
  readonly error?: string | null;
  readonly subtitle?: string;
  readonly className?: string;
}

export interface KpiCardSkeletonProps {
  readonly className?: string;
}