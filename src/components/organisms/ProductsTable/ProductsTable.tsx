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
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { CsvExporter } from '@/utils/export/csvExporter';
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
 * Avec export CSV intégré
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

  // Hook export CSV
  const { exportToCsv, isExporting } = useExportCsv();

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

  // Traitement des données (filtrage + tri)
  const processedDataBeforePagination = useMemo(() => {
    // 1. Filtrage par recherche
    const filteredProducts = filterProducts(products, searchQuery);
    
    // 2. Tri
    const sortedProducts = sortProducts(
      filteredProducts, 
      sortConfig.column || 'product_name',
      sortConfig.direction
    );
    
    return sortedProducts;
  }, [products, searchQuery, sortConfig]);

  // Pagination
  const processedData = useMemo(() => {
    const paginationResult = paginateProducts(
      processedDataBeforePagination, 
      currentPage, 
      itemsPerPage
    );
    
    const paginationInfo: PaginationInfo = {
      totalItems: processedDataBeforePagination.length,
      totalPages: paginationResult.totalPages,
      currentPage,
      startIndex: paginationResult.startIndex,
      endIndex: paginationResult.endIndex
    };

    return {
      products: paginationResult.paginatedProducts,
      pagination: paginationInfo
    };
  }, [processedDataBeforePagination, currentPage]);

  // Préparation données pour export CSV
  const prepareTableDataForExport = useCallback(() => {
    // Utiliser toutes les données filtrées/triées (sans pagination)
    const dataToExport = processedDataBeforePagination;
    
    if (!dataToExport || dataToExport.length === 0) return [];
    
    // Export selon le mode de vue actuel
    return dataToExport.map(product => {
      const exportRow: any = {
        'Code EAN': product.code_ean || '',
        'Nom produit': product.product_name || ''
      };

      if (viewMode === 'totals') {
        // Mode Totaux - Utilisation des propriétés correctes avec conversion sécurisée
        exportRow['CA TTC (€)'] = Number(product.ca_ttc || 0);
        exportRow['Quantité vendue'] = Number(product.quantity_sold || 0);
        exportRow['Montant achat (€)'] = Number(product.purchase_amount || 0);
        exportRow['Stock actuel'] = Number(product.current_stock || 0);
        exportRow['Marge totale HT (€)'] = Number(product.total_margin_ht || 0);
        
        // Conversion sécurisée pour le taux de marge
        const marginRate = Number(product.margin_rate_percent || 0);
        exportRow['Taux marge (%)'] = marginRate.toFixed(2);
        
        // Calculs additionnels si disponibles
        const qtySold = Number(product.quantity_sold || 0);
        const caTtc = Number(product.ca_ttc || 0);
        const currentStock = Number(product.current_stock || 0);
        
        if (qtySold > 0 && caTtc > 0) {
          const prixMoyenVente = caTtc / qtySold;
          exportRow['Prix moyen vente TTC (€)'] = prixMoyenVente.toFixed(2);
        }
        
        if (currentStock > 0 && qtySold > 0) {
          const joursStock = (currentStock / qtySold) * 30;
          exportRow['Jours de stock'] = joursStock.toFixed(1);
        }
      } else {
        // Mode Moyennes - Utilisation des propriétés correctes avec conversion sécurisée
        exportRow['Prix moyen vente TTC (€)'] = Number(product.avg_sell_price_ttc || 0);
        exportRow['Prix moyen achat HT (€)'] = Number(product.avg_buy_price_ht || 0);
        exportRow['Marge unitaire HT (€)'] = Number(product.unit_margin_ht || 0);
        
        // Conversion sécurisée pour le taux de marge
        const marginRate = Number(product.margin_rate_percent || 0);
        exportRow['Taux marge (%)'] = marginRate.toFixed(2);
        
        exportRow['Stock actuel'] = Number(product.current_stock || 0);
        exportRow['Quantité vendue'] = Number(product.quantity_sold || 0);
        
        // Calcul rotation stock
        const currentStock = Number(product.current_stock || 0);
        const qtySold = Number(product.quantity_sold || 0);
        
        if (currentStock > 0 && qtySold > 0) {
          const rotationJours = (currentStock / qtySold) * 30;
          exportRow['Rotation stock (jours)'] = rotationJours.toFixed(1);
        }
      }

      return exportRow;
    });
  }, [processedDataBeforePagination, viewMode]);

  // Handler export
  const handleExport = useCallback(() => {
    const exportData = prepareTableDataForExport();
    
    if (exportData.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }
    
    // Nom de fichier avec contexte
    const modeLabel = viewMode === 'totals' ? 'totaux' : 'moyennes';
    const filename = CsvExporter.generateFilename(`apodata_produits_${modeLabel}`);
    
    // Vérification et extraction des headers
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
  }, [prepareTableDataForExport, exportToCsv, viewMode]);

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
          
          {/* Boutons d'action */}
          <ExportButton
            onClick={handleExport}
            isExporting={isExporting}
            disabled={!products || products.length === 0}
            label={`Export CSV (${processedDataBeforePagination.length} lignes)`}
          />
          
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