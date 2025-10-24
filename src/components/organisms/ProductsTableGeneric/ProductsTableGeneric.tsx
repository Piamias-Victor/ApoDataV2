// src/components/organisms/ProductsTableGeneric/ProductsTableGeneric.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, RotateCcw, Search, Database } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { useGenericProductsList } from '@/hooks/generic-groups/useGenericProductsList';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { CsvExporter } from '@/utils/export/csvExporter';

interface ProductsTableGenericProps {
  readonly productCodes: string[];
  readonly dateRange: { start: string; end: string };
  readonly className?: string;
  readonly onRefresh?: () => void;
}

type SortableColumn = 
  | 'laboratory_name'
  | 'product_name'
  | 'code_ean'
  | 'prix_brut_grossiste'
  | 'avg_buy_price_ht'
  | 'remise_percent'
  | 'quantity_bought'
  | 'ca_achats'
  | 'quantity_sold'
  | 'ca_ventes'
  | 'margin_rate_percent';

export const ProductsTableGeneric: React.FC<ProductsTableGenericProps> = ({
  productCodes,
  dateRange,
  className = '',
  onRefresh
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [sortConfig, setSortConfig] = useState<{ column: SortableColumn; direction: 'asc' | 'desc' }>({
    column: 'ca_ventes',
    direction: 'desc'
  });

  const hasFilters = productCodes.length > 0;

  const {
    data: products,
    isLoading,
    error,
    currentPage,
    totalPages,
    total,
    canPreviousPage,
    canNextPage,
    previousPage,
    nextPage,
    search,
    sort,
    isGlobalMode,
    manualFetch
  } = useGenericProductsList({
    enabled: true,
    productCodes,
    dateRange,
    pageSize: 50,
    autoFetch: hasFilters
  });

  const { exportToCsv, isExporting } = useExportCsv();

  const handleSort = useCallback((column: SortableColumn) => {
    const newDirection = sortConfig.column === column && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ column, direction: newDirection });
    sort(column, newDirection);
  }, [sortConfig, sort]);

  const handleSearchSubmit = useCallback(() => {
    search(searchInput);
  }, [searchInput, search]);

  const handleExport = useCallback(() => {
    if (!products || products.length === 0) return;

    const exportData = products.map(product => ({
      'Laboratoire': product.laboratory_name,
      'Produit': product.product_name,
      'Code EAN': product.code_ean,
      'Prix Brut Grossiste (€)': product.prix_brut_grossiste !== null ? Number(product.prix_brut_grossiste).toFixed(2) : 'N/A',
      'Prix Achat (€)': Number(product.avg_buy_price_ht).toFixed(2),
      'Remise (%)': Number(product.remise_percent).toFixed(2),
      'Volume Achats': Number(product.quantity_bought),
      'CA Acheté (€)': Number(product.ca_achats).toFixed(2),
      'Volume Ventes': Number(product.quantity_sold),
      'CA Ventes (€)': Number(product.ca_ventes).toFixed(2),
      'Taux Marge (%)': Number(product.margin_rate_percent).toFixed(2)
    }));

    const filename = CsvExporter.generateFilename('apodata_produits_generiques');
    const headers = Object.keys(exportData[0] || {});

    exportToCsv({ filename, headers, data: exportData });
  }, [products, exportToCsv]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M €`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K €`;
    return `${value.toFixed(2)} €`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const getMarginColorClass = (margin: number) => {
    if (margin >= 30) return 'text-green-700 bg-green-50';
    if (margin >= 20) return 'text-orange-700 bg-orange-50';
    return 'text-red-700 bg-red-50';
  };

  const getRemiseColorClass = (remise: number) => {
    if (remise >= 15) return 'text-green-700 bg-green-50';
    if (remise >= 5) return 'text-blue-700 bg-blue-50';
    return 'text-gray-700 bg-gray-50';
  };

  const SortIcon: React.FC<{ column: SortableColumn }> = ({ column }) => {
    if (sortConfig.column !== column) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  if (error) {
    return (
      <Card variant="elevated" className={`p-6 text-center ${className}`}>
        <p className="text-red-600">❌ {error}</p>
      </Card>
    );
  }

  if (!hasFilters && products.length === 0 && !isLoading) {
    return (
      <Card variant="elevated" className={`p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <Database className="w-12 h-12 text-gray-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chargement Global
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Aucun filtre actif. Cliquez pour charger tous les produits.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={manualFetch}
            disabled={isLoading}
            iconLeft={<Database className="w-4 h-4" />}
          >
            Charger Tout
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {total} produit{total > 1 ? 's' : ''}
            {isGlobalMode && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Global
              </span>
            )}
          </div>
          
          <ExportButton
            onClick={handleExport}
            isExporting={isExporting}
            disabled={!products || products.length === 0}
            label={`Export CSV (${total} lignes)`}
          />
          
          {!hasFilters && products.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={manualFetch}
              disabled={isLoading}
              iconLeft={
                <Database className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              }
              className="text-gray-600 hover:text-gray-900"
            >
              {isLoading ? 'Chargement...' : 'Recharger'}
            </Button>
          )}

          {onRefresh && hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              iconLeft={
                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              }
              className="text-gray-600 hover:text-gray-900"
            >
              {isLoading ? 'Actualisation...' : 'Actualiser'}
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              placeholder="Rechercher produit, labo, EAN..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSearchSubmit}
            disabled={isLoading}
          >
            Rechercher
          </Button>
        </div>
      </div>

      <Card variant="elevated" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            
            <thead className="bg-gray-50">
              <tr>
                <th 
                  onClick={() => handleSort('laboratory_name')}
                  className="px-2 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-32"
                >
                  <div className="flex items-center space-x-1">
                    <span>Labo</span>
                    <SortIcon column="laboratory_name" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('product_name')}
                  className="px-2 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Produit</span>
                    <SortIcon column="product_name" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('code_ean')}
                  className="px-2 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-28"
                >
                  <div className="flex items-center space-x-1">
                    <span>EAN</span>
                    <SortIcon column="code_ean" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('prix_brut_grossiste')}
                  className="px-2 py-2 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>P.Brut</span>
                    <SortIcon column="prix_brut_grossiste" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('avg_buy_price_ht')}
                  className="px-2 py-2 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>P.Achat</span>
                    <SortIcon column="avg_buy_price_ht" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('remise_percent')}
                  className="px-2 py-2 text-center text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-16"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>%R</span>
                    <SortIcon column="remise_percent" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('quantity_bought')}
                  className="px-2 py-2 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Vol.A</span>
                    <SortIcon column="quantity_bought" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('ca_achats')}
                  className="px-2 py-2 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>CA.A</span>
                    <SortIcon column="ca_achats" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('quantity_sold')}
                  className="px-2 py-2 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Vol.V</span>
                    <SortIcon column="quantity_sold" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('ca_ventes')}
                  className="px-2 py-2 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>CA.V</span>
                    <SortIcon column="ca_ventes" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('margin_rate_percent')}
                  className="px-2 py-2 text-center text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-16"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>%M</span>
                    <SortIcon column="margin_rate_percent" />
                  </div>
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Chargement des produits...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                    Aucun produit trouvé
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr 
                    key={`${product.code_ean}-${index}`}
                    className={`transition-colors ${
                      index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-25 hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-2 py-2 text-[11px] text-gray-900 font-medium">
                      <div className="max-w-[120px] truncate" title={product.laboratory_name}>
                        {product.laboratory_name}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-[11px] text-gray-900">
                      <div className="max-w-[250px] truncate" title={product.product_name}>
                        {product.product_name}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-[10px] text-gray-600 font-mono">
                      {product.code_ean}
                    </td>
                    <td className="px-2 py-2 text-[11px] text-gray-900 text-right font-medium">
                      {product.prix_brut_grossiste !== null 
                        ? `${product.prix_brut_grossiste.toFixed(2)} €`
                        : <span className="text-gray-400">N/A</span>
                      }
                    </td>
                    <td className="px-2 py-2 text-[11px] text-gray-900 text-right font-medium">
                      {product.avg_buy_price_ht.toFixed(2)} €
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded ${getRemiseColorClass(product.remise_percent)}`}>
                        {product.remise_percent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-2 py-2 text-[11px] text-gray-900 text-right font-medium">
                      {formatNumber(product.quantity_bought)}
                    </td>
                    <td className="px-2 py-2 text-[11px] text-gray-900 text-right font-medium">
                      {formatCurrency(product.ca_achats)}
                    </td>
                    <td className="px-2 py-2 text-[11px] text-gray-900 text-right font-medium">
                      {formatNumber(product.quantity_sold)}
                    </td>
                    <td className="px-2 py-2 text-[11px] text-gray-900 text-right font-medium">
                      {formatCurrency(product.ca_ventes)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded ${getMarginColorClass(product.margin_rate_percent)}`}>
                        {product.margin_rate_percent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} sur {totalPages} ({total} produits au total)
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={previousPage}
              disabled={!canPreviousPage}
              iconLeft={<ChevronLeft className="w-4 h-4" />}
            >
              Précédent
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={nextPage}
              disabled={!canNextPage}
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