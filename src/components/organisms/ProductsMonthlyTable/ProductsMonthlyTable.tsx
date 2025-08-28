// src/components/organisms/ProductsMonthlyTable/ProductsMonthlyTable.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, RotateCcw, Search, Eye, Settings } from 'lucide-react';
import { SearchBar } from '@/components/molecules/SearchBar/SearchBar';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { Badge } from '@/components/atoms/Badge/Badge';
import { ProductMonthlyChart } from '../ProductMonthlyChart/ProductMonthlyChart';
import { useProductsMonthlyDetails } from '@/hooks/products/useProductsMonthlyDetails';
import { 
  formatLargeNumber, 
  formatCurrency, 
  formatPercentage, 
  getMarginColorClass, 
  getStockColorClass,
  filterProductSummaries,
  paginateProductSummaries,
  sortProductSummaries,
  type SortableColumn,
  type SortDirection
} from './utils';

interface SortConfig {
  column: SortableColumn | null;
  direction: SortDirection;
}

interface ProductsMonthlyTableProps {
  readonly className?: string;
  readonly onRefresh?: () => void;
}

/**
 * ProductsMonthlyTable - Tableau avec gestion stock idéal et commandes
 */
export const ProductsMonthlyTable: React.FC<ProductsMonthlyTableProps> = ({
  className = '',
  onRefresh
}) => {
  // États locaux
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'quantite_vendue_total',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  // État local pour stock idéal (60 jours par défaut)
  const [joursStockIdeal, setJoursStockIdeal] = useState(60);
  const [showStockSettings, setShowStockSettings] = useState(false);
  
  const itemsPerPage = 50;

  // Hook principal
  const { 
    productSummaries, 
    getMonthlyDetails, 
    isLoading, 
    error, 
    refetch, 
    queryTime,
    hasData 
  } = useProductsMonthlyDetails({ enabled: true });

  // Calculs stock idéal et commandes avec données 12 mois
  const enhancedProductSummaries = useMemo(() => {
    return productSummaries.map(product => {
      // Ventes moyennes quotidiennes sur 12 mois
      const ventesQuotidiennesMoyennes = product.quantite_vendue_total / 365;
      
      // Stock idéal = ventes quotidiennes × jours stock idéal
      const stockIdeal = Math.round(ventesQuotidiennesMoyennes * joursStockIdeal);
      
      // Quantité à commander = stock idéal - stock actuel (minimum 0)
      const quantiteACommander = Math.max(0, stockIdeal - product.quantite_stock_actuel);
      
      // Écart vs stock moyen = stock idéal - stock moyen
      const ecartVsStockMoyen = stockIdeal - product.quantite_stock_moyenne;
      
      return {
        ...product,
        stockIdeal,
        quantiteACommander,
        ecartVsStockMoyen,
        ventesQuotidiennesMoyennes
      };
    });
  }, [productSummaries, joursStockIdeal]);

  // Gestion expansion/collapse produits
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

  // Gestion du tri simplifié (asc → desc → asc)
  const handleSort = useCallback((column: SortableColumn) => {
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

  // Gestion recherche
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  // Traitement des données avec nouvelles colonnes
  const processedData = useMemo(() => {
    const filteredProducts = filterProductSummaries(enhancedProductSummaries, searchQuery);
    const sortedProducts = sortProductSummaries(
      filteredProducts, 
      sortConfig.column || 'quantite_vendue_total',
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
  }, [enhancedProductSummaries, searchQuery, sortConfig, currentPage]);

  // Handlers pagination
  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(processedData.pagination.totalPages, prev + 1));
  }, [processedData.pagination.totalPages]);

  // Handler refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // Indicateur tri pour header
  const getSortIndicator = (column: SortableColumn) => {
    if (sortConfig.column !== column) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Couleur pour stock vs idéal
  const getStockIdealColorClass = (stockActuel: number, stockIdeal: number): string => {
    return stockActuel >= stockIdeal 
      ? 'text-green-700 bg-green-50' 
      : 'text-red-700 bg-red-50';
  };

  // Rendu conditionnel - Loading, Error, No Data (identique)
  if (isLoading) {
    return (
      <Card variant="elevated" className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="elevated" className={`p-6 text-center ${className}`}>
        <div className="text-red-500 mb-4">
          <Search className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="primary" size="sm" onClick={handleRefresh} iconLeft={<RotateCcw className="w-4 h-4" />}>
          Réessayer
        </Button>
      </Card>
    );
  }

  if (!hasData || processedData.products.length === 0) {
    return (
      <Card variant="elevated" className={`p-6 text-center ${className}`}>
        <div className="text-gray-400 mb-4">
          <Search className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {searchQuery ? 'Aucun produit trouvé' : 'Aucune donnée disponible'}
        </h3>
        <p className="text-gray-600 mb-4">
          {searchQuery 
            ? `Aucun résultat pour "${searchQuery}". Modifiez votre recherche.`
            : 'Sélectionnez des filtres pour voir les détails mensuels des produits.'
          }
        </p>
        {searchQuery && (
          <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
            Effacer la recherche
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Header avec contrôles et paramètres stock */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Détails mensuels produits avec gestion stock
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{processedData.pagination.totalItems} produits</span>
              <Badge variant="gray" size="sm">{queryTime}ms</Badge>
              <Badge variant="blue" size="sm">{joursStockIdeal}j stock idéal</Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStockSettings(!showStockSettings)}
              iconLeft={<Settings className="w-4 h-4" />}
              className="text-gray-600 hover:text-gray-900"
            >
              Stock idéal
            </Button>
            
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
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Paramètres stock idéal */}
          {showStockSettings && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <label className="text-sm font-medium text-blue-900">Jours stock idéal:</label>
              <input
                type="number"
                min="1"
                max="365"
                value={joursStockIdeal}
                onChange={(e) => setJoursStockIdeal(Math.max(1, parseInt(e.target.value) || 60))}
                className="w-16 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-blue-700">jours</span>
            </div>
          )}
          
          <SearchBar
            onSearch={handleSearch}
            placeholder="Rechercher par nom, code EAN ou *fin_code..."
          />
        </div>
      </div>

      {/* Tableau principal avec nouvelles colonnes */}
      <Card variant="elevated" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            
            {/* Header tableau avec nouvelles colonnes */}
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('nom')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Produit</span>
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
                  onClick={() => handleSort('quantite_vendue_total')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Qté vendue 12M</span>
                    <span className="text-gray-400">{getSortIndicator('quantite_vendue_total')}</span>
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
                    <span>Marge moy.</span>
                    <span className="text-gray-400">{getSortIndicator('taux_marge_moyen')}</span>
                  </div>
                </th>
                
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('quantite_stock_moyenne')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Stock moy.</span>
                    <span className="text-gray-400">{getSortIndicator('quantite_stock_moyenne')}</span>
                  </div>
                </th>
                
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('quantite_stock_actuel')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Stock actuel</span>
                    <span className="text-gray-400">{getSortIndicator('quantite_stock_actuel')}</span>
                  </div>
                </th>
                
                {/* NOUVELLES COLONNES */}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qté à commander
                </th>
                
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Écart vs moy.
                </th>
                
                <th className="w-16 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Détails
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100">
              {processedData.products.map((product, index) => {
                const isExpanded = expandedProducts.has(product.code_ean);
                const monthlyDetails = getMonthlyDetails(product.code_ean);
                const hasMonthlyData = monthlyDetails.length > 0;
                
                return (
                  <React.Fragment key={product.code_ean}>
                    
                    {/* Ligne principale produit avec nouvelles colonnes */}
                    <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'} hover:bg-gray-50 transition-colors`}>
                      
                      {/* Nom produit */}
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={product.nom}>
                          {product.nom}
                        </div>
                      </td>
                      
                      {/* Code EAN */}
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 font-mono">
                          {product.code_ean}
                        </div>
                      </td>
                      
                      {/* Quantité vendue totale */}
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatLargeNumber(product.quantite_vendue_total)}
                        </div>
                      </td>
                      
                      {/* Prix achat moyen */}
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(product.prix_achat_moyen)}
                        </div>
                      </td>
                      
                      {/* Prix vente moyen */}
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(product.prix_vente_moyen)}
                        </div>
                      </td>
                      
                      {/* Taux marge moyen avec couleur */}
                      <td className="px-4 py-3 text-right">
                        <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getMarginColorClass(product.taux_marge_moyen)}`}>
                          {formatPercentage(product.taux_marge_moyen)}
                        </div>
                      </td>
                      
                      {/* Stock moyen */}
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm text-gray-900">
                          {formatLargeNumber(product.quantite_stock_moyenne)}
                        </div>
                      </td>
                      
                      {/* Stock actuel avec couleur vs stock idéal */}
                      <td className="px-4 py-3 text-right">
                        <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockIdealColorClass(product.quantite_stock_actuel, product.stockIdeal)}`}>
                          {formatLargeNumber(product.quantite_stock_actuel)}
                        </div>
                      </td>
                      
                      {/* NOUVELLE COLONNE: Quantité à commander */}
                      <td className="px-4 py-3 text-right">
                        <div className={`text-sm font-medium ${product.quantiteACommander > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {product.quantiteACommander > 0 ? formatLargeNumber(product.quantiteACommander) : '0'}
                        </div>
                      </td>
                      
                      {/* NOUVELLE COLONNE: Écart vs stock moyen */}
                      <td className="px-4 py-3 text-right">
                        <div className={`text-sm font-medium ${product.ecartVsStockMoyen >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.ecartVsStockMoyen >= 0 ? '+' : ''}{formatLargeNumber(product.ecartVsStockMoyen)}
                        </div>
                      </td>
                      
                      {/* Toggle expansion à droite */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleProductExpansion(product.code_ean)}
                          disabled={!hasMonthlyData}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                            hasMonthlyData 
                              ? 'hover:bg-gray-200 text-gray-600 hover:text-gray-900' 
                              : 'opacity-50 cursor-not-allowed text-gray-400'
                          }`}
                          title={hasMonthlyData ? 'Voir évolution mensuelle' : 'Pas de détails disponibles'}
                        >
                          {hasMonthlyData ? (
                            isExpanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />
                          ) : (
                            <div className="w-4 h-4"></div>
                          )}
                        </button>
                      </td>
                      
                    </tr>
                    
                    {/* Ligne expansion avec graphique */}
                    {isExpanded && hasMonthlyData && (
                      <tr>
                        <td colSpan={11} className="px-0 py-0 bg-gray-25">
                          <div className="border-t border-gray-200 p-6">
                            <ProductMonthlyChart
                              monthlyDetails={monthlyDetails}
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