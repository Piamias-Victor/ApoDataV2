// src/components/organisms/ProductsTable/utils.ts
import type { ProductMetrics, SortableColumn, SortDirection } from './types';

/**
* Formatage intelligent des nombres pour UI pharmaceutique
*/
export function formatNumber(value: number | null | undefined): string {
 // Validation et fallback
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
 // Validation et fallback
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
 // Validation et fallback
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
 // Validation et fallback
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
   let aValue = a[column];
   let bValue = b[column];
   
   // Conversion forcée en nombre pour les colonnes numériques
   const numericColumns: SortableColumn[] = [
     'current_stock', 'quantity_sold', 'ca_ttc', 'purchase_amount',
     'total_margin_ht', 'margin_rate_percent', 'avg_sell_price_ttc',
     'avg_buy_price_ht', 'unit_margin_ht'
   ];
   
   if (numericColumns.includes(column)) {
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
     // Vérification NaN
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
 // Validation robuste de searchQuery
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