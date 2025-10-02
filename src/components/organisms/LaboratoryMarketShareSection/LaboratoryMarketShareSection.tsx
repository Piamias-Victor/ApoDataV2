// src/components/organisms/LaboratoryMarketShareSection/LaboratoryMarketShareSection.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLaboratoryMarketShare } from '@/hooks/generic-groups/useLaboratoryMarketShare';
import { SearchBar } from '@/components/molecules/SearchBar/SearchBar';
import { LaboratoryTableHeader } from '@/components/molecules/LaboratoryTable/LaboratoryTableHeader';
import { LaboratoryTableRow } from '@/components/molecules/LaboratoryTable/LaboratoryTableRow';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { CsvExporter } from '@/utils/export/csvExporter';
import type { 
  SortConfig, 
  LaboratorySortableColumn,
  SortDirection
} from './types';

interface LaboratoryMarketShareSectionProps {
  readonly productCodes: string[];
  readonly dateRange: { start: string; end: string };
}

export const LaboratoryMarketShareSection: React.FC<LaboratoryMarketShareSectionProps> = ({
  productCodes,
  dateRange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: null,
    direction: null
  });

  const {
    data,
    isLoading,
    error,
    currentPage,
    totalPages,
    total,
    canPreviousPage,
    canNextPage,
    previousPage,
    nextPage,
    isGlobalMode
  } = useLaboratoryMarketShare({
    enabled: true,
    productCodes,
    dateRange,
    pageSize: 10
  });

  const { exportToCsv, isExporting } = useExportCsv();

  const handleSort = useCallback((column: LaboratorySortableColumn) => {
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
      
      return { column, direction: 'asc' };
    });
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredAndSortedData = useMemo(() => {
    let processed = [...data];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      processed = processed.filter(lab =>
        lab.laboratory_name.toLowerCase().includes(query)
      );
    }

    if (sortConfig.column && sortConfig.direction) {
      processed.sort((a, b) => {
        const aValue = a[sortConfig.column!];
        const bValue = b[sortConfig.column!];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    }

    return processed;
  }, [data, searchQuery, sortConfig]);

  const handleExport = useCallback(() => {
    const exportData = filteredAndSortedData.map(lab => ({
      'Laboratoire': lab.laboratory_name,
      'Nombre de produits': lab.product_count,
      'CA Réalisé (€)': lab.ca_selection,
      'Marge Réalisée (€)': lab.marge_selection,
      'Part Marché CA (%)': (lab.part_marche_ca_pct / 100).toFixed(3),
      'Part Marché Marge (%)': (lab.part_marche_marge_pct / 100).toFixed(3)
    }));

    if (exportData.length === 0) return;

    const filename = CsvExporter.generateFilename(
      isGlobalMode ? 'apodata_laboratoires_generiques_global' : 'apodata_laboratoires_parts_marche'
    );
    const headers = Object.keys(exportData[0]!);

    exportToCsv({ filename, headers, data: exportData });
  }, [filteredAndSortedData, exportToCsv, isGlobalMode]);

  if (error) {
    return (
      <Card variant="elevated" className="p-6 text-center">
        <p className="text-red-600">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {isGlobalMode && (
            <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Vue globale
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            {total} laboratoire{total > 1 ? 's' : ''}
          </div>
          
          <ExportButton
            onClick={handleExport}
            isExporting={isExporting}
            disabled={filteredAndSortedData.length === 0}
            label={`Export CSV (${filteredAndSortedData.length} lignes)`}
          />
        </div>
        
        <SearchBar
          onSearch={handleSearch}
          placeholder="Rechercher un laboratoire..."
        />
      </div>

      <Card variant="elevated" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <LaboratoryTableHeader
              sortConfig={sortConfig}
              onSort={handleSort}
            />
            
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Chargement...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAndSortedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    {searchQuery 
                      ? `Aucun laboratoire trouvé pour "${searchQuery}"`
                      : 'Aucune donnée disponible'
                    }
                  </td>
                </tr>
              ) : (
                filteredAndSortedData.map((lab, index) => (
                  <LaboratoryTableRow
                    key={lab.laboratory_name}
                    laboratory={lab}
                    isEven={index % 2 === 0}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} sur {totalPages} • {total} laboratoires
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