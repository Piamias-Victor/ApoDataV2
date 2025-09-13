// src/components/molecules/KpiCard/utils.ts

import type { KpiUnit, TrendDirection } from './types';

/**
 * Formatters pharmaceutiques pour valeurs KPI
 * Conformité métier pharma français
 */

/**
 * Formate les montants en EUR avec notation K/M
 */
export const formatCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `${millions.toFixed(1).replace('.', ',')}M€`;
  }
  
  if (absAmount >= 1_000) {
    const thousands = amount / 1_000;
    return `${thousands.toFixed(1).replace('.', ',')}K€`;
  }
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Formate les pourcentages (1 décimale)
 */
export function formatPercentage(value: number | string | null | undefined, decimals: number = 1): string {
  const numValue = Number(value);
  if (value === null || value === undefined || isNaN(numValue)) {
    return '0.0%';
  }
  return `${numValue.toFixed(decimals)}%`;
}

/**
 * Formate les jours de stock
 */
export const formatDays = (days: number): string => {
  const roundedDays = Math.round(days);
  return `${roundedDays.toLocaleString('fr-FR')} jours`;
};

/**
 * Formate les nombres avec espaces français
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString('fr-FR');
};

/**
 * Formatter principal selon l'unité
 */
export const formatKpiValue = (value: number, unit: KpiUnit): string => {
  switch (unit) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'days':
      return formatDays(value);
    case 'number':
      return formatNumber(value);
    default:
      return value.toString();
  }
};

/**
 * Détermine la direction trend à partir d'un pourcentage
 */
export const getTrendDirection = (percentage: number): TrendDirection => {
  if (percentage > 0) return 'up';
  if (percentage < 0) return 'down';
  return 'neutral';
};

/**
 * Formate le pourcentage d'évolution avec signe
 */
export const formatEvolutionPercentage = (percentage: number): string => {
  const sign = percentage > 0 ? '+' : '';
  return `${sign}${formatPercentage(percentage)}`;
};

/**
 * Retourne l'icône de trend appropriée
 */
export const getTrendIcon = (trend: TrendDirection): string => {
  switch (trend) {
    case 'up':
      return '↗️';
    case 'down':
      return '↘️';
    case 'neutral':
      return '➡️';
    default:
      return '➡️';
  }
};

/**
 * Calcule le pourcentage d'évolution
 */
export const calculateEvolutionPercentage = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};