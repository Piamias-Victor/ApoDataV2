// src/components/organisms/SalesTable/utils.ts

import type { 
  ProductSalesSummary, 
  SalesSortConfig,
  ProcessedSalesData
} from './types';

/**
 * Utilitaires formatting identiques à ProductsMonthlyTable
 */
export const formatLargeNumber = (value: number | undefined | null): string => {
  // Guard clauses pour valeurs invalides
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  
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

/**
 * Filtrage produits par recherche textuelle
 */
export const filterProductSummaries = <T extends ProductSalesSummary>(
  products: T[],
  searchQuery: string
): T[] => {
      if (!searchQuery || typeof searchQuery !== 'string' || !searchQuery.trim()) {
    return products;
  }
  
  const query = searchQuery.toLowerCase().trim();
  
  return products.filter(product =>
    product.nom.toLowerCase().includes(query) ||
    product.code_ean.toLowerCase().includes(query)
  );
};

/**
 * Tri des produits selon configuration
 */
export const sortProductSummaries = <T extends ProductSalesSummary>(
  products: T[],
  sortConfig: SalesSortConfig
): T[] => {
  if (!sortConfig.column || !sortConfig.direction) {
    return [...products];
  }

  return [...products].sort((a, b) => {
    const { column, direction } = sortConfig;
    
    // Guard clauses pour éviter null comme index
    if (!column) return 0;
    
    let aValue: string | number = a[column as keyof T] as string | number;
    let bValue: string | number = b[column as keyof T] as string | number;

    // Gestion spécifique selon le type de colonne
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      // Tri alphabétique
      const comparison = aValue.localeCompare(bValue, 'fr-FR');
      return direction === 'asc' ? comparison : -comparison;
    }

    // Tri numérique
    aValue = typeof aValue === 'number' ? aValue : 0;
    bValue = typeof bValue === 'number' ? bValue : 0;
    
    if (direction === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });
};

/**
 * Pagination des produits
 */
export const paginateProductSummaries = <T extends ProductSalesSummary>(
  products: T[],
  currentPage: number,
  itemsPerPage: number
): ProcessedSalesData => {
  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  const paginatedProducts = products.slice(startIndex, endIndex);

  return {
    products: paginatedProducts,
    pagination: {
      totalItems,
      totalPages,
      currentPage,
      startIndex,
      endIndex
    }
  };
};

/**
 * Traitement complet des données avec filtrage, tri et pagination
 */
export const processProductSummaries = <T extends ProductSalesSummary>(
  products: T[],
  searchQuery: string,
  sortConfig: SalesSortConfig,
  currentPage: number,
  itemsPerPage: number
): ProcessedSalesData => {
  // 1. Filtrage
  const filteredProducts = filterProductSummaries(products, searchQuery);
  
  // 2. Tri
  const sortedProducts = sortProductSummaries(filteredProducts, sortConfig);
  
  // 3. Pagination
  return paginateProductSummaries(sortedProducts, currentPage, itemsPerPage);
};