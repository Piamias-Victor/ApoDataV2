// src/components/organisms/LaboratoryMarketShareSection/LaboratoryMarketShare.tsx
'use client';

import { Button } from "@/components/atoms/Button/Button";
import { Card } from "@/components/atoms/Card/Card";
import { ExportButton } from "@/components/molecules/ExportButton/ExportButton";
import { LaboratoryTableHeaderWithRanking } from "@/components/molecules/LaboratoryTable/LaboratoryTableHeaderWithRanking";
import { LaboratoryTableRowWithRanking } from "@/components/molecules/LaboratoryTable/LaboratoryTableRowWithRanking";
import { SearchBar } from "@/components/molecules/SearchBar/SearchBar";
import { useExportLaboratoryMarketShare } from "@/hooks/laboratories/useExportLaboratoryMarketShare";
import { useLaboratoryMarketShareWithFilters } from "@/hooks/laboratories/useLaboratoryMarketShareWithFilters";
import { LaboratorySortableColumn, SortConfig, SortDirection } from "@/types/laboratory";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useCallback, useMemo } from "react";

export const LaboratoryMarketShare: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'rang_actuel',
    direction: 'asc'
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
    hasComparison
  } = useLaboratoryMarketShareWithFilters({ pageSize: 50 });

  // ✅ Hook export dédié (données complètes brutes)
  const { exportAllToCsv, isExporting } = useExportLaboratoryMarketShare();

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

        if (aValue === null || aValue === undefined) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        if (bValue === null || bValue === undefined) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }

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

  // ✅ Export complet avec filtre recherche appliqué
  const handleExport = useCallback(() => {
    exportAllToCsv(searchQuery);
  }, [exportAllToCsv, searchQuery]);

  const colSpan = hasComparison ? 13 : 9;

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
          <div className="text-sm text-gray-500">
            {total} laboratoire{total > 1 ? 's' : ''}
          </div>
          
          <ExportButton
            onClick={handleExport}
            isExporting={isExporting}
            disabled={total === 0}
            label={`Export CSV complet (${total} lignes)`}
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
            <LaboratoryTableHeaderWithRanking
              sortConfig={sortConfig}
              onSort={handleSort}
              hasComparison={hasComparison}
            />
            
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      <span>Chargement...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAndSortedData.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-12 text-center text-gray-500">
                    {searchQuery 
                      ? `Aucun laboratoire trouvé pour "${searchQuery}"`
                      : 'Aucune donnée disponible'
                    }
                  </td>
                </tr>
              ) : (
                filteredAndSortedData.map((lab, index) => (
                  <LaboratoryTableRowWithRanking
                    key={lab.laboratory_name}
                    laboratory={lab}
                    isEven={index % 2 === 0}
                    hasComparison={hasComparison}
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