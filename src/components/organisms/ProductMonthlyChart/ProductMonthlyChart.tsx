// src/components/organisms/ProductMonthlyChart/ProductMonthlyChart.tsx
'use client';

import React, { useMemo } from 'react';
import { 
  ComposedChart,
  Line,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';
import { Badge } from '@/components/atoms/Badge/Badge';
import { 
  convertToChartData, 
  formatCurrency, 
  formatPercentage,
  formatLargeNumber,
  calculateProductPerformance,
  type ChartDataPoint,
  type ProductPerformanceStats 
} from '../ProductsMonthlyTable/utils';

interface MonthlyDetailsRow {
  readonly nom: string;
  readonly code_ean: string;
  readonly mois: string;
  readonly mois_libelle: string;
  readonly type_ligne: 'MENSUEL' | 'SYNTHESE' | 'STOCK_MOYEN';
  readonly quantite_vendue: number;
  readonly quantite_stock: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
}

interface ProductMonthlyChartProps {
  readonly monthlyDetails: MonthlyDetailsRow[];
  readonly productName: string;
  readonly className?: string;
}

/**
 * Conversion des données mensuelles avec stock pour graphique
 */
const convertToChartDataWithStock = (monthlyDetails: MonthlyDetailsRow[]): ChartDataPoint[] => {
  return monthlyDetails
    .filter(row => row.type_ligne === 'MENSUEL')
    .map(row => ({
      periode: formatMonthLabel(row.mois),
      quantite: row.quantite_vendue,
      stock: row.quantite_stock,
      prixVente: row.prix_vente_moyen,
      prixAchat: row.prix_achat_moyen,
      tauxMarge: row.taux_marge_moyen
    }))
    .sort((a, b) => {
      const dateA = parseMonthFromLabel(a.periode);
      const dateB = parseMonthFromLabel(b.periode);
      return dateA.getTime() - dateB.getTime();
    });
};

/**
 * Formate un mois YYYY-MM en libellé court fr-FR
 */
const formatMonthLabel = (dateStr: string): string => {
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 2) return dateStr;
    
    const year = parts[0];
    const month = parts[1];
    if (!year || !month) return dateStr;
    
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return new Intl.DateTimeFormat('fr-FR', { 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  } catch {
    return dateStr;
  }
};

/**
 * Parse un libellé de mois en Date pour tri chronologique
 */
const parseMonthFromLabel = (monthLabel: string): Date => {
  try {
    const parts = monthLabel.split(' ');
    if (parts.length !== 2) return new Date();
    
    const monthStr = parts[0];
    const yearStr = parts[1];
    
    if (!monthStr || !yearStr) return new Date();
    
    const year = parseInt(yearStr);
    
    const monthMap: Record<string, number> = {
      'janv.': 0, 'févr.': 1, 'mars': 2, 'avr.': 3,
      'mai': 4, 'juin': 5, 'juil.': 6, 'août': 7,
      'sept.': 8, 'oct.': 9, 'nov.': 10, 'déc.': 11
    };
    
    const month = monthMap[monthStr.toLowerCase()] ?? 0;
    return new Date(year, month, 1);
  } catch {
    return new Date();
  }
};

export const ProductMonthlyChart: React.FC<ProductMonthlyChartProps> = ({
  monthlyDetails,
  productName,
  className = ''
}) => {
  // Conversion données pour graphique avec stock
  const chartData = useMemo((): ChartDataPoint[] => {
    return convertToChartDataWithStock(monthlyDetails);
  }, [monthlyDetails]);

  // Calcul statistiques performance
  const performanceStats = useMemo((): ProductPerformanceStats => {
    return calculateProductPerformance(monthlyDetails);
  }, [monthlyDetails]);

  // Validation données
  const hasValidData = chartData.length > 0;

  // Configuration couleurs optimisée avec stock
  const chartColors = {
    quantite: '#6b7280',      // gray-500 - barres quantité
    stock: '#8b5cf6',         // violet-500 - ligne stock
    prixVente: '#3b82f6',     // blue-500 - ligne
    prixAchat: '#22c55e',     // green-500 - ligne
    tauxMarge: '#f59e0b'      // amber-500 - ligne pointillée
  };

  // Tooltip personnalisé avec stock
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
                {entry.dataKey === 'quantite' || entry.dataKey === 'stock'
                  ? `${formatLargeNumber(entry.value)} unités`
                  : entry.dataKey === 'tauxMarge'
                  ? formatPercentage(entry.value)
                  : formatCurrency(entry.value)
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Badge pour tendances
  const getTrendBadge = (
    trend: 'hausse' | 'baisse' | 'stable', 
    variation: number,
    label: string
  ) => {
    const variant = trend === 'hausse' ? 'success' 
      : trend === 'baisse' ? 'danger' : 'gray';
    
    const icon = trend === 'hausse' ? '↗' : trend === 'baisse' ? '↘' : '→';
    
    return (
      <Badge variant={variant} size="sm">
        {icon} {label} {formatPercentage(Math.abs(variation))}
      </Badge>
    );
  };

  // Rendu conditionnel - Pas de données
  if (!hasValidData) {
    return (
      <Card variant="elevated" padding="lg" className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 mb-4">
          <BarChart3 className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucune donnée mensuelle
        </h3>
        <p className="text-gray-600">
          Pas de données détaillées disponibles pour <strong>{productName}</strong>
        </p>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg" className={`space-y-6 ${className}`}>
      
      {/* Header avec métriques performance */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Évolution mensuelle - {productName}
            </h3>
            <p className="text-sm text-gray-600">
              Analyse détaillée avec stock sur {chartData.length} mois
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {getTrendBadge(
            performanceStats.tendanceVentes, 
            performanceStats.variationVentes,
            'Ventes'
          )}
          {getTrendBadge(
            performanceStats.tendanceMarge, 
            performanceStats.variationMarge,
            'Marge'
          )}
          <Badge 
            variant={performanceStats.regulariteStock === 'regulier' ? 'success' 
              : performanceStats.regulariteStock === 'volatile' ? 'warning' : 'danger'} 
            size="sm"
          >
            Stock {performanceStats.regulariteStock}
          </Badge>
        </div>
      </div>

      {/* Graphique principal avec stock */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            
            <XAxis 
              dataKey="periode"
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            
            {/* Axe Y pour prix */}
            <YAxis 
              yAxisId="price"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value: any) => `${value}€`}
            />
            
            {/* Axe Y pour quantité/stock (à droite) */}
            <YAxis 
              yAxisId="quantity"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value: any) => formatLargeNumber(value)}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Barres pour quantité vendue */}
            <Bar
              yAxisId="quantity"
              dataKey="quantite"
              name="Quantité vendue"
              fill={chartColors.quantite}
              opacity={0.6}
            />
            
            {/* Ligne pour stock mensuel */}
            <Line
              yAxisId="quantity"
              type="monotone"
              dataKey="stock"
              name="Stock fin mois"
              stroke={chartColors.stock}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            
            {/* Lignes pour les prix et marge */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="prixVente"
              name="Prix vente (€)"
              stroke={chartColors.prixVente}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="prixAchat"
              name="Prix achat (€)"
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
      
    </Card>
  );
};