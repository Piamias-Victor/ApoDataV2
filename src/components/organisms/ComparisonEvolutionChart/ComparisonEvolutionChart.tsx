// src/components/organisms/ComparisonEvolutionChart/ComparisonEvolutionChart.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { RotateCcw, TrendingUp, ArrowLeftRight } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { useDailyMetrics } from '@/hooks/dashboard/useDailyMetrics';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { CsvExporter } from '@/utils/export/csvExporter';

interface ComparisonEvolutionChartProps {
  readonly className?: string;
  readonly onRefresh?: () => void;
}

type ViewMode = 'daily' | 'weekly' | 'monthly';
type MetricType = 'ca_ttc' | 'marge' | 'quantite_vendue';

interface ChartDataPoint {
  date: string;
  period: string;
  // Élément A
  ca_ttc_a: number;
  marge_a: number;
  quantite_a: number;
  // Élément B  
  ca_ttc_b: number;
  marge_b: number;
  quantite_b: number;
}

/**
 * ComparisonEvolutionChart - Graphique évolution comparative A vs B avec Export CSV
 * 
 * Features :
 * - Comparaison temporelle 2 éléments (courbes A/B)
 * - 3 métriques : CA TTC, Marge, Quantité vendue
 * - Agrégation jour/semaine/mois
 * - Design cohérent avec pages comparaisons
 * - Tooltip comparatif avec écarts
 * - Export CSV évolution comparative
 * - Légende claire A (bleu) vs B (violet)
 */
export const ComparisonEvolutionChart: React.FC<ComparisonEvolutionChartProps> = ({
  className = '',
  onRefresh
}) => {
  // Store states
  const { elementA, elementB } = useComparisonStore();
  const analysisDateRange = useFiltersStore(state => state.analysisDateRange);
  const pharmacyFilter = useFiltersStore(state => state.pharmacy);

  // États locaux
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('ca_ttc');

  // Hook export CSV
  const { exportToCsv, isExporting } = useExportCsv();

  // Fonction pour mapper element vers product codes
  const getProductCodes = useCallback((element: typeof elementA) => {
    if (!element) return [];
    
    switch (element.type) {
      case 'product':
        return [element.id];
      case 'laboratory':
      case 'category':
        return element.metadata.product_codes || [];
      default:
        return [];
    }
  }, []);

  // Hooks daily metrics pour chaque élément
  const { 
    data: dataA, 
    isLoading: loadingA, 
    error: errorA,
    refetch: refetchA 
  } = useDailyMetrics({
    enabled: !!elementA,
    dateRange: analysisDateRange,
    productCodes: getProductCodes(elementA),
    pharmacyId: pharmacyFilter.length > 0 ? pharmacyFilter[0] : undefined
  });

  const { 
    data: dataB, 
    isLoading: loadingB, 
    error: errorB,
    refetch: refetchB 
  } = useDailyMetrics({
    enabled: !!elementB,
    dateRange: analysisDateRange,
    productCodes: getProductCodes(elementB),
    pharmacyId: pharmacyFilter.length > 0 ? pharmacyFilter[0] : undefined
  });

  // États dérivés
  const isLoading = loadingA || loadingB;
  const error = errorA || errorB;

  // Agrégation des données par période
  const aggregateByPeriod = useCallback((data: any[], mode: ViewMode) => {
    if (!data || data.length === 0) return [];

    const grouped = new Map<string, any[]>();

    data.forEach(entry => {
      const date = new Date(entry.date);
      let key: string;

      switch (mode) {
        case 'daily':
          key = entry.date;
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0] || weekStart.toDateString();
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = entry.date;
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(entry);
    });

    return Array.from(grouped.entries()).map(([period, entries]) => ({
      period: formatPeriodLabel(period, mode),
      date: period,
      ca_ttc: entries.reduce((sum, e) => sum + e.ca_ttc_jour, 0),
      marge: entries.reduce((sum, e) => sum + e.marge_jour, 0),
      quantite_vendue: entries.reduce((sum, e) => sum + e.quantite_vendue_jour, 0)
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, []);

  // Format des labels de période
  const formatPeriodLabel = (period: string, mode: ViewMode): string => {
    const date = new Date(period);
    
    switch (mode) {
      case 'daily':
        return new Intl.DateTimeFormat('fr-FR', { 
          day: '2-digit', 
          month: '2-digit' 
        }).format(date);
      case 'weekly':
        return `S${Math.ceil(date.getDate() / 7)} ${new Intl.DateTimeFormat('fr-FR', { 
          month: 'short' 
        }).format(date)}`;
      case 'monthly':
        return new Intl.DateTimeFormat('fr-FR', { 
          month: 'short', 
          year: '2-digit' 
        }).format(date);
      default:
        return period;
    }
  };

  // Données du graphique
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!dataA || !dataB) return [];

    const aggregatedA = aggregateByPeriod(dataA, viewMode);
    const aggregatedB = aggregateByPeriod(dataB, viewMode);

    // Fusionner les données par période
    const merged = new Map<string, ChartDataPoint>();

    aggregatedA.forEach(entryA => {
      merged.set(entryA.date, {
        date: entryA.date,
        period: entryA.period,
        ca_ttc_a: entryA.ca_ttc,
        marge_a: entryA.marge,
        quantite_a: entryA.quantite_vendue,
        ca_ttc_b: 0,
        marge_b: 0,
        quantite_b: 0
      });
    });

    aggregatedB.forEach(entryB => {
      if (merged.has(entryB.date)) {
        const existing = merged.get(entryB.date)!;
        existing.ca_ttc_b = entryB.ca_ttc;
        existing.marge_b = entryB.marge;
        existing.quantite_b = entryB.quantite_vendue;
      } else {
        merged.set(entryB.date, {
          date: entryB.date,
          period: entryB.period,
          ca_ttc_a: 0,
          marge_a: 0,
          quantite_a: 0,
          ca_ttc_b: entryB.ca_ttc,
          marge_b: entryB.marge,
          quantite_b: entryB.quantite_vendue
        });
      }
    });

    return Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [dataA, dataB, viewMode, aggregateByPeriod]);

  // Préparation données pour export CSV évolution comparative
  const prepareEvolutionDataForExport = useCallback(() => {
    if (!chartData || chartData.length === 0 || !elementA || !elementB) return [];
    
    const exportData = [];
    
    // En-tête avec informations générales
    exportData.push({
      'Type Export': 'ÉVOLUTION COMPARATIVE',
      'Élément A': elementA.name,
      'Type A': elementA.type,
      'Élément B': elementB.name,
      'Type B': elementB.type,
      'Période Analyse': `${analysisDateRange.start} - ${analysisDateRange.end}`,
      'Agrégation': viewMode === 'daily' ? 'Journalière' : viewMode === 'weekly' ? 'Hebdomadaire' : 'Mensuelle',
      'Métrique Sélectionnée': selectedMetric === 'ca_ttc' ? 'CA TTC' : selectedMetric === 'marge' ? 'Marge' : 'Quantité vendue',
      'Total Périodes': chartData.length.toString(),
      'Date Export': new Date().toLocaleDateString('fr-FR'),
      'Heure Export': new Date().toLocaleTimeString('fr-FR'),
      'Période': '',
      'Date': '',
      'CA TTC A (€)': '',
      'CA TTC B (€)': '',
      'Écart CA TTC (€)': '',
      'Écart CA TTC (%)': '',
      'Marge A (€)': '',
      'Marge B (€)': '',
      'Écart Marge (€)': '',
      'Écart Marge (%)': '',
      'Quantité A': '',
      'Quantité B': '',
      'Écart Quantité': '',
      'Écart Quantité (%)': '',
      'Performance Période': ''
    });

    // Ligne de séparation
    exportData.push({
      'Type Export': '--- DONNÉES ÉVOLUTION TEMPORELLE ---',
      'Élément A': '',
      'Type A': '',
      'Élément B': '',
      'Type B': '',
      'Période Analyse': '',
      'Agrégation': '',
      'Métrique Sélectionnée': '',
      'Total Périodes': '',
      'Date Export': '',
      'Heure Export': '',
      'Période': '',
      'Date': '',
      'CA TTC A (€)': '',
      'CA TTC B (€)': '',
      'Écart CA TTC (€)': '',
      'Écart CA TTC (%)': '',
      'Marge A (€)': '',
      'Marge B (€)': '',
      'Écart Marge (€)': '',
      'Écart Marge (%)': '',
      'Quantité A': '',
      'Quantité B': '',
      'Écart Quantité': '',
      'Écart Quantité (%)': '',
      'Performance Période': ''
    });
    
    // Export de toutes les périodes avec calculs d'écarts
    chartData.forEach(dataPoint => {
      // Calculs écarts CA TTC
      const ecartCaTtc = dataPoint.ca_ttc_b - dataPoint.ca_ttc_a;
      const ecartCaTtcPercent = dataPoint.ca_ttc_a !== 0 ? (ecartCaTtc / dataPoint.ca_ttc_a) * 100 : 0;

      // Calculs écarts Marge
      const ecartMarge = dataPoint.marge_b - dataPoint.marge_a;
      const ecartMargePercent = dataPoint.marge_a !== 0 ? (ecartMarge / dataPoint.marge_a) * 100 : 0;

      // Calculs écarts Quantité
      const ecartQuantite = dataPoint.quantite_b - dataPoint.quantite_a;
      const ecartQuantitePercent = dataPoint.quantite_a !== 0 ? (ecartQuantite / dataPoint.quantite_a) * 100 : 0;

      // Performance globale de la période (qui gagne sur plus d'indicateurs)
      const scoreA = (dataPoint.ca_ttc_a > dataPoint.ca_ttc_b ? 1 : 0) + 
                    (dataPoint.marge_a > dataPoint.marge_b ? 1 : 0) + 
                    (dataPoint.quantite_a > dataPoint.quantite_b ? 1 : 0);
      const scoreB = (dataPoint.ca_ttc_b > dataPoint.ca_ttc_a ? 1 : 0) + 
                    (dataPoint.marge_b > dataPoint.marge_a ? 1 : 0) + 
                    (dataPoint.quantite_b > dataPoint.quantite_a ? 1 : 0);
      
      const performancePeriode = scoreA > scoreB ? elementA.name : scoreB > scoreA ? elementB.name : 'Égalité';

      exportData.push({
        'Type Export': 'DONNÉES PÉRIODE',
        'Élément A': elementA.name,
        'Type A': elementA.type,
        'Élément B': elementB.name,
        'Type B': elementB.type,
        'Période Analyse': `${analysisDateRange.start} - ${analysisDateRange.end}`,
        'Agrégation': viewMode === 'daily' ? 'Journalière' : viewMode === 'weekly' ? 'Hebdomadaire' : 'Mensuelle',
        'Métrique Sélectionnée': selectedMetric === 'ca_ttc' ? 'CA TTC' : selectedMetric === 'marge' ? 'Marge' : 'Quantité vendue',
        'Total Périodes': chartData.length.toString(),
        'Date Export': new Date().toLocaleDateString('fr-FR'),
        'Heure Export': new Date().toLocaleTimeString('fr-FR'),
        'Période': dataPoint.period,
        'Date': dataPoint.date,
        'CA TTC A (€)': dataPoint.ca_ttc_a.toFixed(2),
        'CA TTC B (€)': dataPoint.ca_ttc_b.toFixed(2),
        'Écart CA TTC (€)': ecartCaTtc.toFixed(2),
        'Écart CA TTC (%)': ecartCaTtcPercent.toFixed(2),
        'Marge A (€)': dataPoint.marge_a.toFixed(2),
        'Marge B (€)': dataPoint.marge_b.toFixed(2),
        'Écart Marge (€)': ecartMarge.toFixed(2),
        'Écart Marge (%)': ecartMargePercent.toFixed(2),
        'Quantité A': dataPoint.quantite_a.toString(),
        'Quantité B': dataPoint.quantite_b.toString(),
        'Écart Quantité': ecartQuantite.toString(),
        'Écart Quantité (%)': ecartQuantitePercent.toFixed(2),
        'Performance Période': performancePeriode
      });
    });

    // Section résumé statistique
    exportData.push({
      'Type Export': '--- RÉSUMÉ STATISTIQUE ---',
      'Élément A': '',
      'Type A': '',
      'Élément B': '',
      'Type B': '',
      'Période Analyse': '',
      'Agrégation': '',
      'Métrique Sélectionnée': '',
      'Total Périodes': '',
      'Date Export': '',
      'Heure Export': '',
      'Période': '',
      'Date': '',
      'CA TTC A (€)': '',
      'CA TTC B (€)': '',
      'Écart CA TTC (€)': '',
      'Écart CA TTC (%)': '',
      'Marge A (€)': '',
      'Marge B (€)': '',
      'Écart Marge (€)': '',
      'Écart Marge (%)': '',
      'Quantité A': '',
      'Quantité B': '',
      'Écart Quantité': '',
      'Écart Quantité (%)': '',
      'Performance Période': ''
    });

    // Calculs totaux et moyennes
    const totalCaTtcA = chartData.reduce((sum, d) => sum + d.ca_ttc_a, 0);
    const totalCaTtcB = chartData.reduce((sum, d) => sum + d.ca_ttc_b, 0);
    const totalMargeA = chartData.reduce((sum, d) => sum + d.marge_a, 0);
    const totalMargeB = chartData.reduce((sum, d) => sum + d.marge_b, 0);
    const totalQuantiteA = chartData.reduce((sum, d) => sum + d.quantite_a, 0);
    const totalQuantiteB = chartData.reduce((sum, d) => sum + d.quantite_b, 0);

    exportData.push({
      'Type Export': 'TOTAUX PÉRIODE',
      'Élément A': elementA.name,
      'Type A': elementA.type,
      'Élément B': elementB.name,
      'Type B': elementB.type,
      'Période Analyse': `${analysisDateRange.start} - ${analysisDateRange.end}`,
      'Agrégation': viewMode === 'daily' ? 'Journalière' : viewMode === 'weekly' ? 'Hebdomadaire' : 'Mensuelle',
      'Métrique Sélectionnée': selectedMetric === 'ca_ttc' ? 'CA TTC' : selectedMetric === 'marge' ? 'Marge' : 'Quantité vendue',
      'Total Périodes': chartData.length.toString(),
      'Date Export': new Date().toLocaleDateString('fr-FR'),
      'Heure Export': new Date().toLocaleTimeString('fr-FR'),
      'Période': 'TOTAL',
      'Date': 'PÉRIODE COMPLÈTE',
      'CA TTC A (€)': totalCaTtcA.toFixed(2),
      'CA TTC B (€)': totalCaTtcB.toFixed(2),
      'Écart CA TTC (€)': (totalCaTtcB - totalCaTtcA).toFixed(2),
      'Écart CA TTC (%)': totalCaTtcA !== 0 ? (((totalCaTtcB - totalCaTtcA) / totalCaTtcA) * 100).toFixed(2) : '0',
      'Marge A (€)': totalMargeA.toFixed(2),
      'Marge B (€)': totalMargeB.toFixed(2),
      'Écart Marge (€)': (totalMargeB - totalMargeA).toFixed(2),
      'Écart Marge (%)': totalMargeA !== 0 ? (((totalMargeB - totalMargeA) / totalMargeA) * 100).toFixed(2) : '0',
      'Quantité A': totalQuantiteA.toString(),
      'Quantité B': totalQuantiteB.toString(),
      'Écart Quantité': (totalQuantiteB - totalQuantiteA).toString(),
      'Écart Quantité (%)': totalQuantiteA !== 0 ? (((totalQuantiteB - totalQuantiteA) / totalQuantiteA) * 100).toFixed(2) : '0',
      'Performance Période': totalCaTtcB > totalCaTtcA ? elementB.name : totalCaTtcA > totalCaTtcB ? elementA.name : 'Égalité'
    });
    
    return exportData;
  }, [chartData, elementA, elementB, analysisDateRange, viewMode, selectedMetric]);

  // Handler export avec vérification
  const handleExport = useCallback(() => {
    const exportData = prepareEvolutionDataForExport();
    
    if (exportData.length === 0) {
      console.warn('Aucune donnée d\'évolution à exporter');
      return;
    }
    
    // Nom de fichier intelligent avec éléments et période
    const elementASlug = elementA?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'elementA';
    const elementBSlug = elementB?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'elementB';
    const viewModeLabel = viewMode === 'daily' ? 'quotidien' : viewMode === 'weekly' ? 'hebdo' : 'mensuel';
    const metricLabel = selectedMetric === 'ca_ttc' ? 'ca' : selectedMetric === 'marge' ? 'marge' : 'qte';
    const filename = CsvExporter.generateFilename(`apodata_evolution_${elementASlug}_vs_${elementBSlug}_${viewModeLabel}_${metricLabel}`);
    
    // Vérification que le premier élément existe avant d'obtenir les headers
    if (!exportData[0]) {
      console.error('Données export évolution invalides');
      return;
    }
    
    const headers = Object.keys(exportData[0]);
    
    exportToCsv({
      filename,
      headers,
      data: exportData
    });
  }, [prepareEvolutionDataForExport, exportToCsv, elementA, elementB, viewMode, selectedMetric]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchA(), refetchB()]);
    onRefresh?.();
  }, [refetchA, refetchB, onRefresh]);

  // Configuration métriques
  const metricConfig = {
    ca_ttc: { 
      label: 'Chiffre d\'affaires', 
      unit: 'currency',
      keyA: 'ca_ttc_a' as keyof ChartDataPoint,
      keyB: 'ca_ttc_b' as keyof ChartDataPoint
    },
    marge: { 
      label: 'Marge', 
      unit: 'currency',
      keyA: 'marge_a' as keyof ChartDataPoint,
      keyB: 'marge_b' as keyof ChartDataPoint
    },
    quantite_vendue: { 
      label: 'Quantité vendue', 
      unit: 'number',
      keyA: 'quantite_a' as keyof ChartDataPoint,
      keyB: 'quantite_b' as keyof ChartDataPoint
    }
  };

  const currentMetric = metricConfig[selectedMetric];

  // Format valeur pour tooltip
  const formatValue = (value: number, unit: string) => {
    if (unit === 'currency') {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0
      }).format(value);
    }
    return new Intl.NumberFormat('fr-FR').format(value);
  };

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0]?.payload as ChartDataPoint;
    if (!dataPoint) return null;

    const valueA = dataPoint[currentMetric.keyA] as number;
    const valueB = dataPoint[currentMetric.keyB] as number;
    const difference = valueB - valueA;
    const percentDiff = valueA !== 0 ? (difference / Math.abs(valueA)) * 100 : 0;

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
        <p className="font-semibold text-gray-900 mb-3">{label}</p>
        
        <div className="space-y-3">
          {/* Élément A */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">{elementA?.name}</span>
            </div>
            <span className="font-medium">
              {formatValue(valueA, currentMetric.unit)}
            </span>
          </div>

          {/* Élément B */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">{elementB?.name}</span>
            </div>
            <span className="font-medium">
              {formatValue(valueB, currentMetric.unit)}
            </span>
          </div>

          {/* Écart */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Écart:</span>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${
                  difference >= 0 ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {difference >= 0 ? '+' : ''}{formatValue(difference, currentMetric.unit)}
                </span>
                {Math.abs(percentDiff) >= 1 && (
                  <span className="text-xs text-gray-400">
                    ({percentDiff >= 0 ? '+' : ''}{percentDiff.toFixed(0)}%)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // États conditionnels
  if (!elementA || !elementB) {
    return (
      <Card variant="outlined" padding="lg" className={className}>
        <div className="text-center py-12">
          <ArrowLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Graphique d'évolution comparative
          </h3>
          <p className="text-gray-500">
            Sélectionnez deux éléments pour visualiser leur évolution temporelle
          </p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card variant="elevated" padding="lg" className={className}>
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          <div className="h-80 bg-gray-100 rounded"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" padding="lg" className={className}>
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="secondary" size="sm" onClick={handleRefresh}>
            Réessayer
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg" className={className}>
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Évolution comparative
            </h3>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>{elementA.name}</span>
            </div>
            <ArrowLeftRight className="w-3 h-3" />
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>{elementB.name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Export button */}
          <ExportButton
            onClick={handleExport}
            isExporting={isExporting}
            disabled={!chartData || chartData.length === 0 || isLoading}
            label="Export CSV"
            size="sm"
          />

          {/* Sélecteur métrique */}
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
            {Object.entries(metricConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={selectedMetric === key ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedMetric(key as MetricType)}
              >
                {config.label}
              </Button>
            ))}
          </div>

          {/* Sélecteur période */}
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
            {(['daily', 'weekly', 'monthly'] as ViewMode[]).map(mode => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode(mode)}
              >
                {mode === 'daily' ? 'J' : mode === 'weekly' ? 'S' : 'M'}
              </Button>
            ))}
          </div>

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

      {/* Graphique */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="period"
              stroke="#6b7280"
              fontSize={12}
              angle={viewMode === 'daily' ? -45 : 0}
              textAnchor={viewMode === 'daily' ? 'end' : 'middle'}
              height={viewMode === 'daily' ? 60 : 30}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => {
                if (currentMetric.unit === 'currency') {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}k€`;
                  return `${value}€`;
                } else {
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                  return value.toString();
                }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Courbes A et B */}
            <Line
              type="monotone"
              dataKey={currentMetric.keyA}
              name={elementA.name}
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, fill: '#3b82f6' }}
              activeDot={{ r: 6, fill: '#3b82f6' }}
            />
            <Line
              type="monotone"
              dataKey={currentMetric.keyB}
              name={elementB.name}
              stroke="#a855f7"
              strokeWidth={3}
              dot={{ r: 4, fill: '#a855f7' }}
              activeDot={{ r: 6, fill: '#a855f7' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};