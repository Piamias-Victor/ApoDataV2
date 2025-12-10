// src/components/organisms/RupturesProductsTable/RupturesProductsTable.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronLeft, ChevronRight, RotateCcw, Search, Eye, AlertTriangle } from 'lucide-react';
import { SearchBar } from '@/components/molecules/SearchBar/SearchBar';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { RuptureDetailsChart } from '../RuptureDetailsChart/RuptureDetailsChart';
import { useRupturesProducts } from '@/hooks/dashboard/useRupturesProducts';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { CsvExporter } from '@/utils/export/csvExporter';

interface RupturesProductsTableProps {
  className?: string;
  onRefresh?: () => void;
}

type SortableColumn = 'nom' | 'code_ean' | 'quantite_vendue' | 'quantite_commandee' |
  'quantite_receptionnee' | 'delta_quantite' | 'taux_reception' |
  'prix_achat_moyen' | 'quantite_stock' | 'montant_delta';

interface SortConfig {
  column: SortableColumn;
  direction: 'asc' | 'desc';
}

const formatLargeNumber = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toFixed(0);
};

const formatCurrency = (value: number): string => {
  return `${value.toFixed(2)}€`;
};

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

const getDeltaColorClass = (delta: number): string => {
  if (delta === 0) return 'bg-green-50 text-green-700';
  if (Math.abs(delta) < 10) return 'bg-yellow-50 text-yellow-700';
  return 'bg-red-50 text-red-700';
};

const getReceptionColorClass = (taux: number): string => {
  if (taux >= 95) return 'bg-green-50 text-green-700';
  if (taux >= 85) return 'bg-yellow-50 text-yellow-700';
  return 'bg-red-50 text-red-700';
};

export const RupturesProductsTable: React.FC<RupturesProductsTableProps> = ({
  className = '',
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'delta_quantite',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 50;

  const {
    productSummaries,
    getRuptureDetails,
    isLoading,
    error,
    refetch,
    hasData
  } = useRupturesProducts();

  const { exportToCsv, isExporting } = useExportCsv();

  const processedData = useMemo(() => {
    let filtered = productSummaries;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = productSummaries.filter(product =>
        product.nom.toLowerCase().includes(query) ||
        product.code_ean.includes(query)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.column];
      const bValue = b[sortConfig.column];

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue);
      }

      const numA = aValue as number;
      const numB = bValue as number;

      return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = sorted.slice(startIndex, endIndex);

    return {
      products: paginated,
      pagination: {
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / itemsPerPage),
        currentPage,
        startIndex,
        endIndex: Math.min(endIndex, filtered.length)
      }
    };
  }, [productSummaries, searchQuery, sortConfig, currentPage, itemsPerPage]);

  const prepareCsvData = useCallback(() => {
    if (!productSummaries || productSummaries.length === 0) return [];

    const exportData = productSummaries.map(product => ({
      'Produit': product.nom,
      'Code EAN': product.code_ean,
      'Quantité Vendue': product.quantite_vendue.toString(),
      'Quantité Commandée': product.quantite_commandee.toString(),
      'Quantité Réceptionnée': product.quantite_receptionnee.toString(),
      'Stock Moyen': product.quantite_stock.toString(),
      'Delta Quantité': product.delta_quantite.toString(),
      'Taux Réception (%)': product.taux_reception.toFixed(2),
      'Prix Achat Moyen (€)': product.prix_achat_moyen.toFixed(2),
      'Montant Delta (€)': product.montant_delta.toFixed(2)
    }));

    return exportData;
  }, [productSummaries]);

  const handleExport = useCallback(() => {
    const exportData = prepareCsvData();

    if (exportData.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }

    const filename = CsvExporter.generateFilename('apodata_ruptures_produits');

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
  }, [prepareCsvData, exportToCsv]);

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

  const handleSort = useCallback((column: SortableColumn) => {
    setSortConfig(prev => {
      if (prev.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { column, direction: 'desc' };
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  const getSortIndicator = (column: SortableColumn) => {
    if (sortConfig.column !== column) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
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
        <Card variant="elevated" className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!hasData || processedData.products.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card variant="elevated" className="p-6 text-center">
          <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? 'Aucun produit trouvé' : 'Aucune donnée disponible'}
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? `Aucun résultat pour "${searchQuery}"`
              : 'Sélectionnez des filtres pour voir les données.'
            }
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Analyse des ruptures par produit
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{processedData.pagination.totalItems} produits</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ExportButton
              onClick={handleExport}
              isExporting={isExporting}
              disabled={!hasData || isLoading}
              label="Export CSV"
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              iconLeft={<RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Actualiser
            </Button>
          </div>
        </div>

        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Rechercher par nom ou code EAN..."
        />
      </div>

      <Card variant="elevated" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('nom')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Produit</span>
                    <span className="text-gray-400">{getSortIndicator('nom')}</span>
                  </div>
                </th>

                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('code_ean')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Code EAN</span>
                    <span className="text-gray-400">{getSortIndicator('code_ean')}</span>
                  </div>
                </th>

                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantite_vendue')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Qté vendue</span>
                    <span className="text-gray-400">{getSortIndicator('quantite_vendue')}</span>
                  </div>
                </th>

                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantite_commandee')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Qté commandée</span>
                    <span className="text-gray-400">{getSortIndicator('quantite_commandee')}</span>
                  </div>
                </th>

                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantite_receptionnee')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Qté réceptionnée</span>
                    <span className="text-gray-400">{getSortIndicator('quantite_receptionnee')}</span>
                  </div>
                </th>

                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('delta_quantite')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Delta Qté</span>
                    <span className="text-gray-400">{getSortIndicator('delta_quantite')}</span>
                  </div>
                </th>

                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('taux_reception')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Taux réception</span>
                    <span className="text-gray-400">{getSortIndicator('taux_reception')}</span>
                  </div>
                </th>

                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('prix_achat_moyen')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Prix achat moy.</span>
                    <span className="text-gray-400">{getSortIndicator('prix_achat_moyen')}</span>
                  </div>
                </th>

                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantite_stock')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Stock moy.</span>
                    <span className="text-gray-400">{getSortIndicator('quantite_stock')}</span>
                  </div>
                </th>

                <th className="w-16 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Détails
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {processedData.products.map((product, index) => {
                const ruptureDetails = getRuptureDetails(product.code_ean);
                const hasDetailData = ruptureDetails.length > 0;
                const isExpanded = expandedProducts.has(product.code_ean);

                return (
                  <React.Fragment key={product.code_ean}>
                    <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'} hover:bg-gray-50 transition-colors`}>
                      <td className="px-4 py-3">
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
                          {formatLargeNumber(product.quantite_commandee)}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="text-sm text-gray-900">
                          {formatLargeNumber(product.quantite_receptionnee)}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDeltaColorClass(product.delta_quantite)}`}>
                          {product.delta_quantite > 0 ? '-' : ''}{Math.abs(product.delta_quantite)}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getReceptionColorClass(product.taux_reception)}`}>
                          {formatPercentage(product.taux_reception)}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(product.prix_achat_moyen)}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="text-sm text-gray-900">
                          {formatLargeNumber(product.quantite_stock)}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleProductExpansion(product.code_ean)}
                          disabled={!hasDetailData}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all ${hasDetailData
                            ? 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                            : 'opacity-50 cursor-not-allowed text-gray-400'
                            }`}
                        >
                          {hasDetailData ? (
                            isExpanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />
                          ) : (
                            <div className="w-4 h-4"></div>
                          )}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && hasDetailData && (
                      <tr>
                        <td colSpan={10} className="p-0">
                          <div className="bg-gray-50 border-t border-gray-200 p-6">
                            <RuptureDetailsChart
                              ruptureDetails={ruptureDetails}
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
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
              onClick={() => setCurrentPage(prev => Math.min(processedData.pagination.totalPages, prev + 1))}
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