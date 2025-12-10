// src/components/organisms/CompetitiveTable/utils.ts
import type { 
  CompetitiveMetrics, 
  CompetitiveSortableColumn, 
  SortDirection, 
} from './types';

/**
 * Formatage currency EUR avec K/M pour grands nombres
 */
export function formatCurrency(value: number): string {
  if (value === 0) return '0,00 €';
  
  const absValue = Math.abs(value);
  
  if (absValue >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace('.', ',')}M €`;
  }
  if (absValue >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.', ',')}K €`;
  }
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formatage nombre avec K/M
 */
export function formatNumber(value: number): string {
  if (value === 0) return '0';
  
  const absValue = Math.abs(value);
  
  if (absValue >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace('.', ',')}M`;
  }
  if (absValue >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.', ',')}K`;
  }
  
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Formatage pourcentage avec couleurs écart concurrentiel
 */
export function formatPercentage(value: number, showSign: boolean = false): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);

  if (showSign && value > 0) {
    return `+${formatted}`;
  }

  return formatted;
}

/**
 * Classes couleur pour écart vs marché
 */
export function getCompetitiveColorClass(ecartPct: number): string {
  if (ecartPct > 5) {
    return 'text-red-600 bg-red-50'; // Trop cher vs marché
  }
  if (ecartPct > 2) {
    return 'text-orange-600 bg-orange-50'; // Légèrement cher
  }
  if (ecartPct > -2) {
    return 'text-gray-700 bg-gray-50'; // Prix aligné
  }
  if (ecartPct > -5) {
    return 'text-blue-600 bg-blue-50'; // Légèrement moins cher
  }
  return 'text-green-600 bg-green-50'; // Très compétitif
}

/**
 * Classes couleur pour marge comme ProductsTable
 */
export function getMarginColorClass(marginPercent: number): string {
  if (marginPercent >= 30) {
    return 'text-green-700 bg-green-50';
  }
  if (marginPercent >= 20) {
    return 'text-orange-600 bg-orange-50';
  }
  return 'text-red-600 bg-red-50';
}

/**
 * Filtrage produits par recherche (nom OU code EAN)
 */
export function filterCompetitiveProducts(
  products: CompetitiveMetrics[], 
  searchQuery: string
): CompetitiveMetrics[] {
if (!searchQuery || typeof searchQuery !== 'string' || !searchQuery.trim()) {
    return products;
  }

  const query = searchQuery.toLowerCase().trim();
  
  return products.filter(product => {
    // Recherche par nom produit
    if (product.product_name.toLowerCase().includes(query)) {
      return true;
    }
    
    // Recherche par code EAN
    if (product.code_ean.toLowerCase().includes(query)) {
      return true;
    }
    
    // Recherche par fin de code EAN (*fin_code)
    if (query.startsWith('*') && query.length > 1) {
      const endPattern = query.substring(1);
      return product.code_ean.toLowerCase().endsWith(endPattern);
    }
    
    return false;
  });
}

/**
 * Tri générique des produits concurrentiels
 */
export function sortCompetitiveProducts(
  products: CompetitiveMetrics[],
  column: CompetitiveSortableColumn,
  direction: SortDirection
): CompetitiveMetrics[] {
  if (!direction || !column || !products.length) {
    return products;
  }

  return [...products].sort((a, b) => {
    let aValue = a[column];
    let bValue = b[column];
    
    // Colonnes numériques
    const numericColumns: CompetitiveSortableColumn[] = [
      'prix_vente_min_global', 'prix_vente_max_global', 'prix_vente_moyen_global',
      'prix_vente_moyen_selection', 'prix_achat_moyen_ht',
      'taux_marge_moyen_selection', 'ecart_prix_vs_marche_pct'
    ];
    
    if (numericColumns.includes(column)) {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    }
    
    // Gestion valeurs nulles
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
    
    // Tri numérique
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
 * Pagination côté client
 */
export function paginateCompetitiveProducts(
  products: CompetitiveMetrics[], 
  currentPage: number, 
  itemsPerPage: number
): { 
  paginatedProducts: CompetitiveMetrics[]; 
  totalPages: number; 
  startIndex: number; 
  endIndex: number; 
} {
  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  const paginatedProducts = products.slice(startIndex, endIndex);
  
  return {
    paginatedProducts,
    totalPages,
    startIndex,
    endIndex
  };
}