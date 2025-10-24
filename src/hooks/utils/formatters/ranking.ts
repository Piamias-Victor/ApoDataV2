// src/utils/formatters/ranking.ts

/**
 * Formate un nombre avec K/M (big number format)
 * Ex: 249067577 → 249.1M
 */
export function formatBigNumber(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue) || numValue === 0) return '0';
  
  const absValue = Math.abs(numValue);
  
  if (absValue >= 1_000_000) {
    return `${(numValue / 1_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (absValue >= 1_000) {
    return `${(numValue / 1_000).toFixed(1).replace('.', ',')}K`;
  }
  
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue);
}

/**
 * Formate un pourcentage avec 1 décimale et signe
 * Ex: 5.5 → +5.5%, -4.4 → -4.4%, 0 → 0.0%
 */
export function formatEvolutionPercentage(value: number | string | null): string {
  if (value === null) return 'N/A';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue) || numValue === 0) return '0.0%';
  
  const sign = numValue > 0 ? '+' : '';
  return `${sign}${numValue.toFixed(1)}%`;
}

/**
 * Formate un delta PDM avec 2 décimales et signe
 * Ex: 0.17 → +0.17, -0.50 → -0.50, 0 → 0.00
 */
export function formatDeltaPDM(value: number | string | null): string {
  if (value === null) return 'N/A';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue) || numValue === 0) return '0.00';
  
  const sign = numValue > 0 ? '+' : '';
  return `${sign}${numValue.toFixed(2)}`;
}

/**
 * Formate une PDM avec 1 décimale sans signe
 * Ex: 12.9 → 12.9%
 */
export function formatPDM(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return `${numValue.toFixed(1)}%`;
}

/**
 * Formate un gain de rang avec signe
 * Ex: 3 → +3, -1 → -1, 0 → 0
 */
export function formatRankGain(value: number | string | null): string {
  if (value === null) return 'N/A';
  const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(numValue) || numValue === 0) return '0';
  
  const sign = numValue > 0 ? '+' : '';
  return `${sign}${numValue}`;
}

/**
 * Retourne la classe CSS de couleur selon la valeur (vert/rouge/gris)
 */
export function getEvolutionColorClass(value: number | string | null): string {
  if (value === null) return 'text-gray-500';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'text-gray-500';
  if (numValue > 0) return 'text-green-600';
  if (numValue < 0) return 'text-red-600';
  return 'text-gray-500';
}

/**
 * Retourne la classe CSS de couleur pour le gain de rang
 * (vert = progression, rouge = recul)
 */
export function getRankGainColorClass(value: number | string | null): string {
  if (value === null) return 'text-gray-500';
  const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(numValue)) return 'text-gray-500';
  if (numValue > 0) return 'text-green-600';
  if (numValue < 0) return 'text-red-600';
  return 'text-gray-500';
}