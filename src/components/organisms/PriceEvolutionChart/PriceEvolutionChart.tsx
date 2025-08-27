// src/components/organisms/PriceEvolutionChart/PriceEvolutionChart.tsx
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
import { RotateCcw, Euro } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { Badge } from '@/components/atoms/Badge/Badge';
import { usePriceMetrics } from '@/hooks/dashboard/usePriceMetrics';
import type { PriceEvolutionChartProps, PriceChartDataPoint } from './types';

/**
 * PriceEvolutionChart - Graphique évolution métriques de prix
 */
export const PriceEvolutionChart: React.FC<PriceEvolutionChartProps> = ({
  dateRange,
  filters = {},
  className = '',
  onRefresh
}) => {
  // Hook price metrics avec filtres
  const { data, isLoading, error, refetch, hasData, queryTime } = usePriceMetrics({
    enabled: true,
    dateRange,
    productCodes: filters.productCodes || [],
    pharmacyId: filters.pharmacyId
  });

  // Utility function pour formater les mois - DÉFINIE EN PREMIER
  const formatMonthLabel = useCallback((dateStr: string): string => {
    try {
      const date = new Date(dateStr);
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

  // Traitement des données pour le graphique - APRÈS formatMonthLabel
  const chartData = useMemo((): PriceChartDataPoint[] => {
    if (!data || data.length === 0) {
      console.log('Aucune donnée à traiter');
      return [];
    }

    console.log('Traitement données:', {
      dataLength: data.length,
      firstEntry: data[0]
    });

    try {
      const processedData = data.map((entry, index) => {
        const processedEntry = {
          period: formatMonthLabel(entry.mois),
          quantite: entry.quantite_vendue_mois,
          prixVente: entry.prix_vente_ttc_moyen,
          prixAchat: entry.prix_achat_ht_moyen,
          tauxMarge: entry.taux_marge_moyen_pourcentage
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
              <Euro className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune donnée de prix disponible
            </h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Aucune métrique de prix trouvée pour la période sélectionnée. 
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
                {entry.dataKey === 'quantite' 
                  ? `${Math.round(entry.value)} unités`
                  : entry.dataKey === 'tauxMarge'
                  ? `${Math.round(entry.value * 100) / 100}%`
                  : `${Math.round(entry.value * 100) / 100}€`
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
    quantite: '#6b7280',      // gray-500
    prixVente: '#3b82f6',     // blue-500
    prixAchat: '#22c55e',     // green-500  
    tauxMarge: '#f59e0b'      // orange-500
  };

  return (
    <section className={`bg-transparent space-y-6 ${className}`}>
      <div>
        {/* Header avec contrôles */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <Euro className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Évolution des Prix
              </h2>
              <p className="text-sm text-gray-600">
                Analyse mensuelle des prix et marges
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
              <YAxis 
                yAxisId="price"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value: any) => `${value}€`}
              />
              <YAxis 
                yAxisId="quantity"
                orientation="right"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value: any) => `${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Barres pour quantité */}
              <Bar
                yAxisId="quantity"
                dataKey="quantite"
                name="Quantité vendue"
                fill={chartColors.quantite}
                opacity={0.6}
              />
              
              {/* Lignes pour les prix */}
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="prixVente"
                name="Prix vente TTC (€)"
                stroke={chartColors.prixVente}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="prixAchat"
                name="Prix achat HT (€)"
                stroke={chartColors.prixAchat}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="tauxMarge"
                name="Taux marge (%)"
                stroke={chartColors.tauxMarge}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

export const MemoizedPriceEvolutionChart = React.memo(PriceEvolutionChart);