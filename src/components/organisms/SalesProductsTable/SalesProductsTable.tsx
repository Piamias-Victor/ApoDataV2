// src/components/organisms/SalesProductsTable/SalesProductsTable.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Eye, Search, ChevronUp } from 'lucide-react';
import { SearchBar } from '@/components/molecules/SearchBar/SearchBar';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { Badge } from '@/components/atoms/Badge/Badge';
import { SalesProductChart } from '../SalesProductChart/SalesProductChart';
import { useSalesProducts } from '@/hooks/dashboard/useSalesProducts';
import type { 
  SalesProductsTableProps,
  SalesSortConfig, 
  SalesSortableColumn, 
  SortDirection
} from './types';
import { 

  formatLargeNumber,
  formatCurrency,
  formatPercentage,
  getMarginColorClass,
  getMarketShareColorClass
} from './utils';
import { filterProductSummaries, sortProductSummaries, paginateProductSummaries } from '../ProductsMonthlyTable/utils';

export const SalesProductsTable: React.FC<SalesProductsTableProps> = ({
  dateRange,
  filters = {},
  onRefresh,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SalesSortConfig>({
    column: 'quantite_vendue',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 50;

  const { 
    productSummaries, 
    getSalesDetails, 
    isLoading, 
    error, 
    refetch, 
    queryTime,
    hasData 
  } = useSalesProducts({ 
    enabled: true,
    dateRange,
    filters
  });

  const toggleProductExpansion = useCallback((codeEan: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(codeEan)) {
        newSet.delete(codeEan);
      } else {
        newSet.add(codeEan);
      }
      return newSet;
    });
  }, []);

  const handleSort = useCallback((column: SalesSortableColumn) => {
    setSortConfig(prev => {
      if (prev.column === column) {
        const newDirection: SortDirection = prev.direction === 'asc' ? 'desc' : 'asc';
        return { column, direction: newDirection };
      }
      
      return {
        column,
        direction: column === 'nom' || column === 'code_ean' ? 'asc' : 'desc'
      };
    });
    
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const processedData = useMemo(() => {
    const filteredProducts = filterProductSummaries(productSummaries, searchQuery);
    const sortedProducts = sortProductSummaries(
      filteredProducts, 
      sortConfig.column || 'quantite_vendue',
      sortConfig.direction
    );
    const paginationResult = paginateProductSummaries(sortedProducts, currentPage, itemsPerPage);
    
    return {
      products: paginationResult.paginatedProducts,
      pagination: {
        totalItems: filteredProducts.length,
        totalPages: paginationResult.totalPages,
        currentPage,
        startIndex: paginationResult.startIndex,
        endIndex: paginationResult.endIndex
      }
    };
  }, [productSummaries, searchQuery, sortConfig, currentPage]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(processedData.pagination.totalPages, prev + 1));
  }, [processedData.pagination.totalPages]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  const getSortIndicator = (column: SalesSortableColumn) => {
    if (sortConfig.column !== column) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Tableau des ventes par produit
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>{hasData && processedData ? processedData.pagination.totalItems : 0} produits</span>
            <Badge variant="gray" size="sm">{queryTime}ms</Badge>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          iconLeft={<RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          className="text-gray-600 hover:text-gray-900"
        >
          {isLoading ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>
      
      <SearchBar
        onSearch={handleSearch}
        placeholder="Rechercher par nom, code EAN ou *fin_code..."
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {renderHeader()}
        <Card variant="elevated" className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        {renderHeader()}
        <Card variant="elevated" className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-red-600 mb-4">{error}</p>
        </Card>
      </div>
    );
  }

  if (!hasData || processedData.products.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {renderHeader()}
        <Card variant="elevated" className="p-6 text-center">
          <div className="text-gray-400 mb-4">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? 'Aucun produit trouvé' : 'Aucune donnée disponible'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery 
              ? `Aucun résultat pour "${searchQuery}". Modifiez votre recherche.`
              : 'Sélectionnez des filtres pour voir les ventes par produit.'
            }
          </p>
          {searchQuery && (
            <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
              Effacer la recherche
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      
      {renderHeader()}

      <Card variant="elevated" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('nom')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Nom produit</span>
                    <span className="text-gray-400">{getSortIndicator('nom')}</span>
                  </div>
                </th>
                
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('code_ean')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Code EAN</span>
                    <span className="text-gray-400">{getSortIndicator('code_ean')}</span>
                  </div>
                </th>
                
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('quantite_vendue')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Qté vendue</span>
                    <span className="text-gray-400">{getSortIndicator('quantite_vendue')}</span>
                  </div>
                </th>
                
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('prix_achat_moyen')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Prix achat moy.</span>
                    <span className="text-gray-400">{getSortIndicator('prix_achat_moyen')}</span>
                  </div>
                </th>
                
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('prix_vente_moyen')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Prix vente moy.</span>
                    <span className="text-gray-400">{getSortIndicator('prix_vente_moyen')}</span>
                  </div>
                </th>
                
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('taux_marge_moyen')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Taux marge moy.</span>
                    <span className="text-gray-400">{getSortIndicator('taux_marge_moyen')}</span>
                  </div>
                </th>
                
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('part_marche_quantite_pct')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Part marché qty</span>
                    <span className="text-gray-400">{getSortIndicator('part_marche_quantite_pct')}</span>
                  </div>
                </th>
                
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('part_marche_marge_pct')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Part marché marge</span>
                    <span className="text-gray-400">{getSortIndicator('part_marche_marge_pct')}</span>
                  </div>
                </th>
                
                <th className="w-16 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Détails
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100">
              {processedData.products.map((product, index) => {
                const isExpanded = expandedProducts.has(product.code_ean);
                const salesDetails = getSalesDetails(product.code_ean);
                const hasDetailsData = salesDetails.length > 0;
                
                return (
                  <React.Fragment key={product.code_ean}>
                    
                    <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'} hover:bg-gray-50 transition-colors`}>
                      
                      <td className="px-3 py-3">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={product.nom}>
                          {product.nom}
                        </div>
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 font-mono">
                          {product.code_ean}
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatLargeNumber(product.quantite_vendue)}
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(product.prix_achat_moyen)}
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(product.prix_vente_moyen)}
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 text-right">
                        <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getMarginColorClass(product.taux_marge_moyen)}`}>
                          {formatPercentage(product.taux_marge_moyen)}
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 text-right">
                        <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getMarketShareColorClass(product.part_marche_quantite_pct)}`}>
                          {formatPercentage(product.part_marche_quantite_pct)}
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 text-right">
                        <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getMarketShareColorClass(product.part_marche_marge_pct)}`}>
                          {formatPercentage(product.part_marche_marge_pct)}
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleProductExpansion(product.code_ean)}
                          disabled={!hasDetailsData}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                            hasDetailsData 
                              ? 'hover:bg-gray-200 text-gray-600 hover:text-gray-900' 
                              : 'opacity-50 cursor-not-allowed text-gray-400'
                          }`}
                          title={hasDetailsData ? 'Voir évolution périodique' : 'Pas de détails disponibles'}
                        >
                          {hasDetailsData ? (
                            isExpanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />
                          ) : (
                            <div className="w-4 h-4"></div>
                          )}
                        </button>
                      </td>
                      
                    </tr>
                    
                    {isExpanded && hasDetailsData && (
                      <tr>
                        <td colSpan={9} className="p-0 relative">
                          <div className="bg-gray-50 border-t border-gray-200 p-6">
                            <SalesProductChart
                              salesDetails={salesDetails}
                              productName={product.nom}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                    
                  </React.Fragment>
                );
              })}
            </tbody>
            
          </table>
        </div>
      </Card>

      {processedData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Affichage {processedData.pagination.startIndex + 1}-{processedData.pagination.endIndex} 
            sur {processedData.pagination.totalItems} produits
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