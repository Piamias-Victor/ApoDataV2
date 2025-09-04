// src/components/organisms/CompetitiveTable/CompetitiveTable.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { SearchBar } from '@/components/molecules/SearchBar/SearchBar';
import { CompetitiveTableHeader } from '@/components/molecules/CompetitiveTableHeader/CompetitiveTableHeader';
import { CompetitiveTableRow } from '@/components/molecules/CompetitiveTableRow/CompetitiveTableRow';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { CsvExporter } from '@/utils/export/csvExporter';
import type { 
  CompetitiveMetrics, 
  CompetitiveSortConfig, 
  CompetitiveSortableColumn, 
  SortDirection,
  CompetitivePaginationInfo 
} from './types';
import { 
  sortCompetitiveProducts, 
  filterCompetitiveProducts, 
  paginateCompetitiveProducts 
} from './utils';

interface CompetitiveTableProps {
  readonly products: CompetitiveMetrics[];
  readonly isLoading?: boolean;
  readonly error?: string | null;
  readonly className?: string;
  readonly onRefresh?: () => void;
}

export const CompetitiveTable: React.FC<CompetitiveTableProps> = ({
  products,
  isLoading = false,
  error = null,
  className = '',
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<CompetitiveSortConfig>({
    column: null,
    direction: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 50;
  const { exportToCsv, isExporting } = useExportCsv();

  const handleSort = useCallback((column: CompetitiveSortableColumn) => {
    setSortConfig(prev => {
      if (prev.column === column) {
        const newDirection: SortDirection = 
          prev.direction === 'asc' ? 'desc' :
          prev.direction === 'desc' ? null : 'asc';
        
        return {
          column: newDirection ? column : null,
          direction: newDirection
        };
      }
      
      return {
        column,
        direction: 'asc'
      };
    });
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query || '');
  }, []);

  const processedData = useMemo(() => {
    const filteredProducts = filterCompetitiveProducts(products, searchQuery);
    const sortedProducts = sortCompetitiveProducts(
      filteredProducts, 
      sortConfig.column || 'product_name',
      sortConfig.direction
    );
    const paginationResult = paginateCompetitiveProducts(sortedProducts, currentPage, itemsPerPage);
    
    const paginationInfo: CompetitivePaginationInfo = {
      totalItems: filteredProducts.length,
      totalPages: paginationResult.totalPages,
      currentPage,
      startIndex: paginationResult.startIndex,
      endIndex: paginationResult.endIndex
    };

    return {
      products: paginationResult.paginatedProducts,
      pagination: paginationInfo,
      allFilteredProducts: filteredProducts
    };
  }, [products, searchQuery, sortConfig, currentPage]);

  // FONCTION CORRIGÉE avec protection défensive
  const prepareCompetitiveDataForExport = useCallback(() => {
    if (!processedData.allFilteredProducts || processedData.allFilteredProducts.length === 0) return [];
    
    const safeSearchQuery = searchQuery || '';
    const searchContext = safeSearchQuery.trim() 
      ? `Recherche: "${safeSearchQuery.trim()}"` 
      : 'Tous les produits';
    
    const sortContext = sortConfig.column && sortConfig.direction
      ? `Tri: ${sortConfig.column} ${sortConfig.direction === 'asc' ? 'croissant' : 'décroissant'}`
      : 'Tri: ordre naturel';
    
    // PROTECTION DÉFENSIVE sur TOUS les champs numériques
    return processedData.allFilteredProducts.map(product => {
      // Fonction helper pour sécuriser les valeurs numériques
      const safeNumber = (value: any, defaultValue: number = 0): number => {
        const num = Number(value);
        return (value === null || value === undefined || isNaN(num)) ? defaultValue : num;
      };

      const safeString = (value: any, defaultValue: string = ''): string => {
        return (value === null || value === undefined) ? defaultValue : String(value);
      };

      return {
        'Nom produit': safeString(product.product_name),
        'Code EAN': safeString(product.code_ean),
        'Prix min marché (€)': safeNumber(product.prix_vente_min_global).toFixed(2),
        'Prix max marché (€)': safeNumber(product.prix_vente_max_global).toFixed(2),
        'Prix moyen marché (€)': safeNumber(product.prix_vente_moyen_global).toFixed(2),
        'Nb pharmacies vendant': safeNumber(product.nb_pharmacies_vendant),
        'Prix vente TTC (€)': safeNumber(product.prix_vente_moyen_selection).toFixed(2),
        'Prix achat HT (€)': safeNumber(product.prix_achat_moyen_ht).toFixed(2),
        'Quantité vendue': safeNumber(product.quantite_vendue_selection),
        'Taux marge (%)': safeNumber(product.taux_marge_moyen_selection).toFixed(2),
        'Écart vs marché (%)': safeNumber(product.ecart_prix_vs_marche_pct).toFixed(2),
        'Interprétation écart': safeNumber(product.ecart_prix_vs_marche_pct) > 5 ? 'Trop cher' :
                               safeNumber(product.ecart_prix_vs_marche_pct) > 2 ? 'Légèrement cher' :
                               safeNumber(product.ecart_prix_vs_marche_pct) > -2 ? 'Prix aligné' :
                               safeNumber(product.ecart_prix_vs_marche_pct) > -5 ? 'Légèrement moins cher' :
                               'Très compétitif',
        'Statut marge': safeNumber(product.taux_marge_moyen_selection) >= 30 ? 'Excellente (≥30%)' :
                        safeNumber(product.taux_marge_moyen_selection) >= 20 ? 'Correcte (20-30%)' :
                        'Faible (<20%)',
        'Contexte recherche': searchContext,
        'Contexte tri': sortContext,
        'Total produits trouvés': processedData.allFilteredProducts.length
      };
    });
  }, [processedData.allFilteredProducts, searchQuery, sortConfig]);

  const handleExport = useCallback(() => {
    const exportData = prepareCompetitiveDataForExport();
    
    if (exportData.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }
    
    const safeSearchQuery = searchQuery || '';
    const searchSuffix = safeSearchQuery.trim() 
      ? `_${safeSearchQuery.trim().replace(/[^a-zA-Z0-9]/g, '_')}` 
      : '';
    const filename = CsvExporter.generateFilename(`apodata_analyse_concurrentielle${searchSuffix}`);
    
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
  }, [prepareCompetitiveDataForExport, exportToCsv, searchQuery]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(processedData.pagination.totalPages, prev + 1));
  }, [processedData.pagination.totalPages]);

  if (error) {
    return (
      <Card variant="elevated" className={`p-6 text-center ${className}`}>
        <p className="text-red-600">❌ {error}</p>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {processedData.pagination.totalItems} produit{processedData.pagination.totalItems > 1 ? 's' : ''} analysé{processedData.pagination.totalItems > 1 ? 's' : ''}
          </div>
          
          <ExportButton
            onClick={handleExport}
            isExporting={isExporting}
            disabled={!products || products.length === 0 || isLoading}
            label={`Export CSV (${processedData.pagination.totalItems} ligne${processedData.pagination.totalItems > 1 ? 's' : ''})`}
          />
          
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

      <Card variant="elevated" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed" style={{ width: '700px' }}>
            <CompetitiveTableHeader
              sortConfig={sortConfig}
              onSort={handleSort}
            />
            
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Chargement de l'analyse concurrentielle...</span>
                    </div>
                  </td>
                </tr>
              ) : processedData.products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    {searchQuery 
                      ? `Aucun produit trouvé pour "${searchQuery}"`
                      : 'Aucune donnée concurrentielle disponible'
                    }
                  </td>
                </tr>
              ) : (
                processedData.products.map((product, index) => (
                  <CompetitiveTableRow
                    key={`${product.code_ean}-${index}`}
                    product={product}
                    isEven={index % 2 === 0}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

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