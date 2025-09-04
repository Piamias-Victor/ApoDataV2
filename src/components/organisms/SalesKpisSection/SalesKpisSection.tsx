// src/components/organisms/SalesKpisSection/SalesKpisSection.tsx

'use client';

import React, { useMemo, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { useSalesKpiMetrics } from '@/hooks/ventes/useSalesKpiMetrics';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { Button } from '@/components/atoms/Button/Button';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { KpiCardSkeleton } from '@/components/molecules/KpiCard/KpiCardSkeleton';
import { MemoizedDualKpiCard as DualKpiCard } from '@/components/molecules/DualKpiCard/DualKpiCard';
import { CsvExporter } from '@/utils/export/csvExporter';
import type { SalesKpisSectionProps } from './types';
import { 
  transformSalesKpiData, 
  validateSalesKpiData, 
  getSalesKpiErrorMessage, 
  hasSignificantSalesKpiData, 
  groupSalesKpisForDualCards 
} from './utils';

/**
 * SalesKpisSection - KPI spécialisés page ventes
 * Avec export CSV intégré
 * 
 * Features :
 * - 4 DualKpiCard : Quantités/CA, Parts marché, Références, Marge
 * - Hook useSalesKpiMetrics dédié
 * - États loading/error/empty cohérents
 * - Design identique KpisSection
 * - Performance optimisée React.memo + useMemo
 * - Export CSV complet avec données de comparaison
 */
export const SalesKpisSection: React.FC<SalesKpisSectionProps> = ({
  dateRange,
  comparisonDateRange,
  filters = {},
  includeComparison = false,
  onRefresh,
  className = ''
}) => {
  // Hook KPI ventes avec parts de marché
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    hasData 
  } = useSalesKpiMetrics({
    enabled: true,
    includeComparison,
    dateRange: dateRange,
    comparisonDateRange: includeComparison ? comparisonDateRange : undefined,
    filters
  });

  // Hook export CSV
  const { exportToCsv, isExporting } = useExportCsv();

  // Validation et transformation données
  const transformedKpis = useMemo(() => {
    if (!data || !validateSalesKpiData(data)) return null;
    return transformSalesKpiData(data);
  }, [data]);

  // Regroupement pour cards doubles
  const groupedKpis = useMemo(() => {
    if (!transformedKpis || transformedKpis.length < 8) return null;
    try {
      return groupSalesKpisForDualCards(transformedKpis);
    } catch (error) {
      console.error('Error grouping Sales KPIs:', error);
      return null;
    }
  }, [transformedKpis]);

  // Préparation données pour export CSV
  const prepareSalesKpiDataForExport = useCallback(() => {
    if (!data) return [];
    
    const exportData = [];
    
    // Formatage période
    const formatDateRange = (start: string, end: string) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      return `${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`;
    };
    
    const currentPeriod = formatDateRange(dateRange.start, dateRange.end);
    const comparisonPeriod = comparisonDateRange && includeComparison ? 
      formatDateRange(comparisonDateRange.start || '', comparisonDateRange.end || '') : '';
    
    // Export de tous les KPI ventes avec valeurs et comparaisons
    exportData.push({
      'Indicateur': 'Quantité Vendue',
      'Valeur': data.quantite_vendue,
      'Unité': 'unités',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.quantite_vendue || '',
      'Période précédente': comparisonPeriod,
      'Evolution (%)': data.comparison ? 
        ((data.quantite_vendue - data.comparison.quantite_vendue) / data.comparison.quantite_vendue * 100).toFixed(2) : '',
      'Evolution (valeur)': data.comparison ? 
        (data.quantite_vendue - data.comparison.quantite_vendue) : ''
    });
    
    exportData.push({
      'Indicateur': 'CA TTC',
      'Valeur': data.ca_ttc,
      'Unité': '€',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.ca_ttc || '',
      'Période précédente': comparisonPeriod,
      'Evolution (%)': data.comparison ? 
        ((data.ca_ttc - data.comparison.ca_ttc) / data.comparison.ca_ttc * 100).toFixed(2) : '',
      'Evolution (valeur)': data.comparison ? 
        (data.ca_ttc - data.comparison.ca_ttc).toFixed(2) : ''
    });
    
    exportData.push({
      'Indicateur': 'Part de Marché CA',
      'Valeur': data.part_marche_ca_pct.toFixed(2),
      'Unité': '%',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.part_marche_ca_pct?.toFixed(2) || '',
      'Période précédente': comparisonPeriod,
      'Evolution (%)': data.comparison ? 
        ((data.part_marche_ca_pct - data.comparison.part_marche_ca_pct) / data.comparison.part_marche_ca_pct * 100).toFixed(2) : '',
      'Evolution (valeur)': data.comparison ? 
        (data.part_marche_ca_pct - data.comparison.part_marche_ca_pct).toFixed(2) : ''
    });
    
    exportData.push({
      'Indicateur': 'Part de Marché Marge',
      'Valeur': data.part_marche_marge_pct.toFixed(2),
      'Unité': '%',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.part_marche_marge_pct?.toFixed(2) || '',
      'Période précédente': comparisonPeriod,
      'Evolution (%)': data.comparison ? 
        ((data.part_marche_marge_pct - data.comparison.part_marche_marge_pct) / data.comparison.part_marche_marge_pct * 100).toFixed(2) : '',
      'Evolution (valeur)': data.comparison ? 
        (data.part_marche_marge_pct - data.comparison.part_marche_marge_pct).toFixed(2) : ''
    });
    
    exportData.push({
      'Indicateur': 'Nb Références Sélection',
      'Valeur': data.nb_references_selection,
      'Unité': 'références',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.nb_references_selection || '',
      'Période précédente': comparisonPeriod,
      'Evolution (%)': data.comparison ? 
        ((data.nb_references_selection - data.comparison.nb_references_selection) / data.comparison.nb_references_selection * 100).toFixed(2) : '',
      'Evolution (valeur)': data.comparison ? 
        (data.nb_references_selection - data.comparison.nb_references_selection) : ''
    });
    
    exportData.push({
      'Indicateur': 'Nb Références 80% CA',
      'Valeur': data.nb_references_80pct_ca,
      'Unité': 'références',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.nb_references_80pct_ca || '',
      'Période précédente': comparisonPeriod,
      'Evolution (%)': data.comparison ? 
        ((data.nb_references_80pct_ca - data.comparison.nb_references_80pct_ca) / data.comparison.nb_references_80pct_ca * 100).toFixed(2) : '',
      'Evolution (valeur)': data.comparison ? 
        (data.nb_references_80pct_ca - data.comparison.nb_references_80pct_ca) : ''
    });
    
    exportData.push({
      'Indicateur': 'Montant Marge',
      'Valeur': data.montant_marge,
      'Unité': '€',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.montant_marge || '',
      'Période précédente': comparisonPeriod,
      'Evolution (%)': data.comparison ? 
        ((data.montant_marge - data.comparison.montant_marge) / data.comparison.montant_marge * 100).toFixed(2) : '',
      'Evolution (valeur)': data.comparison ? 
        (data.montant_marge - data.comparison.montant_marge).toFixed(2) : ''
    });
    
    exportData.push({
      'Indicateur': 'Taux de Marge',
      'Valeur': data.taux_marge_pct.toFixed(2),
      'Unité': '%',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.taux_marge_pct?.toFixed(2) || '',
      'Période précédente': comparisonPeriod,
      'Evolution (%)': data.comparison ? 
        ((data.taux_marge_pct - data.comparison.taux_marge_pct) / data.comparison.taux_marge_pct * 100).toFixed(2) : '',
      'Evolution (valeur)': data.comparison ? 
        (data.taux_marge_pct - data.comparison.taux_marge_pct).toFixed(2) : ''
    });
    
    return exportData;
  }, [data, dateRange, comparisonDateRange, includeComparison]);

  // Handler export avec vérification
  const handleExport = useCallback(() => {
    const exportData = prepareSalesKpiDataForExport();
    
    if (exportData.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }
    
    const filename = CsvExporter.generateFilename('apodata_kpis_ventes');
    
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
  }, [prepareSalesKpiDataForExport, exportToCsv]);

  // Handler refresh avec callback externe
  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // Message d'erreur contextuel
  const errorMessage = useMemo(() => {
    if (!error) return null;
    return getSalesKpiErrorMessage(error);
  }, [error]);

  // État empty avec données insignifiantes
  const isEmpty = useMemo(() => {
    return hasData && data && !hasSignificantSalesKpiData(data);
  }, [hasData, data]);

  // Rendu états d'erreur
  if (error) {
    return (
      <section className={`px-6 py-6 ${className}`}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            KPI Ventes
          </h2>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12 text-center bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Erreur de chargement des KPI Ventes
          </h3>
          
          <p className="text-red-700 mb-4 max-w-md">
            {errorMessage}
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
      {/* Header avec titre et boutons d'action */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            KPI Ventes
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Performance ventes avec parts de marché
          </p>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex items-center space-x-2">
          <ExportButton
            onClick={handleExport}
            isExporting={isExporting}
            disabled={!data || isLoading}
            label="Export CSV"
          />
          
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
        </div>
      </div>
      
      {/* Grille KPI responsive - 4 DualKpiCard en 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* État Loading : 4 skeletons */}
        {isLoading && (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        )}
        
        {/* État Success : KPI cards avec validation complète */}
        {!isLoading && groupedKpis && (
          <>
            {/* Card 1: Quantité Vendue / CA TTC */}
            <DualKpiCard
              mainKpi={{
                title: groupedKpis.quantityCa.main.title,
                value: groupedKpis.quantityCa.main.value,
                unit: groupedKpis.quantityCa.main.unit,
                comparison: groupedKpis.quantityCa.main.comparison
              }}
              secondaryKpi={{
                title: groupedKpis.quantityCa.secondary.title,
                value: groupedKpis.quantityCa.secondary.value,
                unit: groupedKpis.quantityCa.secondary.unit,
                comparison: groupedKpis.quantityCa.secondary.comparison
              }}
            />
            
            {/* Card 2: Part Marché CA / Part Marché Marge */}
            <DualKpiCard
              mainKpi={{
                title: groupedKpis.marketShare.main.title,
                value: groupedKpis.marketShare.main.value,
                unit: groupedKpis.marketShare.main.unit,
                comparison: groupedKpis.marketShare.main.comparison
              }}
              secondaryKpi={{
                title: groupedKpis.marketShare.secondary.title,
                value: groupedKpis.marketShare.secondary.value,
                unit: groupedKpis.marketShare.secondary.unit,
                comparison: groupedKpis.marketShare.secondary.comparison
              }}
            />
            
            {/* Card 3: Nb Références / % Références Vendues */}
            <DualKpiCard
              mainKpi={{
                title: groupedKpis.references.main.title,
                value: groupedKpis.references.main.value,
                unit: groupedKpis.references.main.unit,
                comparison: groupedKpis.references.main.comparison
              }}
              secondaryKpi={{
                title: groupedKpis.references.secondary.title,
                value: groupedKpis.references.secondary.value,
                unit: groupedKpis.references.secondary.unit,
                comparison: groupedKpis.references.secondary.comparison
              }}
            />
            
            {/* Card 4: Montant Marge / Taux Marge */}
            <DualKpiCard
              mainKpi={{
                title: groupedKpis.margin.main.title,
                value: groupedKpis.margin.main.value,
                unit: groupedKpis.margin.main.unit,
                comparison: groupedKpis.margin.main.comparison
              }}
              secondaryKpi={{
                title: groupedKpis.margin.secondary.title,
                value: groupedKpis.margin.secondary.value,
                unit: groupedKpis.margin.secondary.unit,
                comparison: groupedKpis.margin.secondary.comparison
              }}
            />
          </>
        )}
        
        {/* État Empty : message si pas de données significatives */}
        {!isLoading && isEmpty && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune donnée de vente
            </h3>
            
            <p className="text-gray-500 mb-4 max-w-md">
              Aucune activité de vente détectée sur la période sélectionnée. 
              Vérifiez vos filtres ou changez de période.
            </p>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              iconLeft={<RotateCcw className="w-4 h-4" />}
            >
              Actualiser les données
            </Button>
          </div>
        )}
        
        {/* État Error dans les données transformées */}
        {!isLoading && !groupedKpis && transformedKpis && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Données incomplètes
            </h3>
            
            <p className="text-yellow-700 mb-4 max-w-md">
              Les données KPI ventes ne sont pas complètes pour l'affichage.
              Essayez de modifier la période ou les filtres.
            </p>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              iconLeft={<RotateCcw className="w-4 h-4" />}
            >
              Recharger
            </Button>
          </div>
        )}
        
      </div>
    </section>
  );
};

// Performance optimization avec React.memo
export const MemoizedSalesKpisSection = React.memo(SalesKpisSection);