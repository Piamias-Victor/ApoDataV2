// src/components/organisms/PharmaciesKpisSection/PharmaciesKpisSection.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { RotateCcw, Building2 } from 'lucide-react';
import { usePharmaciesKpiMetrics } from '@/hooks/pharmacies/usePharmaciesKpiMetrics';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { Button } from '@/components/atoms/Button/Button';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { KpiCard } from '@/components/molecules/KpiCard/KpiCard';
import { KpiCardSkeleton } from '@/components/molecules/KpiCard/KpiCardSkeleton';
import { CsvExporter } from '@/utils/export/csvExporter';

interface PharmaciesKpisSectionProps {
  readonly dateRange: { start: string; end: string };
  readonly comparisonDateRange?: { start: string | null; end: string | null };
  readonly filters?: {
    products?: string[];
    laboratories?: string[];
    categories?: string[];
    pharmacies?: string[];
  };
  readonly includeComparison?: boolean;
  readonly onRefresh?: () => void;
  readonly className?: string;
}

/**
 * PharmaciesKpisSection - Organism pour KPIs analyse pharmacies
 * Accessible uniquement aux admins
 */
export const PharmaciesKpisSection: React.FC<PharmaciesKpisSectionProps> = ({
  dateRange,
  comparisonDateRange,
  filters = {},
  includeComparison = false,
  onRefresh,
  className = ''
}) => {
  // Hook KPI pharmacies
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    hasData 
  } = usePharmaciesKpiMetrics({
    enabled: true,
    includeComparison,
    dateRange: dateRange,
    comparisonDateRange: includeComparison ? comparisonDateRange : undefined,
    filters
  });

  // Hook export CSV
  const { exportToCsv, isExporting } = useExportCsv();

  // Préparation données pour export CSV
  const prepareKpiDataForExport = useCallback(() => {
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
    
    // Export de tous les KPIs pharmacies
    exportData.push({
      'Indicateur': 'Pharmacies Vendeuses',
      'Valeur': data.nb_pharmacies_vendeuses,
      'Unité': 'pharmacies',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.nb_pharmacies_vendeuses || '',
      'Période précédente': comparisonPeriod
    });
    
    exportData.push({
      'Indicateur': '% Pharmacies Vendeuses',
      'Valeur': data.pct_pharmacies_vendeuses_selection,
      'Unité': '%',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.pct_pharmacies_vendeuses_selection || '',
      'Période précédente': comparisonPeriod
    });
    
    exportData.push({
      'Indicateur': 'Pharmacies 80% CA',
      'Valeur': data.nb_pharmacies_80pct_ca,
      'Unité': 'pharmacies',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.nb_pharmacies_80pct_ca || '',
      'Période précédente': comparisonPeriod
    });
    
    exportData.push({
      'Indicateur': '% Pharmacies 80% CA',
      'Valeur': data.pct_pharmacies_80pct_ca,
      'Unité': '%',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.pct_pharmacies_80pct_ca || '',
      'Période précédente': comparisonPeriod
    });
    
    exportData.push({
      'Indicateur': 'CA Moyen/Pharmacie',
      'Valeur': data.ca_moyen_pharmacie,
      'Unité': '€',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.ca_moyen_pharmacie || '',
      'Période précédente': comparisonPeriod
    });
    
    exportData.push({
      'Indicateur': 'CA Médian/Pharmacie',
      'Valeur': data.ca_median_pharmacie,
      'Unité': '€',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.ca_median_pharmacie || '',
      'Période précédente': comparisonPeriod
    });
    
    exportData.push({
      'Indicateur': 'Quantité Moyenne/Pharmacie',
      'Valeur': data.quantite_moyenne_pharmacie,
      'Unité': 'unités',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.quantite_moyenne_pharmacie || '',
      'Période précédente': comparisonPeriod
    });
    
    exportData.push({
      'Indicateur': 'Quantité Médiane/Pharmacie',
      'Valeur': data.quantite_mediane_pharmacie,
      'Unité': 'unités',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.quantite_mediane_pharmacie || '',
      'Période précédente': comparisonPeriod
    });
    
    exportData.push({
      'Indicateur': 'Taux Pénétration Produit',
      'Valeur': data.taux_penetration_produit_pct,
      'Unité': '%',
      'Période actuelle': currentPeriod,
      'Valeur précédente': data.comparison?.taux_penetration_produit_pct || '',
      'Période précédente': comparisonPeriod
    });
    
    return exportData;
  }, [data, dateRange, comparisonDateRange, includeComparison]);

  // Handler export avec vérification
  const handleExport = useCallback(() => {
    const exportData = prepareKpiDataForExport();
    
    if (exportData.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }
    
    const filename = CsvExporter.generateFilename('apodata_pharmacies_kpis');
    
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
  }, [prepareKpiDataForExport, exportToCsv]);

  // Handler refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // Message d'erreur contextuel
  const errorMessage = useMemo(() => {
    if (!error) return null;
    
    // Dans useStandardFetch, error est de type string | null
    const errorString = error;
    
    if (errorString.includes('Unauthorized')) {
      return 'Accès non autorisé. Cette fonctionnalité est réservée aux administrateurs.';
    }
    if (errorString.includes('filters')) {
      return 'Des filtres produits ou pharmacies sont requis pour cette analyse.';
    }
    return 'Une erreur est survenue lors du chargement des KPIs pharmacies.';
  }, [error]);

  // État empty avec données insignifiantes
  const isEmpty = useMemo(() => {
    return hasData && data && data.nb_pharmacies_vendeuses === 0;
  }, [hasData, data]);

  // Rendu états d'erreur
  if (error) {
    return (
      <section className={`px-6 py-6 ${className}`}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Analyse Pharmacies
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
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Analyse Pharmacies
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Performance de vos produits à travers le réseau pharmaceutique
          </p>
        </div>
        
        {/* Boutons d'action */}
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
      
      {/* Grille KPI responsive - 5 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        
        {/* État Loading : 5 skeletons */}
        {isLoading && (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        )}
        
        {/* État Success : KPI cards pharmacies */}
        {!isLoading && data && (
          <>
            {/* Card 1: Pharmacies vendeuses */}
            <KpiCard
              title="Pharmacies Vendeuses"
              value={data.nb_pharmacies_vendeuses}
              unit="pharmacies"
              comparison={data.comparison ? {
                value: data.comparison.nb_pharmacies_vendeuses,
                trend: data.nb_pharmacies_vendeuses > data.comparison.nb_pharmacies_vendeuses ? 'up' : 
                       data.nb_pharmacies_vendeuses < data.comparison.nb_pharmacies_vendeuses ? 'down' : 'stable'
              } : undefined}
              variant="primary"
              subtitle={`${data.pct_pharmacies_vendeuses_selection}% de la sélection`}
            />
            
            {/* Card 2: Concentration Pareto */}
            <KpiCard
              title="Concentration 80% CA"
              value={data.nb_pharmacies_80pct_ca}
              unit="pharmacies"
              comparison={data.comparison ? {
                value: data.comparison.nb_pharmacies_80pct_ca,
                trend: data.nb_pharmacies_80pct_ca > data.comparison.nb_pharmacies_80pct_ca ? 'up' : 
                       data.nb_pharmacies_80pct_ca < data.comparison.nb_pharmacies_80pct_ca ? 'down' : 'stable'
              } : undefined}
              variant="warning"
              subtitle={`${data.pct_pharmacies_80pct_ca}% du réseau vendeur`}
            />
            
            {/* Card 3: CA Médian */}
            <KpiCard
              title="CA Médian/Pharmacie"
              value={data.ca_median_pharmacie}
              unit="currency"
              comparison={data.comparison ? {
                value: data.comparison.ca_median_pharmacie,
                trend: data.ca_median_pharmacie > data.comparison.ca_median_pharmacie ? 'up' : 
                       data.ca_median_pharmacie < data.comparison.ca_median_pharmacie ? 'down' : 'stable'
              } : undefined}
              variant="success"
              subtitle={`Moy: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(data.ca_moyen_pharmacie)}`}
            />
            
            {/* Card 4: Quantité Médiane */}
            <KpiCard
              title="Qté Médiane/Pharmacie"
              value={data.quantite_mediane_pharmacie}
              unit="number"
              comparison={data.comparison ? {
                value: data.comparison.quantite_mediane_pharmacie,
                trend: data.quantite_mediane_pharmacie > data.comparison.quantite_mediane_pharmacie ? 'up' : 
                       data.quantite_mediane_pharmacie < data.comparison.quantite_mediane_pharmacie ? 'down' : 'stable'
              } : undefined}
              variant="primary"
              subtitle={`Moy: ${new Intl.NumberFormat('fr-FR').format(data.quantite_moyenne_pharmacie)}`}
            />
            
            {/* Card 5: Taux de Pénétration */}
            <KpiCard
              title="Taux Pénétration"
              value={data.taux_penetration_produit_pct}
              unit="percentage"
              comparison={data.comparison ? {
                value: data.comparison.taux_penetration_produit_pct,
                trend: data.taux_penetration_produit_pct > data.comparison.taux_penetration_produit_pct ? 'up' : 
                       data.taux_penetration_produit_pct < data.comparison.taux_penetration_produit_pct ? 'down' : 'stable'
              } : undefined}
              variant={data.taux_penetration_produit_pct > 50 ? 'success' : 'warning'}
              subtitle={`${data.pharmacies_avec_produit}/${data.total_pharmacies_reseau} pharmacies`}
            />
          </>
        )}
        
        {/* État Empty : message si pas de données */}
        {!isLoading && isEmpty && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-gray-400 mb-4">
              <Building2 className="w-12 h-12 mx-auto" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune donnée pharmacies
            </h3>
            
            <p className="text-gray-500 mb-4 max-w-md">
              Aucune pharmacie n'a vendu les produits sélectionnés sur cette période. 
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
        
      </div>
    </section>
  );
};