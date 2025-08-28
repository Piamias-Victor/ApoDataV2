// src/components/organisms/StockChartsEvolution/StockChartsEvolution.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Bar,
  ComposedChart
} from 'recharts';
import { RotateCcw, Package } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { Badge } from '@/components/atoms/Badge/Badge';
import { useStockCharts } from '@/hooks/dashboard/useStockCharts';

interface StockChartsEvolutionProps {
  dateRange: { start: string; end: string };
  filters?: {
    productCodes?: string[];
    pharmacyId?: string;
  };
  className?: string;
  onRefresh?: () => void;
}

interface StockChartDataPoint {
  period: string;
  quantiteStock: number;
  joursStock: number | null;
  quantiteVendue: number;
}

/**
 * StockChartsEvolution - Graphique évolution métriques de stock
 */
export const StockChartsEvolution: React.FC<StockChartsEvolutionProps> = ({
  dateRange,
  filters = {},
  className = '',
  onRefresh
}) => {
  // Hook stock metrics avec filtres
  const { data, isLoading, error, refetch, hasData, queryTime } = useStockCharts({
    enabled: true,
    dateRange,
    productCodes: filters.productCodes || [],
    pharmacyId: filters.pharmacyId
  });

  // Utility function pour formater les mois
  const formatMonthLabel = useCallback((dateStr: string): string => {
    try {
      // Conversion YYYY-MM vers date
      const [year, month] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      
      if (isNaN(date.getTime())) {
        console.error('Date invalide:', dateStr);
        return dateStr;
      }
      
      return new Intl.DateTimeFormat('fr-FR', { 
        month: 'short', 
        year: 'numeric' 
      }).format(date);
    } catch (error) {
      console.error('Erreur formatage date:', dateStr, error);
      return dateStr;
    }
  }, []);

  // Utility function pour formater les nombres
  const formatLargeNumber = useCallback((value: number): string => {
    if (value >= 1000000) {
      return `${Math.round(value / 100000) / 10}M`;
    }
    if (value >= 1000) {
      return `${Math.round(value / 100) / 10}K`;
    }
    return value.toString();
  }, []);

  // Traitement des données pour le graphique
  const chartData = useMemo((): StockChartDataPoint[] => {
    if (!data || data.length === 0) {
      console.log('Aucune donnée à traiter');
      return [];
    }

    console.log('Traitement données stock:', {
      dataLength: data.length,
      firstEntry: data[0]
    });

    try {
      const processedData = data.map((entry, index) => {
        const processedEntry = {
          period: formatMonthLabel(entry.periode),
          quantiteStock: entry.quantite_stock,
          joursStock: entry.jours_stock,
          quantiteVendue: entry.quantite_vendue
        };
        
        if (index === 0) {
          console.log('Première entrée traitée:', processedEntry);
        }
        
        return processedEntry;
      });

      console.log('Traitement terminé:', {
        processedLength: processedData.length
      });

      return processedData;
    } catch (error) {
      console.error('Erreur traitement données:', error);
      return [];
    }
  }, [data, formatMonthLabel]);

  // Validation données
  const isValidData = useMemo(() => {
    const isValid = chartData.length > 0;
    console.log('Validation données:', {
      chartDataLength: chartData.length,
      isValid
    });
    return isValid;
  }, [chartData]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // Rendu conditionnel - Loading
  if (isLoading) {
    return (
      <section className={`space-y-6 ${className}`}>
        <Card variant="elevated" padding="lg">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="flex space-x-2">
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
              <Package className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune donnée de stock disponible
            </h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Aucun graphique de stock trouvé pour la période sélectionnée. 
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
                {entry.dataKey === 'quantiteVendue' || entry.dataKey === 'quantiteStock'
                  ? `${formatLargeNumber(entry.value)} unités`
                  : entry.dataKey === 'joursStock' && entry.value !== null
                  ? `${Math.round(entry.value * 10) / 10} jours`
                  : 'N/A'
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Configuration couleurs
  const chartColors = {
    quantiteVendue: '#6b7280',    // gray-500 - barres
    quantiteStock: '#3b82f6',     // blue-500 - ligne continue
    joursStock: '#f59e0b'         // orange-500 - ligne pointillée
  };

  return (
    <section className={`bg-transparent space-y-6 ${className}`}>
      <div>
        {/* Header avec contrôles */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Évolution du Stock
              </h2>
              <p className="text-sm text-gray-600">
                Analyse mensuelle des stocks et rotations
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
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

        {/* Graphique composé */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
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
              
              {/* Axe Y pour quantités (gauche) */}
              <YAxis 
                yAxisId="quantity"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value: any) => formatLargeNumber(value)}
              />
              
              {/* Axe Y pour jours de stock (droite) */}
              <YAxis 
                yAxisId="days"
                orientation="right"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value: any) => `${value}j`}
              />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Barres pour quantité vendue */}
              <Bar
                yAxisId="quantity"
                dataKey="quantiteVendue"
                name="Quantité vendue"
                fill={chartColors.quantiteVendue}
                opacity={0.6}
              />
              
              {/* Ligne continue pour stock */}
              <Line
                yAxisId="quantity"
                type="monotone"
                dataKey="quantiteStock"
                name="Quantité en stock"
                stroke={chartColors.quantiteStock}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              
              {/* Ligne pointillée pour jours de stock */}
              <Line
                yAxisId="days"
                type="monotone"
                dataKey="joursStock"
                name="Jours de stock"
                stroke={chartColors.joursStock}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

export const MemoizedStockChartsEvolution = React.memo(StockChartsEvolution);