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
  SortDirection,
  ProductSalesSummary  // CORRECTION : Import correct
} from './types';
import { 
  formatLargeNumber,
  formatCurrency,
  formatPercentage,
  getMarginColorClass,
  getMarketShareColorClass
} from './utils';
// CORRECTION : Import depuis SalesTable/utils au lieu de ProductsMonthlyTable/utils
import { 
  filterProductSummaries, 
  sortProductSummaries, 
  paginateProductSummaries 
} from '../SalesTable/utils';

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

  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // CORRECTION : Utilisation des fonctions utilitaires de SalesTable
  const processedData = useMemo(() => {
    // 1. Filtrage
    const filteredData = filterProductSummaries<ProductSalesSummary>(
      productSummaries, 
      searchQuery
    );

    // 2. Tri
    const sortedData = sortProductSummaries<ProductSalesSummary>(
      filteredData,
      sortConfig
    );

    // 3. Pagination
    return paginateProductSummaries<ProductSalesSummary>(
      sortedData,
      currentPage,
      itemsPerPage
    );
  }, [productSummaries, searchQuery, sortConfig, currentPage, itemsPerPage]);

  // Helper pour icônes de tri
  const getSortIcon = (column: SalesSortableColumn) => {
    if (sortConfig.column !== column) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Gestion pages
  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(processedData.pagination.totalPages, prev + 1));
  }, [processedData.pagination.totalPages]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  // Rendu conditionnel
  if (isLoading) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Chargement des données ventes...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-sm">⚠</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Erreur de chargement</p>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            iconLeft={<RotateCcw className="w-4 h-4" />}
          >
            Réessayer
          </Button>
        </div>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Aucune donnée de ventes</h3>
          <p className="text-sm text-gray-600">
            Sélectionnez une période et des filtres pour afficher les données de ventes.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Tableau des ventes détaillé
          </h2>
          <Badge variant="gray">
            {processedData.pagination.totalItems} produit{processedData.pagination.totalItems !== 1 ? 's' : ''}
          </Badge>
          {queryTime > 0 && (
            <Badge variant="gray">
              {queryTime}ms
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <SearchBar
            placeholder="Rechercher un produit..."
            onSearch={handleSearchChange}
            className="w-80"
          />
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            iconLeft={<RotateCcw className="w-4 h-4" />}
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* Tableau */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('nom')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-gray-900"
                  >
                    <span>Produit</span>
                    <span className="text-gray-400">{getSortIcon('nom')}</span>
                  </button>
                </th>
                
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('code_ean')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-gray-900"
                  >
                    <span>Code</span>
                    <span className="text-gray-400">{getSortIcon('code_ean')}</span>
                  </button>
                </th>
                
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('quantite_vendue')}
                    className="flex items-center justify-end space-x-1 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-gray-900 w-full"
                  >
                    <span>Qté vendue</span>
                    <span className="text-gray-400">{getSortIcon('quantite_vendue')}</span>
                  </button>
                </th>
                
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('prix_achat_moyen')}
                    className="flex items-center justify-end space-x-1 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-gray-900 w-full"
                  >
                    <span>Prix achat</span>
                    <span className="text-gray-400">{getSortIcon('prix_achat_moyen')}</span>
                  </button>
                </th>
                
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('prix_vente_moyen')}
                    className="flex items-center justify-end space-x-1 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-gray-900 w-full"
                  >
                    <span>Prix vente</span>
                    <span className="text-gray-400">{getSortIcon('prix_vente_moyen')}</span>
                  </button>
                </th>
                
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('taux_marge_moyen')}
                    className="flex items-center justify-end space-x-1 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-gray-900 w-full"
                  >
                    <span>Taux marge</span>
                    <span className="text-gray-400">{getSortIcon('taux_marge_moyen')}</span>
                  </button>
                </th>
                
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('part_marche_quantite_pct')}
                    className="flex items-center justify-end space-x-1 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-gray-900 w-full"
                  >
                    <span>Part marché Qté</span>
                    <span className="text-gray-400">{getSortIcon('part_marche_quantite_pct')}</span>
                  </button>
                </th>
                
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('part_marche_marge_pct')}
                    className="flex items-center justify-end space-x-1 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-gray-900 w-full"
                  >
                    <span>Part marché Marge</span>
                    <span className="text-gray-400">{getSortIcon('part_marche_marge_pct')}</span>
                  </button>
                </th>
                
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {processedData.products.map((product) => {
                const salesDetails = getSalesDetails(product.code_ean);
                const hasDetailData = salesDetails.length > 0;
                const isExpanded = expandedProducts.has(product.code_ean);

                return (
                  <React.Fragment key={product.code_ean}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      
                      {/* Bouton expansion */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() => hasDetailData && toggleProductExpansion(product.code_ean)}
                          className={`p-1 rounded ${
                            hasDetailData
                              ? 'hover:bg-gray-200 text-gray-600 hover:text-gray-900' 
                              : 'opacity-50 cursor-not-allowed text-gray-400'
                          }`}
                          title={hasDetailData ? 'Voir évolution temporelle' : 'Pas de détails disponibles'}
                        >
                          {hasDetailData ? (
                            isExpanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />
                          ) : (
                            <div className="w-4 h-4"></div>
                          )}
                        </button>
                      </td>
                      
                      {/* Colonnes données */}
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900 max-w-xs truncate">
                          {product.nom}
                        </div>
                      </td>
                      
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600 font-mono">
                          {product.code_ean}
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 text-right">
                        <div className="font-medium text-gray-900">
                          {formatLargeNumber(product.quantite_vendue)}
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 text-right">
                        <div className="text-gray-900">
                          {formatCurrency(product.prix_achat_moyen)}
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(product.prix_vente_moyen)}
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 text-right">
                        <div 
                          className={`px-2 py-1 text-xs font-medium rounded-full inline-flex ${getMarginColorClass(product.taux_marge_moyen)}`}
                        >
                          {formatPercentage(product.taux_marge_moyen)}
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 text-right">
                        <div 
                          className={`px-2 py-1 text-xs font-medium rounded-full inline-flex ${getMarketShareColorClass(product.part_marche_quantite_pct)}`}
                        >
                          {formatPercentage(product.part_marche_quantite_pct)}
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 text-right">
                        <div 
                          className={`px-2 py-1 text-xs font-medium rounded-full inline-flex ${getMarketShareColorClass(product.part_marche_marge_pct)}`}
                        >
                          {formatPercentage(product.part_marche_marge_pct)}
                        </div>
                      </td>
                      
                    </tr>
                    
                    {/* Ligne expansion avec graphique */}
                    {isExpanded && hasDetailData && (
                      <tr>
                        <td colSpan={9} className="p-0 relative">
                          <div className="absolute left-0 right-0 bg-gray-50 border-t border-gray-200 z-10">
                            <div className="p-6">
                              <SalesProductChart
                                salesDetails={salesDetails}
                                productName={product.nom}
                              />
                            </div>
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

      {/* Pagination */}
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