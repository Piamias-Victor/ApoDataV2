// src/components/organisms/ProductsTable/ProductsTable.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { SearchBar } from '@/components/molecules/SearchBar/SearchBar';
import { ViewToggle } from '@/components/molecules/ViewToggle/ViewToggle';
import { TableHeader } from '@/components/molecules/TableHeader/TableHeader';
import { TableRow } from '@/components/molecules/TableRow/TableRow';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import type { 
  ProductMetrics, 
  ViewMode, 
  SortConfig, 
  SortableColumn, 
  SortDirection,
  PaginationInfo 
} from './types';
import { sortProducts, filterProducts, paginateProducts } from './utils';

interface ProductsTableProps {
  readonly products: ProductMetrics[];
  readonly isLoading?: boolean;
  readonly error?: string | null;
  readonly className?: string;
  readonly onRefresh?: () => void;
}

/**
 * ProductsTable - Tableau avancé produits pharmaceutiques
 * 
 * Features complètes :
 * - Double vue : Totaux (Σ) / Moyennes (⌀)
 * - Tri par colonnes avec indicateurs visuels
 * - Recherche debounce 300ms (nom OU code EAN)
 * - Pagination côté client (50 items/page)
 * - Formatage intelligent grands nombres (12K, 1.2M)
 * - Couleurs conditionnelles marges métier pharma
 * - Performance optimisée 1000+ produits
 * - Design Apple/Stripe/Vercel cohérent
 */
export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  isLoading = false,
  error = null,
  className = '',
  onRefresh
}) => {
  // États locaux du tableau
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('totals');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: null,
    direction: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 50;

  // Gestion du tri
  const handleSort = useCallback((column: SortableColumn) => {
    setSortConfig(prev => {
      if (prev.column === column) {
        // Cycle : asc → desc → null
        const newDirection: SortDirection = 
          prev.direction === 'asc' ? 'desc' :
          prev.direction === 'desc' ? null : 'asc';
        
        return {
          column: newDirection ? column : null,
          direction: newDirection
        };
      }
      
      // Nouvelle colonne, commence par asc
      return {
        column,
        direction: 'asc'
      };
    });
    
    // Reset page lors du tri
    setCurrentPage(1);
  }, []);

  // Gestion recherche
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset page lors de la recherche
  }, []);

  // Gestion changement de vue
  const handleViewChange = useCallback((newViewMode: ViewMode) => {
    setViewMode(newViewMode);
    // Reset tri car colonnes différentes
    setSortConfig({ column: null, direction: null });
    setCurrentPage(1);
  }, []);

  // Traitement des données (filtrage + tri + pagination)
  const processedData = useMemo(() => {
    // 1. Filtrage par recherche
    const filteredProducts = filterProducts(products, searchQuery);
    
    // 2. Tri
    const sortedProducts = sortProducts(
      filteredProducts, 
      sortConfig.column || 'product_name', // Default fallback
      sortConfig.direction
    );
    
    // 3. Pagination
    const paginationResult = paginateProducts(sortedProducts, currentPage, itemsPerPage);
    
    const paginationInfo: PaginationInfo = {
      totalItems: filteredProducts.length,
      totalPages: paginationResult.totalPages,
      currentPage,
      startIndex: paginationResult.startIndex,
      endIndex: paginationResult.endIndex
    };

    return {
      products: paginationResult.paginatedProducts,
      pagination: paginationInfo
    };
  }, [products, searchQuery, sortConfig, currentPage]);

  // Gestion pagination
  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(processedData.pagination.totalPages, prev + 1));
  }, [processedData.pagination.totalPages]);

  // États d'erreur et loading
  if (error) {
    return (
      <Card variant="elevated" className={`p-6 text-center ${className}`}>
        <p className="text-red-600">❌ {error}</p>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Header avec contrôles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <ViewToggle
            currentView={viewMode}
            onViewChange={handleViewChange}
          />
          <div className="text-sm text-gray-500">
            {processedData.pagination.totalItems} produit{processedData.pagination.totalItems > 1 ? 's' : ''}
          </div>
          
          {/* Bouton refresh */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              iconLeft={
                <RotateCcw 
                  className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
                />
              }
              className="text-gray-600 hover:text-gray-900"
            >
              {isLoading ? 'Actualisation...' : 'Actualiser'}
            </Button>
          )}
        </div>
        
        <SearchBar
          onSearch={handleSearch}
          placeholder="Rechercher par nom, code EAN ou *fin_code..."
        />
      </div>

      {/* Tableau principal */}
      <Card variant="elevated" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            
            <TableHeader
              viewMode={viewMode}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
            
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Chargement des produits...</span>
                    </div>
                  </td>
                </tr>
              ) : processedData.products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    {searchQuery 
                      ? `Aucun produit trouvé pour "${searchQuery}"`
                      : 'Aucun produit disponible'
                    }
                  </td>
                </tr>
              ) : (
                processedData.products.map((product, index) => (
                  <TableRow
                    key={`${product.code_ean}-${index}`}
                    product={product}
                    viewMode={viewMode}
                    isEven={index % 2 === 0}
                  />
                ))
              )}
            </tbody>
            
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {processedData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Affichage {processedData.pagination.startIndex + 1}-{processedData.pagination.endIndex} 
            {' '}sur {processedData.pagination.totalItems} produits
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              iconLeft={<ChevronLeft className="w-4 h-4" />}
            >
              Précédent
            </Button>
            
            <span className="text-sm text-gray-600">
              Page {currentPage} sur {processedData.pagination.totalPages}
            </span>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === processedData.pagination.totalPages}
              iconRight={<ChevronRight className="w-4 h-4" />}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
      
    </div>
  );
};