// src/components/organisms/ProductsTable/utils.ts
import type { ProductMetrics, SortableColumn, SortDirection } from './types';

/**
* Formatage intelligent des nombres pour UI pharmaceutique
*/
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0';
  }

  const numValue = Number(value);
  if (numValue === 0) return '0';

  const absValue = Math.abs(numValue);

  if (absValue >= 1_000_000) {
    return `${(numValue / 1_000_000).toFixed(1)}M`;
  }

  if (absValue >= 1_000) {
    return `${(numValue / 1_000).toFixed(1)}K`;
  }

  if (absValue >= 100) {
    return Math.round(numValue).toString();
  }

  return numValue.toFixed(1);
}

/**
* Formatage monnaie avec format intelligent et validation
*/
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0€';
  }

  const formatted = formatNumber(value);
  return `${formatted}€`;
}

/**
* Formatage pourcentage avec validation robuste
*/
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0.0%';
  }

  const numValue = Number(value);
  return `${numValue.toFixed(1)}%`;
}

/**
* Obtenir classe couleur pour marge selon seuils métier avec validation
*/
export function getMarginColorClass(marginPercent: number | null | undefined): string {
  if (marginPercent === null || marginPercent === undefined || isNaN(Number(marginPercent))) {
    return 'text-gray-600 bg-gray-50';
  }

  const numValue = Number(marginPercent);

  if (numValue >= 30) {
    return 'text-green-600 bg-green-50';
  }

  if (numValue >= 20) {
    return 'text-orange-600 bg-orange-50';
  }

  return 'text-red-600 bg-red-50';
}

/**
* Calcule l'évolution en pourcentage entre quantité actuelle et comparaison
*/
function calculateQuantityEvolution(product: ProductMetrics): number | null {
  if (product.quantity_sold_comparison === null || product.quantity_sold_comparison === 0) {
    return null;
  }

  return ((product.quantity_sold - product.quantity_sold_comparison) / product.quantity_sold_comparison) * 100;
}

/**
* Calcule l'évolution en pourcentage entre CA actuel et comparaison
*/
function calculateCaEvolution(product: ProductMetrics): number | null {
  if (product.ca_ttc_comparison === null || product.ca_ttc_comparison === 0) {
    return null;
  }

  return ((product.ca_ttc - product.ca_ttc_comparison) / product.ca_ttc_comparison) * 100;
}

/**
 * Calcule les jours de stock
 */
function calculateDaysStock(product: ProductMetrics): number | null {
  const currentStock = Number(product.current_stock || 0);
  const qtySold = Number(product.quantity_sold || 0);

  if (currentStock > 0 && qtySold > 0) {
    return (currentStock / qtySold) * 30;
  }

  return null;
}

/**
* Tri générique des produits par colonne avec validation robuste
*/
export function sortProducts(
  products: ProductMetrics[],
  column: SortableColumn,
  direction: SortDirection
): ProductMetrics[] {
  if (!direction || !column || !products.length) {
    return products;
  }

  return [...products].sort((a, b) => {
    // CAS SPÉCIAL : quantity_sold_evolution (valeur calculée)
    if (column === 'quantity_sold_evolution') {
      const evolA = calculateQuantityEvolution(a);
      const evolB = calculateQuantityEvolution(b);

      if (evolA === null && evolB === null) return 0;
      if (evolA === null) return 1;
      if (evolB === null) return -1;

      const comparison = evolA - evolB;
      return direction === 'asc' ? comparison : -comparison;
    }

    // CAS SPÉCIAL : ca_ttc_evolution (valeur calculée)
    if (column === 'ca_ttc_evolution') {
      const evolA = calculateCaEvolution(a);
      const evolB = calculateCaEvolution(b);

      if (evolA === null && evolB === null) return 0;
      if (evolA === null) return 1;
      if (evolB === null) return -1;

      const comparison = evolA - evolB;
      return direction === 'asc' ? comparison : -comparison;
    }

    // CAS SPÉCIAL : days_stock (valeur calculée)
    if (column === 'days_stock') {
      const daysStockA = calculateDaysStock(a);
      const daysStockB = calculateDaysStock(b);

      if (daysStockA === null && daysStockB === null) return 0;
      if (daysStockA === null) return 1;
      if (daysStockB === null) return -1;

      const comparison = daysStockA - daysStockB;
      return direction === 'asc' ? comparison : -comparison;
    }

    // CAS STANDARD : propriétés de ProductMetrics
    let aValue = a[column as keyof ProductMetrics];
    let bValue = b[column as keyof ProductMetrics];

    // Conversion forcée en nombre pour les colonnes numériques
    const numericColumns: (keyof ProductMetrics)[] = [
      'current_stock',
      'quantity_sold',
      'ca_ttc',
      'quantity_bought',
      'purchase_amount',
      'total_margin_ht',
      'margin_rate_percent',
      'avg_sell_price_ttc',
      'avg_buy_price_ht',
      'unit_margin_ht',
      'quantity_sold_comparison',
      'ca_ttc_comparison'
    ];

    if (numericColumns.includes(column as keyof ProductMetrics)) {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    }

    // Gestion des valeurs nulles/undefined
    if (aValue === null || aValue === undefined) {
      if (bValue === null || bValue === undefined) return 0;
      return direction === 'asc' ? 1 : -1;
    }
    if (bValue === null || bValue === undefined) {
      return direction === 'asc' ? -1 : 1;
    }

    // Tri texte
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      return direction === 'asc' ? comparison : -comparison;
    }

    // Tri numérique avec validation
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      if (isNaN(aValue)) {
        if (isNaN(bValue)) return 0;
        return direction === 'asc' ? 1 : -1;
      }
      if (isNaN(bValue)) {
        return direction === 'asc' ? -1 : 1;
      }

      const comparison = aValue - bValue;
      return direction === 'asc' ? comparison : -comparison;
    }

    return 0;
  });
}

/**
* Filtrage produits par recherche (nom OU code EAN) + recherche par fin de code
*/
export function filterProducts(
  products: ProductMetrics[],
  searchQuery: string
): ProductMetrics[] {
  if (!searchQuery || typeof searchQuery !== 'string' || !searchQuery.trim()) {
    return products;
  }

  const query = searchQuery.trim();

  // Recherche par fin de code avec *
  if (query.startsWith('*') && query.length > 1) {
    const endPattern = query.slice(1).toLowerCase();

    return products.filter(product =>
      product.code_ean?.toLowerCase().endsWith(endPattern) ?? false
    );
  }

  // Recherche normale par nom OU code EAN complet
  const normalizedQuery = query.toLowerCase();

  return products.filter(product =>
    (product.product_name?.toLowerCase().includes(normalizedQuery) ?? false) ||
    (product.code_ean?.toLowerCase().includes(normalizedQuery) ?? false)
  );
}

/**
* Pagination simple côté client
*/
export function paginateProducts(
  products: ProductMetrics[],
  page: number,
  itemsPerPage: number
): {
  paginatedProducts: ProductMetrics[];
  totalPages: number;
  startIndex: number;
  endIndex: number;
} {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, products.length);
  const paginatedProducts = products.slice(startIndex, endIndex);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  return {
    paginatedProducts,
    totalPages,
    startIndex,
    endIndex
  };
}