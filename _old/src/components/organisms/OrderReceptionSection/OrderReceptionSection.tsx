// src/components/organisms/OrderReceptionSection/OrderReceptionSection.tsx

'use client';

import React, { useMemo, useCallback } from 'react';
import { 
  RotateCcw, 
  Package, 
  PackageCheck,
  Euro,
  TrendingDown,
  AlertTriangle,
  Activity,
  AlertCircle,
  Percent
} from 'lucide-react';
import { useOrderReceptionMetrics } from '@/hooks/ruptures/useOrderReceptionMetrics';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { Button } from '@/components/atoms/Button/Button';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { MemoizedDualKpiCard as DualKpiCard } from '@/components/molecules/DualKpiCard/DualKpiCard';
import { MemoizedTripleKpiCard as TripleKpiCard } from '@/components/molecules/TripleKpiCard/TripleKpiCard';
import { KpiCardSkeleton } from '@/components/molecules/KpiCard/KpiCardSkeleton';
import { CsvExporter } from '@/utils/export/csvExporter';

interface OrderReceptionSectionProps {
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

export const OrderReceptionSection: React.FC<OrderReceptionSectionProps> = ({
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
  } = useOrderReceptionMetrics({
    enabled: true,
    includeComparison,
    dateRange: dateRange,
    comparisonDateRange: includeComparison ? comparisonDateRange : undefined,
    filters
  });

  const { exportToCsv, isExporting } = useExportCsv();

  const groupedKpis = useMemo(() => {
    if (!data) return null;

    const calculateEvolution = (current: number, previous?: number) => {
      if (!previous || previous === 0) return undefined;
      const percentage = ((current - previous) / previous) * 100;
      return {
        value: previous,
        percentage,
        trend: percentage > 0 ? 'up' as const : percentage < 0 ? 'down' as const : 'neutral' as const
      };
    };

    const tauxReceptionQuantite = data.quantite_commandee > 0 
      ? (data.quantite_receptionnee / data.quantite_commandee) * 100 
      : 0;

    const tauxReceptionQuantiteComparison = data.comparison && data.comparison.quantite_commandee > 0
      ? (data.comparison.quantite_receptionnee / data.comparison.quantite_commandee) * 100
      : undefined;

    return {
      quantities: {
        main: {
          title: 'Quantité Commandée',
          value: data.quantite_commandee,
          unit: 'number' as const,
          comparison: data.comparison ? 
            calculateEvolution(data.quantite_commandee, data.comparison.quantite_commandee) : 
            undefined
        },
        secondary: {
          title: 'Quantité Réceptionnée',
          value: data.quantite_receptionnee,
          unit: 'number' as const,
          comparison: data.comparison ? 
            calculateEvolution(data.quantite_receptionnee, data.comparison.quantite_receptionnee) : 
            undefined
        },
        tertiary: {
          title: 'Taux Réception',
          value: tauxReceptionQuantite,
          unit: 'percentage' as const,
          comparison: tauxReceptionQuantiteComparison !== undefined ? 
            calculateEvolution(tauxReceptionQuantite, tauxReceptionQuantiteComparison) : 
            undefined
        }
      },
      amounts: {
        main: {
          title: 'Montant Commandé HT',
          value: data.montant_commande_ht,
          unit: 'currency' as const,
          comparison: data.comparison ? 
            calculateEvolution(data.montant_commande_ht, data.comparison.montant_commande_ht) : 
            undefined
        },
        secondary: {
          title: 'Montant Réceptionné HT',
          value: data.montant_receptionne_ht,
          unit: 'currency' as const,
          comparison: data.comparison ? 
            calculateEvolution(data.montant_receptionne_ht, data.comparison.montant_receptionne_ht) : 
            undefined
        }
      },
      deltas: {
        main: {
          title: 'Delta Montant',
          value: data.delta_montant,
          unit: 'currency' as const,
          comparison: data.comparison ? 
            calculateEvolution(data.delta_montant, data.comparison.delta_montant) : 
            undefined
        },
        secondary: {
          title: 'Delta Quantité',
          value: data.delta_quantite,
          unit: 'number' as const,
          comparison: data.comparison ? 
            calculateEvolution(data.delta_quantite, data.comparison.delta_quantite) : 
            undefined
        }
      },
      references: {
        main: {
          title: 'Références en Ecarts',
          value: data.nb_references_rupture,
          unit: 'number' as const,
          comparison: data.comparison ? 
            calculateEvolution(data.nb_references_rupture, data.comparison.nb_references_rupture) : 
            undefined
        },
        secondary: {
          title: 'Taux Références en Ecarts',
          value: data.taux_references_rupture,
          unit: 'percentage' as const,
          comparison: data.comparison ? 
            calculateEvolution(data.taux_references_rupture, data.comparison.taux_references_rupture) : 
            undefined
        }
      }
    };
  }, [data]);

  const prepareDataForExport = useCallback(() => {
    if (!data) return [];
    
    const formatDateRange = (start: string, end: string) => {
      return `${new Date(start).toLocaleDateString('fr-FR')} - ${new Date(end).toLocaleDateString('fr-FR')}`;
    };
    
    const currentPeriod = formatDateRange(dateRange.start, dateRange.end);
    const tauxReceptionQuantite = data.quantite_commandee > 0 
      ? (data.quantite_receptionnee / data.quantite_commandee) * 100 
      : 0;
    
    return [
      {
        'Indicateur': 'Quantité Commandée',
        'Valeur': data.quantite_commandee,
        'Unité': 'unités',
        'Période': currentPeriod
      },
      {
        'Indicateur': 'Quantité Réceptionnée',
        'Valeur': data.quantite_receptionnee,
        'Unité': 'unités',
        'Période': currentPeriod
      },
      {
        'Indicateur': 'Montant Commandé HT',
        'Valeur': data.montant_commande_ht,
        'Unité': '€',
        'Période': currentPeriod
      },
      {
        'Indicateur': 'Montant Réceptionné HT',
        'Valeur': data.montant_receptionne_ht,
        'Unité': '€',
        'Période': currentPeriod
      },
      {
        'Indicateur': 'Delta Quantité',
        'Valeur': data.delta_quantite,
        'Unité': 'unités',
        'Période': currentPeriod
      },
      {
        'Indicateur': 'Delta Montant',
        'Valeur': data.delta_montant,
        'Unité': '€',
        'Période': currentPeriod
      },
      {
        'Indicateur': 'Taux Réception Quantité',
        'Valeur': tauxReceptionQuantite.toFixed(2),
        'Unité': '%',
        'Période': currentPeriod
      },
      {
        'Indicateur': 'Références Total',
        'Valeur': data.nb_references_total,
        'Unité': 'références',
        'Période': currentPeriod
      },
      {
        'Indicateur': 'Références en Rupture',
        'Valeur': data.nb_references_rupture,
        'Unité': 'références',
        'Période': currentPeriod
      },
      {
        'Indicateur': 'Taux Références en Rupture',
        'Valeur': data.taux_references_rupture.toFixed(2),
        'Unité': '%',
        'Période': currentPeriod
      }
    ];
  }, [data, dateRange]);

  const handleExport = useCallback(() => {
    const exportData = prepareDataForExport();
    if (exportData.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }
    
    const filename = CsvExporter.generateFilename('commandes_receptions');
    
    const firstItem = exportData[0];
    if (!firstItem) {
      console.error('Données export invalides');
      return;
    }
    
    const headers = Object.keys(firstItem);
    
    exportToCsv({
      filename,
      headers,
      data: exportData
    });
  }, [prepareDataForExport, exportToCsv]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  if (error) {
    return (
      <section className={`${className}`}>
        <div className="flex flex-col items-center justify-center py-12 text-center bg-red-50 rounded-lg border border-red-200">
          <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Erreur de chargement
          </h3>
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
    <section className={`${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Commandes & Réceptions
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Suivi des écarts entre commandes et réceptions
          </p>
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
          >
            {isLoading ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <TripleKpiCard
              mainKpi={{
                ...groupedKpis.quantities.main,
                icon: <Package className="w-4 h-4 text-blue-600" />
              }}
              secondaryKpi={{
                ...groupedKpis.quantities.secondary,
                icon: <PackageCheck className="w-4 h-4 text-green-600" />
              }}
              tertiaryKpi={{
                ...groupedKpis.quantities.tertiary,
                icon: <Percent className="w-4 h-4 text-purple-600" />
              }}
            />
            
            <DualKpiCard
              mainKpi={{
                ...groupedKpis.amounts.main,
                icon: <Euro className="w-4 h-4 text-blue-600" />
              }}
              secondaryKpi={{
                ...groupedKpis.amounts.secondary,
                icon: <Euro className="w-4 h-4 text-green-600" />
              }}
            />
            
            <DualKpiCard
              mainKpi={{
                ...groupedKpis.deltas.main,
                icon: <TrendingDown className="w-4 h-4 text-orange-600" />
              }}
              secondaryKpi={{
                ...groupedKpis.deltas.secondary,
                icon: <Activity className="w-4 h-4 text-orange-500" />
              }}
            />
            
            <DualKpiCard
              mainKpi={{
                ...groupedKpis.references.main,
                icon: <AlertCircle className="w-4 h-4 text-red-600" />
              }}
              secondaryKpi={{
                ...groupedKpis.references.secondary,
                icon: <AlertCircle className="w-4 h-4 text-red-500" />
              }}
            />
          </>
        )}
        
        {!isLoading && hasData && !data && (
          <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg">
            <Package className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune donnée disponible
            </h3>
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
      </div>
    </section>
  );
};

export const MemoizedOrderReceptionSection = React.memo(OrderReceptionSection);