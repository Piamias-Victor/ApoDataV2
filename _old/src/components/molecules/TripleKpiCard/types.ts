// src/components/molecules/TripleKpiCard/types.ts

import type { ReactNode } from 'react';

export type KpiUnit = 'number' | 'currency' | 'percentage';

export type TrendType = 'up' | 'down' | 'neutral';

export interface KpiComparison {
  value: number;
  percentage: number;
  trend: TrendType;
}

export interface KpiData {
  title: string;
  value: number;
  unit: KpiUnit;
  icon?: ReactNode;
  comparison?: KpiComparison | undefined;
}

export interface TripleKpiCardProps {
  mainKpi: KpiData;
  secondaryKpi: KpiData;
  tertiaryKpi: KpiData;
  loading?: boolean;
  error?: string | null;
  className?: string;
}