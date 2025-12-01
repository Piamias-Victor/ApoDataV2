// src/components/organisms/ProductsMonthlyTable/ProductsMonthlyTable.tsx (IMPROVED avec Export)
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronLeft, ChevronRight, RotateCcw, Search, Eye } from 'lucide-react';
import { SearchBar } from '@/components/molecules/SearchBar/SearchBar';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { Badge } from '@/components/atoms/Badge/Badge';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { ProductMonthlyChart } from '../ProductMonthlyChart/ProductMonthlyChart';
import { useProductsMonthlyDetails } from '@/hooks/products/useProductsMonthlyDetails';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { CsvExporter } from '@/utils/export/csvExporter';
import {
  formatLargeNumber,
  formatCurrency,
  formatPercentage,
  getMarginColorClass,
  filterProductSummaries,
  paginateProductSummaries,
  sortProductSummaries,
  type SortableColumn,
  type SortDirection,
  type EnhancedProductSummary
} from './utils';

interface SortConfig {
  column: SortableColumn | null;
  direction: SortDirection;
}

interface ProductsMonthlyTableProps {
  readonly className?: string;
  readonly onRefresh?: () => void;
}

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

  // État local pour stock idéal (60 jours par défaut) - TOUJOURS VISIBLE
  const [joursStockIdeal, setJoursStockIdeal] = useState(60);

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

  // Hook export CSV
  const { exportToCsv, isExporting } = useExportCsv();

  // Calculs stock idéal et commandes avec données 12 mois
  const enhancedProductSummaries: EnhancedProductSummary[] = useMemo(() => {
    return productSummaries.map(product => {
      const ventesQuotidiennesMoyennes = product.quantite_vendue_total / 365;
      const stockIdeal = Math.round(ventesQuotidiennesMoyennes * joursStockIdeal);
      const quantiteACommander = Math.max(0, stockIdeal - product.quantite_stock_actuel);
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

  // Préparation données pour export CSV
  const prepareMonthlyDataForExport = useCallback(() => {
    if (!enhancedProductSummaries || enhancedProductSummaries.length === 0) return [];

    const exportData = [];

    // En-tête avec informations générales
    exportData.push({
      'Produit': 'INFORMATIONS GÉNÉRALES',
      'Code EAN': '',
      'Recherche': searchQuery || 'Toutes',
      'Tri Actuel': sortConfig.column ? `${sortConfig.column} (${sortConfig.direction})` : 'Aucun',
      'Page Actuelle': currentPage.toString(),
      'Total Produits': enhancedProductSummaries.length.toString(),
      'Jours Stock Idéal': joursStockIdeal.toString(),
      'Temps de Requête (ms)': queryTime.toString(),
      'Qté Vendue 12M': '',
      'Prix Achat Moyen (€)': '',
      'Prix Vente Moyen (€)': '',
      'Taux Marge Moyen (%)': '',
      'Stock Moyen': '',
      'Montant Stock Moyen (€)': '',
      'Stock Actuel': '',
      'Montant Stock Actuel (€)': '',
      'Stock Idéal Calculé': '',
      'Qté à Commander': '',
      'Écart vs Stock Moyen': '',
      'Ventes Quotidiennes Moy.': '',
      'Montant Ventes 12M (€)': '',
      'Montant Marge 12M (€)': '',
      'Ratio Stock/Ventes (%)': '',
      'Jours de Stock Actuels': ''
    });

    // Ligne de séparation
    exportData.push({
      'Produit': '--- DONNÉES PRODUITS MENSUELS ---',
      'Code EAN': '',
      'Recherche': '',
      'Tri Actuel': '',
      'Page Actuelle': '',
      'Total Produits': '',
      'Jours Stock Idéal': '',
      'Temps de Requête (ms)': '',
      'Qté Vendue 12M': '',
      'Prix Achat Moyen (€)': '',
      'Prix Vente Moyen (€)': '',
      'Taux Marge Moyen (%)': '',
      'Stock Moyen': '',
      'Montant Stock Moyen (€)': '',
      'Stock Actuel': '',
      'Montant Stock Actuel (€)': '',
      'Stock Idéal Calculé': '',
      'Qté à Commander': '',
      'Écart vs Stock Moyen': '',
      'Ventes Quotidiennes Moy.': '',
      'Montant Ventes 12M (€)': '',
      'Montant Marge 12M (€)': '',
      'Ratio Stock/Ventes (%)': '',
      'Jours de Stock Actuels': ''
    });

    // Export de tous les produits avec calculs avancés
    enhancedProductSummaries.forEach(product => {
      // Calculs additionnels pour export
      const montantVentes12M = product.quantite_vendue_total * product.prix_vente_moyen;
      const montantMarge12M = montantVentes12M - (product.quantite_vendue_total * product.prix_achat_moyen);
      const ratioStockVentes = product.quantite_vendue_total > 0
        ? (product.quantite_stock_actuel / product.quantite_vendue_total) * 100
        : 0;
      const joursStockActuels = product.ventesQuotidiennesMoyennes > 0
        ? product.quantite_stock_actuel / product.ventesQuotidiennesMoyennes
        : 0;

      // ✅ Calculs montants stock (quantité × prix achat moyen)
      const montantStockMoyen = product.quantite_stock_moyenne * product.prix_achat_moyen;
      const montantStockActuel = product.quantite_stock_actuel * product.prix_achat_moyen;

      exportData.push({
        'Produit': product.nom,
        'Code EAN': product.code_ean,
        'Recherche': searchQuery || 'Toutes',
        'Tri Actuel': sortConfig.column ? `${sortConfig.column} (${sortConfig.direction})` : 'Aucun',
        'Page Actuelle': currentPage.toString(),
        'Total Produits': enhancedProductSummaries.length.toString(),
        'Jours Stock Idéal': joursStockIdeal.toString(),
        'Temps de Requête (ms)': queryTime.toString(),
        'Qté Vendue 12M': product.quantite_vendue_total.toString(),
        'Prix Achat Moyen (€)': product.prix_achat_moyen.toFixed(2),
        'Prix Vente Moyen (€)': product.prix_vente_moyen.toFixed(2),
        'Taux Marge Moyen (%)': product.taux_marge_moyen.toFixed(2),
        'Stock Moyen': product.quantite_stock_moyenne.toString(),
        'Montant Stock Moyen (€)': montantStockMoyen.toFixed(2),
        'Stock Actuel': product.quantite_stock_actuel.toString(),
        'Montant Stock Actuel (€)': montantStockActuel.toFixed(2),
        'Stock Idéal Calculé': product.stockIdeal.toString(),
        'Qté à Commander': product.quantiteACommander.toString(),
        'Écart vs Stock Moyen': product.ecartVsStockMoyen.toString(),
        'Ventes Quotidiennes Moy.': product.ventesQuotidiennesMoyennes.toFixed(2),
        'Montant Ventes 12M (€)': montantVentes12M.toFixed(2),
        'Montant Marge 12M (€)': montantMarge12M.toFixed(2),
        'Ratio Stock/Ventes (%)': ratioStockVentes.toFixed(2),
        'Jours de Stock Actuels': joursStockActuels.toFixed(1)
      });
    });

    return exportData;
  }, [enhancedProductSummaries, searchQuery, sortConfig, currentPage, joursStockIdeal, queryTime]);

  // Handler export avec vérification
  const handleExport = useCallback(() => {
    const exportData = prepareMonthlyDataForExport();

    if (exportData.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }

    const searchSuffix = searchQuery ? `_recherche_${searchQuery.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    const stockSuffix = `_stock${joursStockIdeal}j`;
    const filename = CsvExporter.generateFilename(`apodata_details_mensuels${searchSuffix}${stockSuffix}`);

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
  }, [prepareMonthlyDataForExport, exportToCsv, searchQuery, joursStockIdeal]);

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
  }, []);

  // Gestion recherche
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Traitement des données avec nouvelles colonnes
  const processedData = useMemo(() => {
    const filteredProducts = filterProductSummaries(enhancedProductSummaries, searchQuery);
    const sortedProducts = sortProductSummaries(
      filteredProducts,
      sortConfig.column || 'quantite_vendue_total',
      sortConfig.direction
    ) as EnhancedProductSummary[];
    const paginationResult = paginateProductSummaries(sortedProducts, currentPage, itemsPerPage);

    return {
      products: paginationResult.paginatedProducts as EnhancedProductSummary[],
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

  // Header avec bouton actualiser et export - TOUJOURS VISIBLE
  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Détails mensuels produits avec gestion stock
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
            disabled={!hasData || isLoading || enhancedProductSummaries.length === 0}
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
        {/* Paramètres stock idéal - compact */}
        <div className="flex items-center space-x-1 px-2 py-1 bg-gray-50 rounded border border-gray-200">
          <span className="text-xs text-gray-600 whitespace-nowrap">Stock idéal:</span>
          <input
            type="number"
            min="1"
            max="365"
            value={joursStockIdeal}
            onChange={(e) => setJoursStockIdeal(Math.max(1, parseInt(e.target.value) || 60))}
            className="w-12 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
          <span className="text-xs text-gray-500">jours</span>
        </div>

        <SearchBar
          onSearch={handleSearch}
          placeholder="Rechercher par nom, code EAN ou *fin_code..."
        />
      </div>
    </div>
  );

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

  // Rendu conditionnel - Loading
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
              : 'Sélectionnez des filtres pour voir les détails mensuels des produits.'
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

      {/* Header avec contrôles et paramètres stock TOUJOURS VISIBLE */}
      {renderHeader()}

      {/* Tableau principal avec nouvelles colonnes TRIABLES */}
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

                {/* NOUVELLES COLONNES TRIABLES */}
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('quantiteACommander')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Qté à commander</span>
                    <span className="text-gray-400">{getSortIndicator('quantiteACommander')}</span>
                  </div>
                </th>

                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('ecartVsStockMoyen')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Écart vs moy.</span>
                    <span className="text-gray-400">{getSortIndicator('ecartVsStockMoyen')}</span>
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
                const monthlyDetails = getMonthlyDetails(product.code_ean);
                const hasMonthlyData = monthlyDetails.length > 0;

                return (
                  <React.Fragment key={product.code_ean}>

                    {/* Ligne principale produit avec colonne Produit réduite */}
                    <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'} hover:bg-gray-50 transition-colors`}>

                      {/* Nom produit - FORCÉ À 64px avec div contrainte */}
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
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all ${hasMonthlyData
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

                    {/* Ligne expansion avec graphique - SORT DU TABLE LAYOUT */}
                    {isExpanded && hasMonthlyData && (
                      <tr>
                        <td colSpan={12} className="p-0 relative">
                          <div className="absolute left-0 right-0 bg-gray-50 border-t border-gray-200 z-10">
                            <div className="p-6">
                              <ProductMonthlyChart
                                monthlyDetails={monthlyDetails}
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