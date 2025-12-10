// src/utils/formatters.ts
export function formatLargeNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace('.', ',')}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.', ',')}k`;
  }
  return value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatCurrency(value: number, compact: boolean = false): string {
  if (compact && value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace('.', ',')}M €`;
  }
  if (compact && value >= 1000) {
    return `${(value / 1000).toFixed(0)}k €`;
  }
  return `${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`;
}