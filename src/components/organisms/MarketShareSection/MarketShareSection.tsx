// src/components/organisms/MarketShareSection/MarketShareSection.tsx

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMarketShareHierarchy } from '@/hooks/ventes/useMarketShareHierarchy';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { Button } from '@/components/atoms/Button/Button';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { CsvExporter } from '@/utils/export/csvExporter';

interface MarketShareSectionProps {
  readonly dateRange: { start: string; end: string };
  readonly filters?: {
    readonly products?: string[];
    readonly bcbSegments?: string[];
    readonly pharmacies?: string[];
  };
  readonly onRefresh?: () => void;
  readonly className?: string;
}

type BCBHierarchyLevel = 
  | 'bcb_segment_l0' 
  | 'bcb_segment_l1' 
  | 'bcb_segment_l2' 
  | 'bcb_segment_l3' 
  | 'bcb_segment_l4' 
  | 'bcb_segment_l5' 
  | 'bcb_family';

const HIERARCHY_LABELS: Record<BCBHierarchyLevel, string> = {
  bcb_segment_l0: 'Univers BCB',
  bcb_segment_l1: 'Segment L1',
  bcb_segment_l2: 'Segment L2', 
  bcb_segment_l3: 'Segment L3',
  bcb_segment_l4: 'Segment L4',
  bcb_segment_l5: 'Segment L5',
  bcb_family: 'Familles BCB'
};

/**
 * MarketShareSection - Parts de marché hiérarchie BCB complète
 * 
 * Features :
 * - 7 niveaux BCB : L0-L5 + Familles
 * - Barres progression CA + Marge
 * - Pagination 5 segments/niveau
 * - Top 3 laboratoires BCB
 * - Export CSV complet
 * - États loading/error/empty
 */
export const MarketShareSection: React.FC<MarketShareSectionProps> = ({
  dateRange,
  filters = {},
  onRefresh,
  className = ''
}) => {
  const [activeLevel, setActiveLevel] = useState<BCBHierarchyLevel>('bcb_segment_l0');

  // Hook pour le niveau BCB actif
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    hasData,
    currentPage,
    totalPages,
    totalSegments,
    canPreviousPage,
    canNextPage,
    previousPage,
    nextPage
  } = useMarketShareHierarchy({
    enabled: true,
    dateRange,
    hierarchyLevel: activeLevel,
    filters
  });

  // Hook export CSV
  const { exportToCsv, isExporting } = useExportCsv();

  // Handler refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // Handler changement niveau BCB
  const handleLevelChange = useCallback((level: BCBHierarchyLevel) => {
    console.log('Switching BCB hierarchy level:', level);
    setActiveLevel(level);
  }, []);

  // Formatage montants
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  // Formatage pourcentages
  const formatPercentage = useCallback((percentage: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(percentage / 100);
  }, []);

  // Préparation export CSV BCB
  const prepareMarketShareDataForExport = useCallback(() => {
    if (!data || data.segments.length === 0) return [];
    
    const exportData = [];
    const currentPeriod = `${new Date(dateRange.start).toLocaleDateString('fr-FR')} - ${new Date(dateRange.end).toLocaleDateString('fr-FR')}`;
    
    // En-tête informations BCB
    exportData.push({
      'Segment BCB': 'INFORMATIONS GÉNÉRALES',
      'Niveau Hiérarchie': HIERARCHY_LABELS[activeLevel],
      'Période': currentPeriod,
      'Page Actuelle': currentPage.toString(),
      'Total Segments': totalSegments.toString(),
      'CA Sélection (€)': '',
      'Part Marché CA (%)': '',
      'Marge Sélection (€)': '',
      'Part Marché Marge (%)': '',
      'Top Lab BCB': '',
      'Top Lab CA': ''
    });

    // Données segments BCB
    data.segments.forEach(segment => {
      const topLabs = segment.top_brand_labs || [];
      
      exportData.push({
        'Segment BCB': segment.segment_name,
        'Niveau Hiérarchie': HIERARCHY_LABELS[activeLevel],
        'Période': currentPeriod,
        'Page Actuelle': currentPage.toString(),
        'Total Segments': totalSegments.toString(),
        'CA Sélection (€)': segment.ca_selection.toString(),
        'Part Marché CA (%)': segment.part_marche_ca_pct.toFixed(2),
        'Marge Sélection (€)': segment.marge_selection.toString(),
        'Part Marché Marge (%)': segment.part_marche_marge_pct.toFixed(2),
        'Top Lab BCB': topLabs[0]?.brand_lab || 'N/A',
        'Top Lab CA': topLabs[0]?.ca_brand_lab?.toString() || '0'
      });
    });
    
    return exportData;
  }, [data, dateRange, activeLevel, currentPage, totalSegments]);

  // Handler export BCB
  const handleExport = useCallback(() => {
    const exportData = prepareMarketShareDataForExport();
    if (exportData.length === 0) return;
    
    const levelLabel = HIERARCHY_LABELS[activeLevel].toLowerCase().replace(/\s+/g, '_');
    const filename = CsvExporter.generateFilename(`apodata_parts_marche_bcb_${levelLabel}`);
    
    if (!exportData[0]) return;
    const headers = Object.keys(exportData[0]);
    
    exportToCsv({ filename, headers, data: exportData });
  }, [prepareMarketShareDataForExport, exportToCsv, activeLevel]);

  // État empty
  const isEmpty = useMemo(() => {
    return hasData && data && data.segments.length === 0;
  }, [hasData, data]);

  // Rendu erreur
  if (error) {
    return (
      <section className={`px-6 py-6 ${className}`}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Parts de Marché Hiérarchie BCB
          </h2>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12 text-center bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Erreur de chargement
          </h3>
          
          <p className="text-red-700 mb-4 max-w-md">
            {error}
          </p>
          
          <Button
            variant="secondary"
            size="md"
            onClick={handleRefresh}
            iconLeft={<RotateCcw className="w-4 h-4" />}
          >
            Réessayer
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className={`px-6 py-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Parts de Marché Hiérarchie BCB
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Performance par niveau hiérarchique BCB complet
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <ExportButton
            onClick={handleExport}
            isExporting={isExporting}
            disabled={!data || isLoading || !hasData || data.segments.length === 0}
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

      {/* Onglets niveaux BCB */}
      <div className="grid grid-cols-7 gap-1 mb-6 p-1 bg-gray-100 rounded-lg">
        {Object.entries(HIERARCHY_LABELS).map(([level, label]) => (
          <button
            key={level}
            onClick={() => handleLevelChange(level as BCBHierarchyLevel)}
            disabled={isLoading}
            className={`
              px-2 py-2 text-xs font-medium rounded-md transition-all text-center
              ${activeLevel === level
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={label}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 animate-pulse">
              <div className="flex justify-between items-center mb-3">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
                <div className="h-4 bg-gray-300 rounded w-20"></div>
              </div>
              <div className="h-3 bg-gray-300 rounded mb-2"></div>
              <div className="flex justify-between text-xs">
                <div className="h-3 bg-gray-300 rounded w-24"></div>
                <div className="h-3 bg-gray-300 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success avec données BCB */}
      {!isLoading && data && data.segments.length > 0 && (
        <>
          <div className="space-y-4">
            {data.segments.map((segment, index) => (
              <div key={`${segment.segment_name}-${index}`} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-gray-900 text-base">
                      {segment.segment_name}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>CA Total: {formatCurrency(segment.ca_total_segment)}</span>
                      <span>Marge Totale: {formatCurrency(segment.marge_total_segment)}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(segment.ca_selection)}
                    </div>
                    <div className="text-xs text-gray-500">CA Sélection</div>
                  </div>
                </div>

                {/* Barres progression */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Part Marché CA</span>
                    <span className="text-sm font-semibold text-sky-600">
                      {formatPercentage(segment.part_marche_ca_pct)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-sky-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.min(100, Math.max(0, segment.part_marche_ca_pct))}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Part Marché Marge</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatPercentage(segment.part_marche_marge_pct)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.min(100, Math.max(0, segment.part_marche_marge_pct))}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                    <span>Marge Sélection: {formatCurrency(segment.marge_selection)}</span>
                  </div>
                </div>

                {/* Top 3 Labs BCB */}
                {segment.top_brand_labs && segment.top_brand_labs.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Top 3 Laboratoires BCB
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {segment.top_brand_labs.map((brandLab, brandIndex) => {
                        // Calcul part de marché CA du laboratoire
                        const labMarketSharePct = segment.ca_total_segment > 0 
                          ? (brandLab.ca_brand_lab / segment.ca_total_segment) * 100 
                          : 0;
                        
                        return (
                          <div key={`${brandLab.brand_lab}-${brandIndex}`} className="bg-gray-50 rounded-md p-2">
                            <div className="text-xs font-medium text-gray-900 truncate" title={brandLab.brand_lab}>
                              {brandLab.brand_lab}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              <div>CA: {formatCurrency(brandLab.ca_brand_lab)}</div>
                              <div className="text-xs text-sky-600 font-medium">
                                Part: {formatPercentage(labMarketSharePct)}
                              </div>
                              <div>Marge: {formatCurrency(brandLab.marge_brand_lab)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Page {currentPage} sur {totalPages} • {totalSegments} segments
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={previousPage}
                  disabled={!canPreviousPage || isLoading}
                  iconLeft={<ChevronLeft className="w-4 h-4" />}
                >
                  Précédent
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextPage}
                  disabled={!canNextPage || isLoading}
                  iconRight={<ChevronRight className="w-4 h-4" />}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!isLoading && isEmpty && (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune donnée {HIERARCHY_LABELS[activeLevel]}
          </h3>
          
          <p className="text-gray-500 mb-4 max-w-md">
            Aucune activité détectée pour ce niveau BCB sur la période sélectionnée.
          </p>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            iconLeft={<RotateCcw className="w-4 h-4" />}
          >
            Actualiser
          </Button>
        </div>
      )}
    </section>
  );
};

export const MemoizedMarketShareSection = React.memo(MarketShareSection);