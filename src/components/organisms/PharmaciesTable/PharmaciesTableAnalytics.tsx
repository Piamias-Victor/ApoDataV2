// src/components/organisms/PharmaciesTable/PharmaciesTableAnalytics.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
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
  formatPercentage,
  formatEvolutionRelative,
  formatRang,
  formatGainRang,
  getEvolutionVariant,
  getMarginVariant,
  getRangVariant
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
    column: 'ca_ventes',
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
      sortConfig.column || 'ca_ventes',
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

  const renderEvolution = (current: number, comparison: number | null | undefined, formatFn: (v: number) => string) => {
    if (comparison === null || comparison === undefined) {
      return <span className="text-[9px] text-gray-400">N-1: -</span>;
    }

    if (current === 0 && comparison === 0) {
      return <span className="text-[9px] text-gray-400">-</span>;
    }

    if (comparison === 0) {
      return <span className="text-[9px] font-semibold text-blue-600">New</span>;
    }

    const evolution = ((current - comparison) / comparison) * 100;
    const colorClass = evolution > 0 ? 'text-green-600' : evolution < 0 ? 'text-red-600' : 'text-gray-500';
    const arrow = evolution > 0 ? '↑' : evolution < 0 ? '↓' : '';

    return (
      <div className="flex items-center justify-end space-x-1">
        <span className="text-[9px] text-gray-400">{formatFn(comparison)}</span>
        <span className={`text-[9px] font-semibold ${colorClass}`}>
          {arrow} {Math.abs(evolution).toFixed(1)}%
        </span>
      </div>
    );
  };

  const prepareDataForExport = useCallback(() => {
    if (!processedDataBeforePagination || processedDataBeforePagination.length === 0) return [];

    return processedDataBeforePagination.map(pharmacy => ({
      'Nom Pharmacie': pharmacy.pharmacy_name || '',
      'Rang Ventes': pharmacy.rang_ventes_actuel !== 999999 ? pharmacy.rang_ventes_actuel : 'N/A',
      'Rang Précédent': pharmacy.rang_ventes_precedent || 'N/A',
      'Gain Rang': pharmacy.gain_rang_ventes !== null ? pharmacy.gain_rang_ventes : 'N/A',
      'Qté Achetée': pharmacy.quantite_achetee || 0,
      'CA Achats (€)': Number(pharmacy.ca_achats || 0).toFixed(2),
      'Qté Vendue': pharmacy.quantite_vendue || 0,
      'CA Ventes (€)': Number(pharmacy.ca_ventes || 0).toFixed(2),
      'Évol Achats (%)': pharmacy.evol_achats_pct !== null ? Number(pharmacy.evol_achats_pct).toFixed(2) : 'N/A',
      'Évol Ventes (%)': pharmacy.evol_ventes_pct !== null ? Number(pharmacy.evol_ventes_pct).toFixed(2) : 'N/A',
      'Évol Rel. Achats (pts)': pharmacy.evol_relative_achats_pct !== null ? Number(pharmacy.evol_relative_achats_pct).toFixed(2) : 'N/A',
      'Évol Rel. Ventes (pts)': pharmacy.evol_relative_ventes_pct !== null ? Number(pharmacy.evol_relative_ventes_pct).toFixed(2) : 'N/A',
      'Taux Marge (%)': Number(pharmacy.pourcentage_marge || 0).toFixed(2)
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

  const SortIcon: React.FC<{ column: SortableColumn }> = ({ column }) => {
    if (sortConfig.column !== column) {
      return <ChevronUp className="w-3 h-3 text-gray-400" />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-3 h-3 text-blue-600" />
      : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  if (error) {
    return (
      <Card variant="elevated" className={`p-6 text-center ${className}`}>
        <p className="text-red-600">❌ {error}</p>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>

      {/* Header */}
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

      {/* Tableau */}
      <Card variant="elevated" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('pharmacy_name')}
                  className="px-2 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Pharmacie</span>
                    <SortIcon column="pharmacy_name" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('rang_ventes_actuel')}
                  className="px-2 py-2 text-center text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-16"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Rang</span>
                    <SortIcon column="rang_ventes_actuel" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('gain_rang_ventes')}
                  className="px-2 py-2 text-center text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-16"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Δ Rang</span>
                    <SortIcon column="gain_rang_ventes" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('quantite_achetee')}
                  className="px-2 py-2 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Qté.A</span>
                    <SortIcon column="quantite_achetee" />
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
                  onClick={() => handleSort('quantite_vendue')}
                  className="px-2 py-2 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Qté.V</span>
                    <SortIcon column="quantite_vendue" />
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
                  onClick={() => handleSort('evol_relative_achats_pct')}
                  className="px-2 py-2 text-center text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>ΔA.Rel</span>
                    <SortIcon column="evol_relative_achats_pct" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('evol_relative_ventes_pct')}
                  className="px-2 py-2 text-center text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>ΔV.Rel</span>
                    <SortIcon column="evol_relative_ventes_pct" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('pourcentage_marge')}
                  className="px-2 py-2 text-center text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-16"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>%M</span>
                    <SortIcon column="pourcentage_marge" />
                  </div>
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Chargement des pharmacies...</span>
                    </div>
                  </td>
                </tr>
              ) : processedData.pharmacies.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-gray-500">
                    {searchQuery
                      ? `Aucune pharmacie trouvée pour "${searchQuery}"`
                      : 'Aucune pharmacie disponible'
                    }
                  </td>
                </tr>
              ) : (
                processedData.pharmacies.map((pharmacy, index) => (
                  <tr
                    key={pharmacy.pharmacy_id}
                    className={`transition-colors ${index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-25 hover:bg-gray-50'
                      }`}
                  >
                    <td className="px-2 py-2 text-[11px] text-gray-900 font-medium">
                      <div className="max-w-[200px] truncate" title={pharmacy.pharmacy_name}>
                        {pharmacy.pharmacy_name}
                      </div>
                    </td>

                    <td className="px-2 py-2 text-center">
                      <span className="text-[11px] text-gray-900 font-medium">
                        {formatRang(pharmacy.rang_ventes_actuel)}
                      </span>
                    </td>

                    <td className="px-2 py-2 text-center">
                      {pharmacy.gain_rang_ventes !== null ? (
                        <Badge variant={getRangVariant(pharmacy.gain_rang_ventes)}>
                          <span className="text-[10px] font-semibold">
                            {formatGainRang(pharmacy.gain_rang_ventes)}
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-[10px]">N/A</span>
                      )}
                    </td>

                    <td className="px-2 py-2 text-[11px] text-gray-900 text-right font-medium">
                      {pharmacy.quantite_achetee?.toLocaleString('fr-FR') || 0}
                    </td>

                    <td className="px-2 py-2 text-right align-top">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-700 font-medium">
                          {formatCurrency(pharmacy.ca_achats)}
                        </span>
                        {renderEvolution(pharmacy.ca_achats, pharmacy.ca_achats_comparison, formatCurrency)}
                      </div>
                    </td>

                    <td className="px-2 py-2 text-[11px] text-gray-900 text-right font-medium">
                      {pharmacy.quantite_vendue?.toLocaleString('fr-FR') || 0}
                    </td>

                    <td className="px-2 py-2 text-right align-top">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-700 font-medium">
                          {formatCurrency(pharmacy.ca_ventes)}
                        </span>
                        {renderEvolution(pharmacy.ca_ventes, pharmacy.ca_ventes_comparison, formatCurrency)}
                      </div>
                    </td>

                    <td className="px-2 py-2 text-center">
                      {pharmacy.evol_relative_achats_pct !== null ? (
                        <Badge variant={getEvolutionVariant(pharmacy.evol_relative_achats_pct)}>
                          <span className="text-[10px] font-semibold">
                            {formatEvolutionRelative(pharmacy.evol_relative_achats_pct)}
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-[10px]">N/A</span>
                      )}
                    </td>

                    <td className="px-2 py-2 text-center">
                      {pharmacy.evol_relative_ventes_pct !== null ? (
                        <Badge variant={getEvolutionVariant(pharmacy.evol_relative_ventes_pct)}>
                          <span className="text-[10px] font-semibold">
                            {formatEvolutionRelative(pharmacy.evol_relative_ventes_pct)}
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-[10px]">N/A</span>
                      )}
                    </td>

                    <td className="px-2 py-2 text-center">
                      <Badge variant={getMarginVariant(pharmacy.pourcentage_marge)}>
                        <span className="text-[10px] font-semibold">
                          {formatPercentage(pharmacy.pourcentage_marge)}
                        </span>
                      </Badge>
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
            Page {currentPage} sur {processedData.pagination.totalPages} ({processedData.pagination.totalItems} pharmacies)
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