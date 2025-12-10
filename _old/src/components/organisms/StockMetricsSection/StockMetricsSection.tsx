// src/components/organisms/StockMetricsSection/StockMetricsSection.tsx
// Supprime l'interface inutilisée et ajoute un log

'use client';

import React, { useMemo, useCallback, useEffect } from 'react';
import { 
  RotateCcw, 
  Package, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Hash,
  PackageCheck,
  Euro
} from 'lucide-react';
import { useStockMetrics } from '@/hooks/dashboard/useStockMetrics';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { Button } from '@/components/atoms/Button/Button';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { MemoizedKpiCard as KpiCard } from '@/components/molecules/KpiCard/KpiCard';
import { MemoizedDualKpiCard as DualKpiCard } from '@/components/molecules/DualKpiCard/DualKpiCard';
import { KpiCardSkeleton } from '@/components/molecules/KpiCard/KpiCardSkeleton';
import { CsvExporter } from '@/utils/export/csvExporter';

interface StockMetricsSectionProps {
  readonly dateRange: { start: string; end: string };
  readonly comparisonDateRange?: { start: string | null; end: string | null } | undefined;
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

export const StockMetricsSection: React.FC<StockMetricsSectionProps> = ({
  dateRange,
  comparisonDateRange,
  filters = {},
  includeComparison = false,
  onRefresh,
  className = ''
}) => {
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    hasData 
  } = useStockMetrics({
    enabled: true,
    includeComparison,
    dateRange: dateRange,
    comparisonDateRange: includeComparison ? comparisonDateRange : undefined,
    filters
  });

  const { exportToCsv, isExporting } = useExportCsv();

  // Log pour débugger
  useEffect(() => {
    if (data) {
      console.log('🔍 StockMetrics Data:', {
        quantite_commandee: data.quantite_commandee,
        quantite_receptionnee: data.quantite_receptionnee,
        montant_commande_ht: data.montant_commande_ht,
        montant_receptionne_ht: data.montant_receptionne_ht,
        hasComparison: !!data.comparison
      });
    }
  }, [data]);

  const prepareStockMetricsDataForExport = useCallback(() => {
    if (!data) return [];
    
    const formatDateRange = (start: string, end: string) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      return `${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`;
    };
    
    const currentPeriod = formatDateRange(dateRange.start, dateRange.end);
    const comparisonPeriod = comparisonDateRange && includeComparison
      ? formatDateRange(comparisonDateRange.start || '', comparisonDateRange.end || '')
      : '';
    
    const formatFiltersContext = () => {
      const filterInfo = [];
      if (filters.products && filters.products.length > 0) {
        filterInfo.push(`${filters.products.length} produit(s)`);
      }
      if (filters.laboratories && filters.laboratories.length > 0) {
        filterInfo.push(`${filters.laboratories.length} laboratoire(s)`);
      }
      if (filters.categories && filters.categories.length > 0) {
        filterInfo.push(`${filters.categories.length} catégorie(s)`);
      }
      if (filters.pharmacies && filters.pharmacies.length > 0) {
        filterInfo.push(`${filters.pharmacies.length} pharmacie(s)`);
      }
      return filterInfo.length > 0 ? filterInfo.join(', ') : 'Tous les produits';
    };
    
    const filtersContext = formatFiltersContext();
    
    const safeNumber = (value: any, defaultValue: number = 0): number => {
      const num = Number(value);
      return (value === null || value === undefined || isNaN(num)) ? defaultValue : num;
    };
    
    return [
      {
        'Métrique': 'Quantité Stock Actuel',
        'Valeur': safeNumber(data.quantite_stock_actuel_total),
        'Unité': 'unités',
        'Période actuelle': currentPeriod,
        'Valeur précédente': data.comparison?.quantite_stock_actuel_total || '',
        'Période précédente': comparisonPeriod,
        'Périmètre': filtersContext
      },
      {
        'Métrique': 'Valeur Stock Actuel',
        'Valeur': safeNumber(data.montant_stock_actuel_total).toFixed(2),
        'Unité': '€',
        'Période actuelle': currentPeriod,
        'Valeur précédente': data.comparison?.montant_stock_actuel_total?.toFixed(2) || '',
        'Période précédente': comparisonPeriod,
        'Périmètre': filtersContext
      },
      {
        'Métrique': 'Stock Moyen 12 Mois',
        'Valeur': safeNumber(data.stock_moyen_12_mois),
        'Unité': 'unités',
        'Période actuelle': currentPeriod,
        'Périmètre': filtersContext
      },
      {
        'Métrique': 'Jours de Stock',
        'Valeur': safeNumber(data.jours_de_stock_actuels),
        'Unité': 'jours',
        'Période actuelle': currentPeriod,
        'Périmètre': filtersContext
      },
      {
        'Métrique': 'Quantité Commandée',
        'Valeur': safeNumber(data.quantite_commandee),
        'Unité': 'unités',
        'Période actuelle': currentPeriod,
        'Valeur précédente': data.comparison?.quantite_commandee || '',
        'Période précédente': comparisonPeriod,
        'Périmètre': filtersContext
      },
      {
        'Métrique': 'Quantité Réceptionnée',
        'Valeur': safeNumber(data.quantite_receptionnee),
        'Unité': 'unités',
        'Période actuelle': currentPeriod,
        'Valeur précédente': data.comparison?.quantite_receptionnee || '',
        'Période précédente': comparisonPeriod,
        'Périmètre': filtersContext
      },
      {
        'Métrique': 'Montant Commandé HT',
        'Valeur': safeNumber(data.montant_commande_ht).toFixed(2),
        'Unité': '€',
        'Période actuelle': currentPeriod,
        'Valeur précédente': data.comparison?.montant_commande_ht?.toFixed(2) || '',
        'Période précédente': comparisonPeriod,
        'Périmètre': filtersContext
      },
      {
        'Métrique': 'Montant Réceptionné HT',
        'Valeur': safeNumber(data.montant_receptionne_ht).toFixed(2),
        'Unité': '€',
        'Période actuelle': currentPeriod,
        'Valeur précédente': data.comparison?.montant_receptionne_ht?.toFixed(2) || '',
        'Période précédente': comparisonPeriod,
        'Périmètre': filtersContext
      }
    ];
  }, [data, dateRange, comparisonDateRange, includeComparison, filters]);

  const handleExport = useCallback(() => {
    const exportData = prepareStockMetricsDataForExport();
    
    if (exportData.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }
    
    const filename = CsvExporter.generateFilename('apodata_metriques_stock');
    
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
  }, [prepareStockMetricsDataForExport, exportToCsv]);

  const groupedKpis = useMemo(() => {
    if (!data) return null;

    const formatComparison = (current: number | null, comparison: number | null | undefined) => {
      if (current === null || comparison === null || comparison === undefined || comparison === 0) return undefined;
      
      const percentageChange = ((current - comparison) / comparison) * 100;
      const trend: 'up' | 'down' | 'neutral' = 
        percentageChange > 2 ? 'up' : 
        percentageChange < -2 ? 'down' : 'neutral';

      return {
        value: percentageChange,
        percentage: percentageChange,
        trend
      };
    };

    const getStockVariant = (value: number): 'primary' | 'warning' => {
      return value > 0 ? 'primary' : 'warning';
    };

    const getValueVariant = (value: number): 'success' | 'warning' => {
      return value > 0 ? 'success' : 'warning';
    };

    const getDaysVariant = (days: number | null): 'warning' | 'primary' | 'success' => {
      if (days === null) return 'warning';
      if (days > 90) return 'warning';
      if (days > 30) return 'primary';
      return 'success';
    };

    return {
      stock: [
        {
          title: 'Quantité Stock Actuel',
          value: data.quantite_stock_actuel_total || 0,
          unit: 'number' as const,
          comparison: formatComparison(
            data.quantite_stock_actuel_total, 
            data.comparison?.quantite_stock_actuel_total ?? null
          ),
          variant: getStockVariant(data.quantite_stock_actuel_total),
          subtitle: `${data.nb_references_produits} références`,
          icon: <Hash className="w-4 h-4 text-blue-600" />
        },
        {
          title: 'Valeur Stock Actuel',
          value: data.montant_stock_actuel_total || 0,
          unit: 'currency' as const,
          comparison: formatComparison(
            data.montant_stock_actuel_total, 
            data.comparison?.montant_stock_actuel_total ?? null
          ),
          variant: getValueVariant(data.montant_stock_actuel_total),
          subtitle: `${data.nb_pharmacies} pharmacie${data.nb_pharmacies > 1 ? 's' : ''}`,
          icon: <DollarSign className="w-4 h-4 text-green-600" />
        },
        {
          title: 'Stock Moyen 12 Mois',
          value: data.stock_moyen_12_mois || 0,
          unit: 'number' as const,
          comparison: formatComparison(
            data.stock_moyen_12_mois, 
            data.comparison?.stock_moyen_12_mois ?? null
          ),
          variant: 'secondary' as const,
          subtitle: 'Moyenne historique',
          icon: <TrendingUp className="w-4 h-4 text-purple-600" />
        },
        {
          title: 'Jours de Stock',
          value: data.jours_de_stock_actuels || 0,
          unit: 'days' as const,
          comparison: formatComparison(
            data.jours_de_stock_actuels, 
            data.comparison?.jours_de_stock_actuels ?? null
          ),
          variant: getDaysVariant(data.jours_de_stock_actuels),
          subtitle: data.jours_de_stock_actuels === null ? 
            'Calcul impossible' : 
            data.jours_de_stock_actuels > 90 ? 'Stock élevé' :
            data.jours_de_stock_actuels > 30 ? 'Stock normal' : 'Stock faible',
          icon: <Calendar className="w-4 h-4 text-orange-600" />
        }
      ],
      orders: {
        quantities: {
          main: {
            title: 'Quantité Commandée',
            value: data.quantite_commandee || 0,
            unit: 'number' as const,
            comparison: formatComparison(
              data.quantite_commandee,
              data.comparison?.quantite_commandee ?? null
            ),
            icon: <Package className="w-4 h-4 text-blue-600" />
          },
          secondary: {
            title: 'Quantité Réceptionnée',
            value: data.quantite_receptionnee || 0,
            unit: 'number' as const,
            comparison: formatComparison(
              data.quantite_receptionnee,
              data.comparison?.quantite_receptionnee ?? null
            ),
            icon: <PackageCheck className="w-4 h-4 text-green-600" />
          }
        },
        amounts: {
          main: {
            title: 'Montant Commandé HT',
            value: data.montant_commande_ht || 0,
            unit: 'currency' as const,
            comparison: formatComparison(
              data.montant_commande_ht,
              data.comparison?.montant_commande_ht ?? null
            ),
            icon: <Euro className="w-4 h-4 text-blue-600" />
          },
          secondary: {
            title: 'Montant Réceptionné HT',
            value: data.montant_receptionne_ht || 0,
            unit: 'currency' as const,
            comparison: formatComparison(
              data.montant_receptionne_ht,
              data.comparison?.montant_receptionne_ht ?? null
            ),
            icon: <Euro className="w-4 h-4 text-green-600" />
          }
        }
      }
    };
  }, [data]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  const errorMessage = useMemo(() => {
    if (!error) return null;
    
    if (error.includes('Date range')) {
      return 'Veuillez sélectionner une plage de dates valide dans les filtres.';
    }
    
    if (error.includes('timeout') || error.includes('network')) {
      return 'Problème de connexion. Vérifiez votre réseau et réessayez.';
    }
    
    return 'Une erreur est survenue lors du calcul des métriques de stock. Réessayez dans quelques instants.';
  }, [error]);

  const isEmpty = useMemo(() => {
    return hasData && data && (
      data.quantite_stock_actuel_total === 0 &&
      data.montant_stock_actuel_total === 0 &&
      data.stock_moyen_12_mois === 0 &&
      data.nb_references_produits === 0
    );
  }, [hasData, data]);

  if (error) {
    return (
      <section className={`px-6 py-6 ${className}`}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Métriques de Stock
          </h2>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12 text-center bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Erreur de chargement des métriques de stock
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Métriques de Stock & Commandes
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Vue d'ensemble de votre inventaire, rotation et commandes
          </p>
        </div>
        
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

      <div className="space-y-6">
        {/* Section Stock - 4 cards en ligne */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Stock Actuel</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading && (
              <>
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
              </>
            )}
            
            {!isLoading && groupedKpis && (
              <>
                {groupedKpis.stock.map((kpi, index) => (
                  <KpiCard
                    key={`stock-kpi-${index}`}
                    title={kpi.title}
                    value={kpi.value}
                    unit={kpi.unit}
                    comparison={kpi.comparison}
                    variant={kpi.variant}
                    subtitle={kpi.subtitle}
                    icon={kpi.icon}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Section Commandes - 2 DualKpiCards */}
        {!isLoading && groupedKpis && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Commandes & Réceptions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DualKpiCard
                mainKpi={groupedKpis.orders.quantities.main}
                secondaryKpi={groupedKpis.orders.quantities.secondary}
              />
              
              <DualKpiCard
                mainKpi={groupedKpis.orders.amounts.main}
                secondaryKpi={groupedKpis.orders.amounts.secondary}
              />
            </div>
          </div>
        )}

        {/* État Empty */}
        {!isLoading && isEmpty && (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-gray-400 mb-4">
              <Package className="w-12 h-12 mx-auto" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune donnée de stock disponible
            </h3>
            
            <p className="text-gray-500 mb-4 max-w-md">
              Aucun stock détecté sur la période sélectionnée. 
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
        {!isLoading && !groupedKpis && !isEmpty && (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Données incomplètes
            </h3>
            
            <p className="text-yellow-700 mb-4 max-w-md">
              Les données de stock ne sont pas complètes pour l'affichage.
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

export const MemoizedStockMetricsSection = React.memo(StockMetricsSection);