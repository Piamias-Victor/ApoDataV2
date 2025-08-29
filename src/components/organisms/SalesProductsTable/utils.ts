// src/components/organisms/SalesProductsTable/utils.ts
import type { 
  SalesProductMetrics, 
  SalesSortableColumn, 
  SortDirection 
} from './types';

/**
 * Formatage intelligent des grands nombres
 */
export function formatLargeNumber(value: number): string {
  if (value === 0) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  } else if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  
  return `${sign}${absValue.toLocaleString('fr-FR')}`;
}

/**
 * Formatage monétaire français
 */
export function formatCurrency(value: number): string {
  if (value === 0) return '0,00 €';
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formatage pourcentage avec 1 décimale
 */
export function formatPercentage(value: number): string {
  if (value === 0) return '0,0%';
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
}

/**
 * Classes CSS conditionnelles pour taux de marge (pharma)
 */
export function getMarginColorClass(marginPercent: number): string {
  if (marginPercent <= 0) {
    return 'text-red-700 bg-red-50';
  } else if (marginPercent < 15) {
    return 'text-orange-700 bg-orange-50';
  } else if (marginPercent < 25) {
    return 'text-blue-700 bg-blue-50';
  } else {
    return 'text-green-700 bg-green-50';
  }
}

/**
 * Classes CSS pour parts de marché
 */
export function getMarketShareColorClass(marketSharePercent: number): string {
  if (marketSharePercent === 0) {
    return 'text-gray-500 bg-gray-50';
  } else if (marketSharePercent < 5) {
    return 'text-orange-600 bg-orange-50';
  } else if (marketSharePercent < 15) {
    return 'text-blue-600 bg-blue-50';
  } else {
    return 'text-green-600 bg-green-50';
  }
}

/**
 * Tri des produits par colonne
 */
export function sortSalesProducts(
  products: SalesProductMetrics[],
  column: SalesSortableColumn,
  direction: SortDirection
): SalesProductMetrics[] {
  if (!direction) return [...products];

  return [...products].sort((a, b) => {
    const aValue = a[column];
    const bValue = b[column];
    
    // Tri alphabétique pour nom et code_ean
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue, 'fr-FR', { 
        sensitivity: 'base',
        numeric: true 
      });
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
 * Filtrage produits par recherche (nom OU code EAN) + support *fin_code
 */
export function filterSalesProducts(
  products: SalesProductMetrics[],
  searchQuery: string
): SalesProductMetrics[] {
  if (!searchQuery.trim()) {
    return products;
  }

  const query = searchQuery.trim();
  
  // Recherche par fin de code avec *
  if (query.startsWith('*') && query.length > 1) {
    const endPattern = query.slice(1).toLowerCase();
    
    return products.filter(product => 
      product.code_ean.toLowerCase().endsWith(endPattern)
    );
  }
  
  // Recherche normale par nom OU code EAN complet
  const normalizedQuery = query.toLowerCase();
  
  return products.filter(product => 
    product.nom.toLowerCase().includes(normalizedQuery) ||
    product.code_ean.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Pagination côté client
 */
export function paginateSalesProducts(
  products: SalesProductMetrics[],
  page: number,
  itemsPerPage: number
): { 
  paginatedProducts: SalesProductMetrics[];
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

/**
 * Calcul des statistiques globales sélection
 */
export function calculateSelectionStats(products: SalesProductMetrics[]): {
  totalProducts: number;
  totalQuantite: number;
  totalVentes: number;
  totalMarge: number;
  averageMargin: number;
} {
  if (products.length === 0) {
    return {
      totalProducts: 0,
      totalQuantite: 0,
      totalVentes: 0,
      totalMarge: 0,
      averageMargin: 0
    };
  }

  const totalQuantite = products.reduce((sum, p) => sum + p.quantite_vendue, 0);
  const totalVentes = products.reduce((sum, p) => sum + p.montant_ventes_ttc, 0);
  const totalMarge = products.reduce((sum, p) => sum + p.montant_marge_total, 0);
  
  // Marge moyenne pondérée par les ventes
  const averageMargin = totalVentes > 0 ? (totalMarge / totalVentes) * 100 : 0;

  return {
    totalProducts: products.length,
    totalQuantite,
    totalVentes,
    totalMarge,
    averageMargin
  };
}