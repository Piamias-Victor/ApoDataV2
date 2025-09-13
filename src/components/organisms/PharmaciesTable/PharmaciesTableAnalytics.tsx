// src/components/organisms/PharmaciesTable/PharmaciesTableAnalytics.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { SearchBar } from '@/components/molecules/SearchBar/SearchBar';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { Badge } from '@/components/atoms/Badge/Badge';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { CsvExporter } from '@/utils/export/csvExporter';
import type { 
  PharmacyMetrics, 
  SortConfig, 
  SortableColumn, 
  SortDirection,
  PaginationInfo 
} from './types';
import { 
  sortPharmacies, 
  filterPharmacies, 
  paginatePharmacies,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatEvolutionRelative,
  getEvolutionVariant,
  getMarginVariant,
  getMarketShareVariant
} from './utils';

interface PharmaciesTableAnalyticsProps {
  readonly pharmacies: PharmacyMetrics[];
  readonly isLoading?: boolean;
  readonly error?: string | null;
  readonly className?: string;
  readonly onRefresh?: () => void;
}

export const PharmaciesTableAnalytics: React.FC<PharmaciesTableAnalyticsProps> = ({
  pharmacies,
  isLoading = false,
  error = null,
  className = '',
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'ca_ttc',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 50;
  const { exportToCsv, isExporting } = useExportCsv();

  const handleSort = useCallback((column: SortableColumn) => {
    setSortConfig(prev => {
      if (prev.column === column) {
        const newDirection: SortDirection = prev.direction === 'asc' ? 'desc' : 'asc';
        return { column, direction: newDirection };
      }
      
      return {
        column,
        direction: column === 'pharmacy_name' ? 'asc' : 'desc'
      };
    });
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const processedDataBeforePagination = useMemo(() => {
    const filteredPharmacies = filterPharmacies(pharmacies, searchQuery);
    const sortedPharmacies = sortPharmacies(
      filteredPharmacies, 
      sortConfig.column || 'ca_ttc',
      sortConfig.direction
    );
    
    return sortedPharmacies;
  }, [pharmacies, searchQuery, sortConfig]);

  const processedData = useMemo(() => {
    const paginationResult = paginatePharmacies(
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
      pharmacies: paginationResult.paginatedPharmacies,
      pagination: paginationInfo
    };
  }, [processedDataBeforePagination, currentPage]);

  const prepareDataForExport = useCallback(() => {
    if (!processedDataBeforePagination || processedDataBeforePagination.length === 0) return [];
    
    return processedDataBeforePagination.map(pharmacy => ({
      'Nom Pharmacie': pharmacy.pharmacy_name || '',
      'CA TTC (€)': Number(pharmacy.ca_ttc || 0),
      'Quantité Vendue': Number(pharmacy.quantite_vendue || 0),
      'Montant Achat (€)': Number(pharmacy.montant_achat_total || 0),
      'Montant Marge (€)': Number(pharmacy.montant_marge || 0),
      'Taux Marge (%)': Number(pharmacy.pourcentage_marge || 0).toFixed(2),
      'Part Marché (%)': Number(pharmacy.part_marche_pct || 0).toFixed(2),
      'Évolution CA (%)': pharmacy.evolution_ca_pct !== undefined 
        ? Number(pharmacy.evolution_ca_pct).toFixed(2) 
        : 'N/A',
      'Évolution Relative (pts)': pharmacy.evolution_relative_pct !== undefined 
        ? Number(pharmacy.evolution_relative_pct).toFixed(2) 
        : 'N/A'
    }));
  }, [processedDataBeforePagination]);

  const handleExport = useCallback(() => {
    const exportData = prepareDataForExport();
    
    if (exportData.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }
    
    const filename = CsvExporter.generateFilename('apodata_pharmacies_analytics');
    const headers = Object.keys(exportData[0] || {});
    
    exportToCsv({ filename, headers, data: exportData });
  }, [prepareDataForExport, exportToCsv]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(processedData.pagination.totalPages, prev + 1));
  }, [processedData.pagination.totalPages]);

  const handleRefresh = useCallback(async () => {
    await onRefresh?.();
  }, [onRefresh]);

  const getSortIcon = (column: SortableColumn) => {
    if (sortConfig.column !== column) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

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
          <div className="text-sm text-gray-500">
            {processedData.pagination.totalItems} pharmacie{processedData.pagination.totalItems !== 1 ? 's' : ''}
          </div>
          
          <ExportButton
            onClick={handleExport}
            isExporting={isExporting}
            disabled={!pharmacies || pharmacies.length === 0}
            label={`Export CSV (${processedDataBeforePagination.length} lignes)`}
          />
          
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
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
          placeholder="Rechercher une pharmacie..."
          onSearch={handleSearch}
        />
      </div>

      {/* Tableau principal */}
      <Card variant="elevated" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('pharmacy_name')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                  >
                    <span>Pharmacie</span>
                    <span className="text-gray-400">{getSortIcon('pharmacy_name')}</span>
                  </button>
                </th>
                
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('ca_ttc')}
                    className="flex items-center justify-end space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 w-full"
                  >
                    <span>CA TTC</span>
                    <span className="text-gray-400">{getSortIcon('ca_ttc')}</span>
                  </button>
                </th>
                
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('quantite_vendue')}
                    className="flex items-center justify-end space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 w-full"
                  >
                    <span>Qté Vendue</span>
                    <span className="text-gray-400">{getSortIcon('quantite_vendue')}</span>
                  </button>
                </th>
                
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('montant_marge')}
                    className="flex items-center justify-end space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 w-full"
                  >
                    <span>Total Marge</span>
                    <span className="text-gray-400">{getSortIcon('montant_marge')}</span>
                  </button>
                </th>
                
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('pourcentage_marge')}
                    className="flex items-center justify-end space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 w-full"
                  >
                    <span>% Marge</span>
                    <span className="text-gray-400">{getSortIcon('pourcentage_marge')}</span>
                  </button>
                </th>
                
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('part_marche_pct')}
                    className="flex items-center justify-end space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 w-full"
                  >
                    <span>Part Marché</span>
                    <span className="text-gray-400">{getSortIcon('part_marche_pct')}</span>
                  </button>
                </th>
                
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('evolution_ca_pct')}
                    className="flex items-center justify-end space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 w-full"
                  >
                    <span>Évolution</span>
                    <span className="text-gray-400">{getSortIcon('evolution_ca_pct')}</span>
                  </button>
                </th>
                
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('evolution_relative_pct')}
                    className="flex items-center justify-end space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 w-full"
                  >
                    <span>Évol. Relative</span>
                    <span className="text-gray-400">{getSortIcon('evolution_relative_pct')}</span>
                  </button>
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Chargement des pharmacies...</span>
                    </div>
                  </td>
                </tr>
              ) : processedData.pharmacies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    {searchQuery 
                      ? `Aucune pharmacie trouvée pour "${searchQuery}"`
                      : 'Aucune pharmacie disponible'
                    }
                  </td>
                </tr>
              ) : (
                processedData.pharmacies.map((pharmacy, index) => (
                  <tr key={pharmacy.pharmacy_id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'} hover:bg-gray-50 transition-colors`}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {pharmacy.pharmacy_name}
                      </div>
                    </td>
                    
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(pharmacy.ca_ttc)}
                      </div>
                    </td>
                    
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm text-gray-900">
                        {formatNumber(pharmacy.quantite_vendue)}
                      </div>
                    </td>
                    
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(pharmacy.montant_marge)}
                      </div>
                    </td>
                    
                    <td className="px-4 py-3 text-right">
                      <Badge variant={getMarginVariant(pharmacy.pourcentage_marge)}>
                        {formatPercentage(pharmacy.pourcentage_marge)}
                      </Badge>
                    </td>
                    
                    <td className="px-4 py-3 text-right">
                      <Badge variant={getMarketShareVariant(pharmacy.part_marche_pct)}>
                        {formatPercentage(pharmacy.part_marche_pct)}
                      </Badge>
                    </td>
                    
                    <td className="px-4 py-3 text-right">
                      {pharmacy.evolution_ca_pct !== undefined ? (
                        <Badge variant={getEvolutionVariant(pharmacy.evolution_ca_pct)}>
                          {pharmacy.evolution_ca_pct > 0 ? '+' : ''}{formatPercentage(pharmacy.evolution_ca_pct)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 text-right">
                      {pharmacy.evolution_relative_pct !== undefined ? (
                        <Badge variant={getEvolutionVariant(pharmacy.evolution_relative_pct)}>
                          {formatEvolutionRelative(pharmacy.evolution_relative_pct)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                  </tr>
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
            sur {processedData.pagination.totalItems} pharmacies
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