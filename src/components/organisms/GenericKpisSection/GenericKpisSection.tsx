// src/components/organisms/GenericKpisSection/GenericKpisSection.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { 
  RotateCcw, 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  DollarSign, 
  BarChart3, 
  Activity,
  ShoppingBag,
  Calendar,
  Hash,
  Percent,
  Globe
} from 'lucide-react';
import { useGenericKpiMetrics } from '@/hooks/generic-groups/useGenericKpiMetrics';
import { useGenericGroupStore } from '@/stores/useGenericGroupStore';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { Button } from '@/components/atoms/Button/Button';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { MemoizedKpiCard as KpiCard } from '@/components/molecules/KpiCard/KpiCard';
import { KpiCardSkeleton } from '@/components/molecules/KpiCard/KpiCardSkeleton';
import { MemoizedDualKpiCard as DualKpiCard } from '@/components/molecules/DualKpiCard/DualKpiCard';
import { CsvExporter } from '@/utils/export/csvExporter';
import { 
  transformKpiData, 
  validateKpiData, 
  getKpiErrorMessage, 
  hasSignificantKpiData, 
  groupKpisForDualCards 
} from '@/components/organisms/KpisSection/utils';

interface GenericKpisSectionProps {
  readonly dateRange: { start: string; end: string };
  readonly comparisonDateRange?: { start: string | null; end: string | null };
  readonly includeComparison?: boolean;
  readonly onRefresh?: () => void;
  readonly className?: string;
}

export const GenericKpisSection: React.FC<GenericKpisSectionProps> = ({
  dateRange,
  comparisonDateRange,
  includeComparison = false,
  onRefresh,
  className = ''
}) => {
  const selectedGroups = useGenericGroupStore((state) => state.selectedGroups);
  const selectedProducts = useGenericGroupStore((state) => state.selectedProducts);
  const selectedLaboratories = useGenericGroupStore((state) => state.selectedLaboratories);
  const productCodes = useGenericGroupStore((state) => state.productCodes);
  
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isGlobalMode
  } = useGenericKpiMetrics({
    enabled: true,
    includeComparison,
    dateRange: dateRange,
    comparisonDateRange: includeComparison ? comparisonDateRange : undefined
  });

  const { exportToCsv, isExporting } = useExportCsv();

  const transformedKpis = useMemo(() => {
    if (!data || !validateKpiData(data)) return null;
    return transformKpiData(data);
  }, [data]);

  const groupedKpis = useMemo(() => {
    if (!transformedKpis || transformedKpis.length < 10) return null;
    try {
      return groupKpisForDualCards(transformedKpis);
    } catch (error) {
      console.error('Error grouping KPIs:', error);
      return null;
    }
  }, [transformedKpis]);

  // Textes dynamiques selon le mode
  const headerText = useMemo(() => {
    if (isGlobalMode) {
      return 'KPI Globaux - Génériques & Référents';
    }
    if (selectedGroups.length === 1) {
      return `KPI - ${selectedGroups[0]?.generic_group || 'Groupe Générique'}`;
    }
    if (selectedGroups.length > 1) {
      return `KPI - ${selectedGroups.length} Groupes Génériques`;
    }
    if (selectedProducts.length > 0 || selectedLaboratories.length > 0) {
      const parts = [];
      if (selectedProducts.length > 0) parts.push(`${selectedProducts.length} produit${selectedProducts.length > 1 ? 's' : ''}`);
      if (selectedLaboratories.length > 0) parts.push(`${selectedLaboratories.length} labo${selectedLaboratories.length > 1 ? 's' : ''}`);
      return `KPI - ${parts.join(' + ')}`;
    }
    return 'KPI Génériques';
  }, [isGlobalMode, selectedGroups, selectedProducts, selectedLaboratories]);

  const subtitleText = useMemo(() => {
    if (isGlobalMode) {
      return 'Tous les produits génériques et référents';
    }
    if (selectedGroups.length === 1) {
      const group = selectedGroups[0];
      return `${group?.referent_name || 'Référent inconnu'} • ${productCodes.length} produit${productCodes.length > 1 ? 's' : ''}`;
    }
    if (selectedGroups.length > 1) {
      return `${productCodes.length} produits au total`;
    }
    if (selectedProducts.length > 0 || selectedLaboratories.length > 0) {
      return `${productCodes.length} produit${productCodes.length > 1 ? 's' : ''} sélectionné${productCodes.length > 1 ? 's' : ''}`;
    }
    return 'Indicateurs de performance';
  }, [isGlobalMode, selectedGroups, selectedProducts, selectedLaboratories, productCodes.length]);

  const prepareKpiDataForExport = useCallback(() => {
    if (!data) return [];
    
    const exportData = [];
    const formatDateRange = (start: string, end: string) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      return `${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`;
    };
    
    const currentPeriod = formatDateRange(dateRange.start, dateRange.end);
    const comparisonPeriod = comparisonDateRange && includeComparison ? 
      formatDateRange(comparisonDateRange.start || '', comparisonDateRange.end || '') : '';
    
    // Mode global
    if (isGlobalMode) {
      exportData.push({
        'Indicateur': 'Mode',
        'Valeur': 'Global - Génériques & Référents',
        'Unité': '',
        'Période actuelle': currentPeriod,
        'Valeur précédente': '',
        'Période précédente': '',
        'Evolution (%)': '',
        'Evolution (valeur)': ''
      });
    }
    // Mode groupe unique
    else if (selectedGroups.length === 1) {
      exportData.push({
        'Indicateur': 'Groupe Générique',
        'Valeur': selectedGroups[0]?.generic_group || 'N/A',
        'Unité': '',
        'Période actuelle': currentPeriod,
        'Valeur précédente': '',
        'Période précédente': '',
        'Evolution (%)': '',
        'Evolution (valeur)': ''
      });
      
      exportData.push({
        'Indicateur': 'Référent',
        'Valeur': selectedGroups[0]?.referent_name || 'N/A',
        'Unité': '',
        'Période actuelle': currentPeriod,
        'Valeur précédente': '',
        'Période précédente': '',
        'Evolution (%)': '',
        'Evolution (valeur)': ''
      });
    }
    // Mode groupes multiples
    else if (selectedGroups.length > 1) {
      exportData.push({
        'Indicateur': 'Groupes Génériques',
        'Valeur': `${selectedGroups.length} groupes sélectionnés`,
        'Unité': '',
        'Période actuelle': currentPeriod,
        'Valeur précédente': '',
        'Période précédente': '',
        'Evolution (%)': '',
        'Evolution (valeur)': ''
      });
      
      selectedGroups.forEach((group, index) => {
        exportData.push({
          'Indicateur': `Groupe ${index + 1}`,
          'Valeur': group.generic_group,
          'Unité': '',
          'Période actuelle': currentPeriod,
          'Valeur précédente': '',
          'Période précédente': '',
          'Evolution (%)': '',
          'Evolution (valeur)': ''
        });
      });
    }
    
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
      'Indicateur': 'Montant Achat HT',
      'Valeur': data.montant_achat_ht,
      'Unité': '€',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.montant_achat_ht || '',
      'Période précédente': comparisonPeriod,
      'Evolution (%)': data.comparison ? 
        ((data.montant_achat_ht - data.comparison.montant_achat_ht) / data.comparison.montant_achat_ht * 100).toFixed(2) : '',
      'Evolution (valeur)': data.comparison ? 
        (data.montant_achat_ht - data.comparison.montant_achat_ht).toFixed(2) : ''
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
      'Valeur': data.pourcentage_marge.toFixed(2),
      'Unité': '%',
      'Période actuelle': currentPeriod,
      'Valeur précédente': '',
      'Période précédente': '',
      'Evolution (%)': '',
      'Evolution (valeur)': ''
    });
    
    exportData.push({
      'Indicateur': 'Valeur Stock HT',
      'Valeur': data.valeur_stock_ht,
      'Unité': '€',
      'Période actuelle': currentPeriod,
      'Valeur précédente': '',
      'Période précédente': '',
      'Evolution (%)': '',
      'Evolution (valeur)': ''
    });
    
    exportData.push({
      'Indicateur': 'Quantité Stock',
      'Valeur': data.quantite_stock,
      'Unité': 'unités',
      'Période actuelle': currentPeriod,
      'Valeur précédente': '',
      'Période précédente': '',
      'Evolution (%)': '',
      'Evolution (valeur)': ''
    });
    
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
        (data.quantite_vendue - data.comparison.quantite_vendue).toFixed(0) : ''
    });
    
    exportData.push({
      'Indicateur': 'Quantité Achetée',
      'Valeur': data.quantite_achetee,
      'Unité': 'unités',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.quantite_achetee || '',
      'Période précédente': comparisonPeriod,
      'Evolution (%)': data.comparison ? 
        ((data.quantite_achetee - data.comparison.quantite_achetee) / data.comparison.quantite_achetee * 100).toFixed(2) : '',
      'Evolution (valeur)': data.comparison ? 
        (data.quantite_achetee - data.comparison.quantite_achetee).toFixed(0) : ''
    });
    
    exportData.push({
      'Indicateur': 'Jours de Stock',
      'Valeur': data.jours_de_stock !== null ? data.jours_de_stock.toFixed(0) : 'N/A',
      'Unité': 'jours',
      'Période actuelle': currentPeriod,
      'Valeur précédente': '',
      'Période précédente': '',
      'Evolution (%)': '',
      'Evolution (valeur)': ''
    });
    
    exportData.push({
      'Indicateur': 'Nb Références',
      'Valeur': data.nb_references_produits,
      'Unité': '',
      'Période actuelle': currentPeriod,
      'Valeur précédente': '',
      'Période précédente': '',
      'Evolution (%)': '',
      'Evolution (valeur)': ''
    });
    
    exportData.push({
      'Indicateur': 'Nb Pharmacies',
      'Valeur': data.nb_pharmacies,
      'Unité': '',
      'Période actuelle': currentPeriod,
      'Valeur précédente': '',
      'Période précédente': '',
      'Evolution (%)': '',
      'Evolution (valeur)': ''
    });

    return exportData;
  }, [data, dateRange, comparisonDateRange, includeComparison, isGlobalMode, selectedGroups]);

  const handleExport = useCallback(() => {
    const exportData = prepareKpiDataForExport();
    
    if (exportData.length === 0) {
      console.warn('No data to export');
      return;
    }

    const filename = CsvExporter.generateFilename(
      isGlobalMode ? 'apodata_kpi_generiques_global' : 'apodata_kpi_generiques'
    );
    const headers = Object.keys(exportData[0] || {});

    exportToCsv({ filename, headers, data: exportData });
  }, [exportToCsv, prepareKpiDataForExport, isGlobalMode]);

  const handleRefresh = useCallback(() => {
    console.log('🔄 Refreshing KPI data');
    refetch();
    if (onRefresh) {
      onRefresh();
    }
  }, [refetch, onRefresh]);

  const isEmpty = useMemo(() => {
    return data && !hasSignificantKpiData(data);
  }, [data]);

  if (error) {
    const errorMessage = getKpiErrorMessage(error);
    return (
      <section className={`px-6 py-6 ${className}`}>
        <div className="flex flex-col items-center justify-center py-12 text-center bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Erreur de chargement des KPI
          </h3>
          
          <p className="text-red-700 mb-4 max-w-md">{errorMessage}</p>
          
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-gray-900">{headerText}</h2>
              {isGlobalMode && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Globe className="w-3 h-3 mr-1" />
                  Global
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{subtitleText}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <ExportButton
            onClick={handleExport}
            isExporting={isExporting}
            disabled={!data || isLoading}
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        
        {isLoading && (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        )}
        
        {!isLoading && groupedKpis && (
          <>
            
            <DualKpiCard
              mainKpi={{
                title: groupedKpis.purchaseQuantity.main.title,
                value: groupedKpis.purchaseQuantity.main.value,
                unit: groupedKpis.purchaseQuantity.main.unit,
                comparison: groupedKpis.purchaseQuantity.main.comparison,
                icon: <TrendingUp className="w-4 h-4 text-green-600" />
              }}
              secondaryKpi={{
                title: groupedKpis.purchaseQuantity.secondary.title,
                value: groupedKpis.purchaseQuantity.secondary.value,
                unit: groupedKpis.purchaseQuantity.secondary.unit,
                comparison: groupedKpis.purchaseQuantity.secondary.comparison,
                icon: <ShoppingBag className="w-4 h-4 text-green-500" />
              }}
            />

            <DualKpiCard
              mainKpi={{
                title: groupedKpis.caSales.main.title,
                value: groupedKpis.caSales.main.value,
                unit: groupedKpis.caSales.main.unit,
                comparison: groupedKpis.caSales.main.comparison,
                icon: <ShoppingCart className="w-4 h-4 text-blue-600" />
              }}
              secondaryKpi={{
                title: groupedKpis.caSales.secondary.title,
                value: groupedKpis.caSales.secondary.value,
                unit: groupedKpis.caSales.secondary.unit,
                comparison: groupedKpis.caSales.secondary.comparison,
                icon: <Activity className="w-4 h-4 text-blue-500" />
              }}
            />
            
            <DualKpiCard
              mainKpi={{
                title: groupedKpis.margin.main.title,
                value: groupedKpis.margin.main.value,
                unit: groupedKpis.margin.main.unit,
                comparison: groupedKpis.margin.main.comparison,
                icon: <DollarSign className="w-4 h-4 text-orange-600" />
              }}
              secondaryKpi={{
                title: groupedKpis.margin.secondary.title,
                value: groupedKpis.margin.secondary.value,
                unit: groupedKpis.margin.secondary.unit,
                comparison: groupedKpis.margin.secondary.comparison,
                icon: <Percent className="w-4 h-4 text-orange-500" />
              }}
            />
            
            <DualKpiCard
              mainKpi={{
                title: groupedKpis.stock.main.title,
                value: groupedKpis.stock.main.value,
                unit: groupedKpis.stock.main.unit,
                comparison: groupedKpis.stock.main.comparison,
                icon: <Package className="w-4 h-4 text-purple-600" />
              }}
              secondaryKpi={{
                title: groupedKpis.stock.secondary.title,
                value: groupedKpis.stock.secondary.value,
                unit: groupedKpis.stock.secondary.unit,
                comparison: groupedKpis.stock.secondary.comparison,
                icon: <Hash className="w-4 h-4 text-purple-500" />
              }}
            />
            
            <KpiCard
              title={groupedKpis.stockDays.title}
              value={groupedKpis.stockDays.value}
              unit={groupedKpis.stockDays.unit}
              comparison={groupedKpis.stockDays.comparison}
              variant={groupedKpis.stockDays.variant}
              subtitle={groupedKpis.stockDays.subtitle}
              icon={<Calendar className="w-4 h-4 text-indigo-600" />}
            />
            
            <KpiCard
              title={groupedKpis.references.title}
              value={groupedKpis.references.value}
              unit={groupedKpis.references.unit}
              comparison={groupedKpis.references.comparison}
              variant={groupedKpis.references.variant}
              subtitle={groupedKpis.references.subtitle}
              icon={<BarChart3 className="w-4 h-4 text-teal-600" />}
            />
          </>
        )}
        
        {!isLoading && isEmpty && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune donnée disponible
            </h3>
            
            <p className="text-gray-500 mb-4 max-w-md">
              Aucune activité détectée pour la sélection sur la période.
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
              Les données KPI ne sont pas complètes pour l'affichage.
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

export const MemoizedGenericKpisSection = React.memo(GenericKpisSection);