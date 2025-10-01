// src/components/organisms/RupturesProductsTable/utils.ts
import type { RuptureProductSummary } from '@/hooks/dashboard/useRupturesProducts';

type RuptureSortableColumn = 
  | 'nom' 
  | 'code_ean' 
  | 'quantite_vendue' 
  | 'quantite_commandee' 
  | 'quantite_receptionnee' 
  | 'delta_quantite' 
  | 'taux_reception' 
  | 'prix_achat_moyen' 
  | 'quantite_stock' 
  | 'montant_delta';

type SortDirection = 'asc' | 'desc' | null;

export function sortRuptureProducts(
  products: RuptureProductSummary[],
  column: RuptureSortableColumn,
  direction: SortDirection
): RuptureProductSummary[] {
  if (!direction || !column || !products.length) {
    return products;
  }

  return [...products].sort((a, b) => {
    let aValue = a[column];
    let bValue = b[column];
    
    const numericColumns: RuptureSortableColumn[] = [
      'quantite_vendue',
      'quantite_commandee',
      'quantite_receptionnee',
      'delta_quantite',
      'taux_reception',
      'prix_achat_moyen',
      'quantite_stock',
      'montant_delta'
    ];
    
    if (numericColumns.includes(column)) {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    }
    
    if (aValue === null || aValue === undefined) {
      if (bValue === null || bValue === undefined) return 0;
      return direction === 'asc' ? 1 : -1;
    }
    if (bValue === null || bValue === undefined) {
      return direction === 'asc' ? -1 : 1;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      return direction === 'asc' ? comparison : -comparison;
    }
    
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