// src/components/organisms/SalesTable/SalesTable.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronLeft, ChevronRight, RotateCcw, Search, Eye } from 'lucide-react';
import { SearchBar } from '@/components/molecules/SearchBar/SearchBar';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { Badge } from '@/components/atoms/Badge/Badge';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { SalesProductChart } from '../SalesProductChart/SalesProductChart';
import { useSalesProducts } from '@/hooks/dashboard/useSalesProducts';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { CsvExporter } from '@/utils/export/csvExporter';
import { 
  formatLargeNumber, 
  formatCurrency, 
  formatPercentage, 
  getMarginColorClass,
  getMarketShareColorClass,
  processProductSummaries
} from './utils';
import type { 
  SalesTableProps,
  SalesSortConfig,
  SalesSortableColumn,
  SortDirection
} from './types';

/**
 * SalesTable - Tableau des ventes avec design identique à ProductsMonthlyTable
 * Avec export CSV intégré
 * 
 * Architecture complète : recherche, tri, pagination, expansion graphique, export CSV
 */
export const SalesTable: React.FC<SalesTableProps> = ({
  className = '',
  onRefresh
}) => {
  // États locaux
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SalesSortConfig>({
    column: 'quantite_vendue',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 50;

  // Hook principal - utilise automatiquement les filtres du store
  const { 
    productSummaries, 
    getSalesDetails, 
    isLoading, 
    error, 
    refetch, 
    queryTime,
    hasData 
  } = useSalesProducts();

  // Hook export CSV
  const { exportToCsv, isExporting } = useExportCsv();

  // Traitement données avec filtrage, tri, pagination
  const processedData = useMemo(() => {
    return processProductSummaries(
      productSummaries,
      searchQuery,
      sortConfig,
      currentPage,
      itemsPerPage
    );
  }, [productSummaries, searchQuery, sortConfig, currentPage, itemsPerPage]);

  // Préparation données pour export CSV
  const prepareSalesDataForExport = useCallback(() => {
    if (!productSummaries || productSummaries.length === 0) return [];
    
    const exportData = [];
    
    // En-tête avec informations générales
    exportData.push({
      'Produit': 'INFORMATIONS GÉNÉRALES',
      'Code EAN': '',
      'Quantité Recherche': searchQuery || 'Toutes',
      'Tri Actuel': sortConfig.column ? `${sortConfig.column} (${sortConfig.direction})` : 'Aucun',
      'Page Actuelle': currentPage.toString(),
      'Total Produits': productSummaries.length.toString(),
      'Temps de Requête (ms)': queryTime.toString(),
      'Quantité Vendue': '',
      'Prix Achat Moyen (€)': '',
      'Prix Vente Moyen (€)': '',
      'Taux Marge Moyen (%)': '',
      'Part Marché Qté (%)': '',
      'Part Marché Marge (%)': '',
      'Montant TTC (€)': '',
      'Montant Marge (€)': ''
    });

    // Ligne de séparation
    exportData.push({
      'Produit': '--- DONNÉES PRODUITS ---',
      'Code EAN': '',
      'Quantité Recherche': '',
      'Tri Actuel': '',
      'Page Actuelle': '',
      'Total Produits': '',
      'Temps de Requête (ms)': '',
      'Quantité Vendue': '',
      'Prix Achat Moyen (€)': '',
      'Prix Vente Moyen (€)': '',
      'Taux Marge Moyen (%)': '',
      'Part Marché Qté (%)': '',
      'Part Marché Marge (%)': '',
      'Montant TTC (€)': '',
      'Montant Marge (€)': ''
    });
    
    // Export de tous les produits (pas seulement la page actuelle pour un export complet)
    productSummaries.forEach(product => {
      exportData.push({
        'Produit': product.nom,
        'Code EAN': product.code_ean,
        'Quantité Recherche': searchQuery || 'Toutes',
        'Tri Actuel': sortConfig.column ? `${sortConfig.column} (${sortConfig.direction})` : 'Aucun',
        'Page Actuelle': currentPage.toString(),
        'Total Produits': productSummaries.length.toString(),
        'Temps de Requête (ms)': queryTime.toString(),
        'Quantité Vendue': product.quantite_vendue.toString(),
        'Prix Achat Moyen (€)': product.prix_achat_moyen.toFixed(2),
        'Prix Vente Moyen (€)': product.prix_vente_moyen.toFixed(2),
        'Taux Marge Moyen (%)': product.taux_marge_moyen.toFixed(2),
        'Part Marché Qté (%)': product.part_marche_quantite_pct.toFixed(2),
        'Part Marché Marge (%)': product.part_marche_marge_pct.toFixed(2),
        'Montant TTC (€)': product.montant_ventes_ttc.toFixed(2),
        'Montant Marge (€)': product.montant_marge_total.toFixed(2)
      });
    });
    
    return exportData;
  }, [productSummaries, searchQuery, sortConfig, currentPage, queryTime]);

  // Handler export avec vérification
  const handleExport = useCallback(() => {
    const exportData = prepareSalesDataForExport();
    
    if (exportData.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }
    
    const searchSuffix = searchQuery ? `_recherche_${searchQuery.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    const filename = CsvExporter.generateFilename(`apodata_tableau_ventes${searchSuffix}`);
    
    // Vérification que le premier élément existe avant d'obtenir les headers
    if (!exportData[0]) {
      console.error('Données export invalides');
      return;
    }
    
    const headers = Object.keys(exportData[0]);
    
    exportToCsv({
      filename,
      headers,
      data: exportData
    });
  }, [prepareSalesDataForExport, exportToCsv, searchQuery]);

  // Handlers
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
  }, []);

  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(processedData.pagination.totalPages, prev + 1));
  }, [processedData.pagination.totalPages]);

  // Helper pour icônes de tri
  const getSortIndicator = (column: SalesSortableColumn) => {
    if (sortConfig.column !== column) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Header avec bouton actualiser et export - TOUJOURS VISIBLE
  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Tableau des ventes avec expansion détails
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>{hasData && processedData ? processedData.pagination.totalItems : 0} produits</span>
            <Badge variant="gray" size="sm">{queryTime}ms</Badge>
          </div>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex items-center space-x-2">
          <ExportButton
            onClick={handleExport}
            isExporting={isExporting}
            disabled={!hasData || isLoading || productSummaries.length === 0}
            label="Export CSV"
          />
          
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
        <SearchBar
          onSearch={handleSearch}
          placeholder="Rechercher par nom, code EAN ou *fin_code..."
        />
      </div>
    </div>
  );

  // Rendu conditionnel - Loading (identique à ProductsMonthlyTable)
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

  // Rendu conditionnel - Error
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

  // Rendu conditionnel - No Data
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
              : 'Sélectionnez des filtres pour voir les données de ventes.'
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
      
      {/* Header avec contrôles TOUJOURS VISIBLE */}
      {renderHeader()}

      {/* Tableau principal avec design identique à ProductsMonthlyTable */}
      <Card variant="elevated" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            
            {/* Header tableau avec colonnes triables */}
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="w-16 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
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
                  onClick={() => handleSort('quantite_vendue')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Qté vendue</span>
                    <span className="text-gray-400">{getSortIndicator('quantite_vendue')}</span>
                  </div>
                </th>
                
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Évolution
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
                  onClick={() => handleSort('part_marche_quantite_pct')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Part marché Qté</span>
                    <span className="text-gray-400">{getSortIndicator('part_marche_quantite_pct')}</span>
                  </div>
                </th>
                
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('part_marche_marge_pct')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Part marché Marge</span>
                    <span className="text-gray-400">{getSortIndicator('part_marche_marge_pct')}</span>
                  </div>
                </th>
                
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('montant_ventes_ttc')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Montant TTC</span>
                    <span className="text-gray-400">{getSortIndicator('montant_ventes_ttc')}</span>
                  </div>
                </th>
                
                <th className="w-16 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Détails
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100">
              {processedData.products.map((product, index) => {
                const salesDetails = getSalesDetails(product.code_ean);
                const hasDetailData = salesDetails.length > 0;
                const isExpanded = expandedProducts.has(product.code_ean);

                return (
                  <React.Fragment key={product.code_ean}>
                    
                    {/* Ligne principale produit avec alternance couleurs */}
                    <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'} hover:bg-gray-50 transition-colors`}>
                      
                      {/* Nom produit - FORCÉ À largeur réduite avec div contrainte */}
                      <td className="px-1 py-3">
                        <div className="text-xs font-medium text-gray-900 truncate w-32 overflow-hidden" title={product.nom}>
                          {product.nom}
                        </div>
                      </td>
                      
                      {/* Code EAN */}
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 font-mono">
                          {product.code_ean}
                        </div>
                      </td>
                      
                      {/* Quantité vendue */}
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatLargeNumber(product.quantite_vendue)}
                        </div>
                      </td>
                      
                      {/* Évolution */}
                      <td className="px-4 py-3 text-right">
                        {(() => {
                          if (product.quantite_vendue_comparison === null || product.quantite_vendue_comparison === undefined) {
                            return <span className="text-xs text-gray-400">-</span>;
                          }
                          
                          if (product.quantite_vendue_comparison === 0) {
                            return <span className="text-xs font-semibold text-blue-600">Nouveau</span>;
                          }
                          
                          const evolution = ((product.quantite_vendue - product.quantite_vendue_comparison) / product.quantite_vendue_comparison) * 100;
                          const colorClass = evolution > 0 ? 'text-green-600' : evolution < 0 ? 'text-red-600' : 'text-gray-700';
                          
                          return (
                            <span className={`text-sm font-semibold ${colorClass}`}>
                              {evolution > 0 ? '+' : ''}{evolution.toFixed(1)}%
                            </span>
                          );
                        })()}
                      </td>
                      
                      {/* Prix achat */}
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(product.prix_achat_moyen)}
                        </div>
                      </td>
                      
                      {/* Prix vente */}
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(product.prix_vente_moyen)}
                        </div>
                      </td>
                      
                      {/* Taux marge avec couleur */}
                      <td className="px-4 py-3 text-right">
                        <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getMarginColorClass(product.taux_marge_moyen)}`}>
                          {formatPercentage(product.taux_marge_moyen)}
                        </div>
                      </td>
                      
                      {/* Part marché quantité */}
                      <td className="px-4 py-3 text-right">
                        <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getMarketShareColorClass(product.part_marche_quantite_pct)}`}>
                          {formatPercentage(product.part_marche_quantite_pct)}
                        </div>
                      </td>
                      
                      {/* Part marché marge */}
                      <td className="px-4 py-3 text-right">
                        <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getMarketShareColorClass(product.part_marche_marge_pct)}`}>
                          {formatPercentage(product.part_marche_marge_pct)}
                        </div>
                      </td>
                      
                      {/* Montant TTC */}
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(product.montant_ventes_ttc)}
                        </div>
                      </td>
                      
                      {/* Toggle expansion à droite */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleProductExpansion(product.code_ean)}
                          disabled={!hasDetailData}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
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
                      
                    </tr>
                    
                    {/* Ligne expansion avec graphique - SORT DU TABLE LAYOUT */}
                    {isExpanded && hasDetailData && (
                      <tr>
                        <td colSpan={12} className="p-0 relative">
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