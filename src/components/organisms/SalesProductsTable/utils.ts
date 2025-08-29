// src/components/organisms/SalesProductsTable/utils.ts

/**
 * Utilitaires pour SalesProductsTable - formatage et styling
 */

export const formatLargeNumber = (value: number): string => {
  if (value === 0) return '0';
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

/**
 * Classes CSS pour colorer les marges selon performance
 */
export const getMarginColorClass = (margin: number): string => {
  if (margin >= 30) return 'text-green-700 bg-green-50';
  if (margin >= 20) return 'text-green-600 bg-green-50';
  if (margin >= 10) return 'text-yellow-600 bg-yellow-50';
  if (margin >= 0) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
};

/**
 * Classes CSS pour colorer les parts de marché
 */
export const getMarketShareColorClass = (share: number): string => {
  if (share >= 20) return 'text-blue-700 bg-blue-50';
  if (share >= 10) return 'text-blue-600 bg-blue-50';
  if (share >= 5) return 'text-indigo-600 bg-indigo-50';
  if (share >= 1) return 'text-gray-600 bg-gray-50';
  return 'text-gray-500 bg-gray-50';
};