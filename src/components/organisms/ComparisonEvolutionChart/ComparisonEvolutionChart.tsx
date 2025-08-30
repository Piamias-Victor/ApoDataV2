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
import { useDailyMetrics } from '@/hooks/dashboard/useDailyMetrics';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { useFiltersStore } from '@/stores/useFiltersStore';

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
 * ComparisonEvolutionChart - Graphique évolution comparative A vs B
 * 
 * Features :
 * - Comparaison temporelle 2 éléments (courbes A/B)
 * - 3 métriques : CA TTC, Marge, Quantité vendue
 * - Agrégation jour/semaine/mois
 * - Design cohérent avec pages comparaisons
 * - Tooltip comparatif avec écarts
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