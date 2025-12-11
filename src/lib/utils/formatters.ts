// src/lib/utils/formatters.ts

/**
 * Format number as currency (EUR)
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * Format number with spaces as thousands separator
 */
export function formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
}

/**
 * Format percentage with sign
 */
export function formatPercent(value: number): string {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
}
