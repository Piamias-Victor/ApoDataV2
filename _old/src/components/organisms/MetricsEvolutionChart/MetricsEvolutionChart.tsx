// src/components/organisms/MetricsEvolutionChart/MetricsEvolutionChart.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { RotateCcw, Calendar, TrendingUp } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { Badge } from '@/components/atoms/Badge/Badge';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { useDailyMetrics } from '@/hooks/dashboard/useDailyMetrics';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { CsvExporter } from '@/utils/export/csvExporter';
import { aggregateDataByPeriod, prepareChartData, validateChartData, formatValueForTooltip } from './utils';
import type { MetricsEvolutionChartProps, ViewMode, DataMode, ChartDataPoint } from './types';

/**
 * MetricsEvolutionChart - Graphique évolution métriques pharmaceutiques
 * Avec export CSV intégré
 */
export const MetricsEvolutionChart: React.FC<MetricsEvolutionChartProps> = ({
  dateRange,
  filters = {},
  className = '',
  onRefresh
}) => {
  // États locaux
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [dataMode, setDataMode] = useState<DataMode>('values');

  // Hook daily metrics avec filtres
  const { data, isLoading, error, refetch, hasData, queryTime } = useDailyMetrics({
    enabled: true,
    dateRange,
    productCodes: filters.productCodes || [],
    pharmacyId: filters.pharmacyId
  });

  // Hook export CSV
  const { exportToCsv, isExporting } = useExportCsv();

  // Traitement des données avec agrégation
  const chartData = useMemo((): ChartDataPoint[] => {
    if (!data || data.length === 0) return [];

    try {
      const aggregatedData = aggregateDataByPeriod(data, viewMode);
      return prepareChartData(aggregatedData);
    } catch (error) {
      console.error('Erreur traitement données chart:', error);
      return [];
    }
  }, [data, viewMode, dataMode]);

  // Validation données
  const isValidData = useMemo(() => validateChartData(chartData), [chartData]);

  // Préparation données pour export CSV
  const prepareChartDataForExport = useCallback(() => {
    if (!chartData || chartData.length === 0) return [];
    
    // Formatage période pour lisibilité
    const formatPeriod = (period: string) => {
      // Si format date ISO, convertir en DD/MM/YYYY
      if (period.includes('-')) {
        const date = new Date(period);
        return date.toLocaleDateString('fr-FR');
      }
      return period;
    };
    
    // Export avec toutes les métriques
    return chartData.map(point => {
      const exportRow: any = {
        'Période': formatPeriod(point.period),
        'Type agrégation': viewMode === 'daily' ? 'Journalier' : viewMode === 'weekly' ? 'Hebdomadaire' : 'Mensuel',
        'Mode affichage': dataMode === 'cumulative' ? 'Cumulé' : 'Valeurs'
      };

      // Données de base
      exportRow['Ventes (CA TTC)'] = point.ventes || 0;
      exportRow['Achats'] = point.achats || 0;
      exportRow['Marge'] = point.marge || 0;
      exportRow['Stock'] = point.stock || 0;

      // Si mode cumulé, ajouter les valeurs cumulées
      if (dataMode === 'cumulative' && point.cumulVentes) {
        exportRow['Ventes cumulées'] = point.cumulVentes;
        exportRow['Achats cumulés'] = point.cumulAchats || 0;
        exportRow['Marge cumulée'] = point.cumulMarge || 0;
      }

      // Calculs additionnels
      if (point.ventes && point.achats) {
        const tauxMarge = ((point.marge || 0) / point.ventes) * 100;
        exportRow['Taux de marge (%)'] = tauxMarge.toFixed(2);
      }

      // Rotation stock si disponible
      if (point.stock && point.ventes) {
        const rotationStock = (point.ventes * 30) / point.stock; // Approximation mensuelle
        exportRow['Rotation stock (jours)'] = rotationStock.toFixed(1);
      }

      return exportRow;
    });
  }, [chartData, viewMode, dataMode]);

  // Handler export
  const handleExport = useCallback(() => {
    const exportData = prepareChartDataForExport();
    
    if (exportData.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }
    
    const filename = CsvExporter.generateFilename('apodata_evolution_metriques');
    
    // Vérification et extraction des headers
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
  }, [prepareChartDataForExport, exportToCsv]);

  // Handlers existants
  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleDataModeToggle = useCallback(() => {
    setDataMode(prev => prev === 'values' ? 'cumulative' : 'values');
  }, []);

  // Rendu conditionnel - Loading
  if (isLoading) {
    return (
      <section className={`space-y-6 ${className}`}>
        <Card variant="elevated" padding="lg">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
            <div className="h-80 bg-gray-100 rounded-lg"></div>
          </div>
        </Card>
      </section>
    );
  }

  // Rendu conditionnel - Error
  if (error) {
    return (
      <section className={`space-y-6 ${className}`}>
        <Card variant="elevated" padding="lg">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erreur de chargement
            </h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              {error}
            </p>
            <Button variant="primary" size="sm" onClick={handleRefresh} iconLeft={<RotateCcw className="w-4 h-4" />}>
              Réessayer
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  // Rendu conditionnel - No Data
  if (!hasData || !isValidData || chartData.length === 0) {
    return (
      <section className={`space-y-6 ${className}`}>
        <Card variant="elevated" padding="lg">
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune donnée disponible
            </h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Aucune métrique trouvée pour la période sélectionnée. 
              Modifiez vos filtres ou la période d'analyse.
            </p>
            <Button variant="secondary" size="sm" onClick={handleRefresh} iconLeft={<RotateCcw className="w-4 h-4" />}>
              Actualiser
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-900 mb-3">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
              <span className="font-medium text-gray-900">
                {entry.dataKey?.includes('stock') 
                  ? formatValueForTooltip(entry.value as number, 'number')
                  : formatValueForTooltip(entry.value as number, 'currency')
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Configuration couleurs cohérentes avec design system
  const chartColors = {
    ventes: '#3b82f6',      // blue-500
    achats: '#22c55e',      // green-500  
    marge: '#f59e0b',       // orange-500
    stock: '#a855f7'        // purple-500
  };

  return (
    <section className={`bg-transparent space-y-6 ${className}`}>
      <div>
        {/* Header avec contrôles */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Évolution des Métriques
              </h2>
              <p className="text-sm text-gray-600">
                Analyse temporelle des performances pharmaceutiques
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Toggle Valeurs/Cumul */}
            <Button
              variant={dataMode === 'cumulative' ? 'primary' : 'secondary'}
              size="sm"
              onClick={handleDataModeToggle}
            >
              {dataMode === 'cumulative' ? 'Cumul' : 'Valeurs'}
            </Button>

            {/* Sélecteur période */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
              {(['daily', 'weekly', 'monthly'] as ViewMode[]).map(mode => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange(mode)}
                >
                  {mode === 'daily' ? 'Jour' : mode === 'weekly' ? 'Semaine' : 'Mois'}
                </Button>
              ))}
            </div>

            {/* Export CSV + Refresh + stats */}
            <div className="flex items-center space-x-2">
              <ExportButton
                onClick={handleExport}
                isExporting={isExporting}
                disabled={!chartData || chartData.length === 0}
              />
              
              <Badge variant="gray" size="sm">
                {queryTime}ms
              </Badge>
              
              <Button
                variant="ghost" 
                size="sm"
                onClick={handleRefresh}
                iconLeft={<RotateCcw className="w-4 h-4" />}
              >
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Graphique */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="period"
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value: any) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                  return value.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Courbes */}
              <Line
                type="monotone"
                dataKey={dataMode === 'cumulative' ? 'cumulVentes' : 'ventes'}
                name="Ventes (CA TTC)"
                stroke={chartColors.ventes}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey={dataMode === 'cumulative' ? 'cumulAchats' : 'achats'}
                name="Achats"
                stroke={chartColors.achats}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey={dataMode === 'cumulative' ? 'cumulMarge' : 'marge'}
                name="Marge"
                stroke={chartColors.marge}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="stock"
                name="Stock"
                stroke={chartColors.stock}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                strokeDasharray={dataMode === 'cumulative' ? '5 5' : undefined}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Info export */}
        {chartData && chartData.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              {chartData.length} points de données • 
              Mode {viewMode === 'daily' ? 'journalier' : viewMode === 'weekly' ? 'hebdomadaire' : 'mensuel'} • 
              {dataMode === 'cumulative' ? 'Valeurs cumulées' : 'Valeurs brutes'}
            </span>
            <span className="text-xs">
              Export CSV disponible avec toutes les métriques
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

// Export memoized pour performance
export const MemoizedMetricsEvolutionChart = React.memo(MetricsEvolutionChart);