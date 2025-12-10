// src/components/organisms/GenericProductChart/GenericProductChart.tsx
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
import { BarChart3 } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';
import { Badge } from '@/components/atoms/Badge/Badge';
import type { GenericProductDetail, GenericChartDataPoint } from '@/types/generic-products-details';

interface GenericProductChartProps {
  readonly details: GenericProductDetail[];
  readonly productName: string;
  readonly laboratoryName: string;
  readonly className?: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

const formatLargeNumber = (value: number | undefined | null): string => {
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  
  if (value === 0) return '0';
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
};

const formatDateFromPeriode = (periode: string | undefined, type: 'short' | 'long' = 'short'): string => {
  if (!periode) return '';
  
  // Format YYYY-MM
  if (periode.match(/^\d{4}-\d{2}$/)) {
    try {
      const [year, month] = periode.split('-');
      if (!year || !month) return periode;
      
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return new Intl.DateTimeFormat('fr-FR', { 
        month: type === 'short' ? 'short' : 'long', 
        year: 'numeric' 
      }).format(date);
    } catch {
      return periode;
    }
  }
  
  // Format YYYY-MM-DD
  if (periode.match(/^\d{4}-\d{2}-\d{2}$/)) {
    try {
      const date = new Date(periode);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit'
      }).format(date);
    } catch {
      return periode;
    }
  }
  
  return periode;
};

const convertToChartData = (details: GenericProductDetail[]): GenericChartDataPoint[] => {
  return details
    .filter(row => row.type_ligne === 'DETAIL')
    .map(row => ({
      periode: formatDateFromPeriode(row.periode),
      quantityBought: parseFloat(String(row.quantity_bought)) || 0,
      quantitySold: parseFloat(String(row.quantity_sold)) || 0,
      prixAchat: parseFloat(String(row.avg_buy_price_ht)) || 0,
      prixBrut: row.prix_brut_grossiste !== null ? parseFloat(String(row.prix_brut_grossiste)) : null,
      marginRate: parseFloat(String(row.margin_rate_percent)) || 0,
      remise: parseFloat(String(row.remise_percent)) || 0,
      caAchats: parseFloat(String(row.ca_achats)) || 0,
      caVentes: parseFloat(String(row.ca_ventes)) || 0
    }))
    .sort((a, b) => {
      const dateA = parsePeriodFromLabel(a.periode);
      const dateB = parsePeriodFromLabel(b.periode);
      return dateA.getTime() - dateB.getTime();
    });
};

const parsePeriodFromLabel = (periodLabel: string): Date => {
  try {
    const parts = periodLabel.split(' ');
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

const calculateTrends = (chartData: GenericChartDataPoint[]) => {
  if (chartData.length < 2) return { sales: 'stable', purchases: 'stable', margin: 'stable' };
  
  const first = chartData[0];
  const last = chartData[chartData.length - 1];
  
  if (!first || !last) return { sales: 'stable', purchases: 'stable', margin: 'stable' };
  
  const salesTrend = last.quantitySold > first.quantitySold * 1.1 ? 'hausse' 
    : last.quantitySold < first.quantitySold * 0.9 ? 'baisse' : 'stable';
  
  const purchasesTrend = last.quantityBought > first.quantityBought * 1.1 ? 'hausse'
    : last.quantityBought < first.quantityBought * 0.9 ? 'baisse' : 'stable';
  
  const marginTrend = last.marginRate > first.marginRate + 2 ? 'hausse'
    : last.marginRate < first.marginRate - 2 ? 'baisse' : 'stable';
  
  return { sales: salesTrend, purchases: purchasesTrend, margin: marginTrend };
};

export const GenericProductChart: React.FC<GenericProductChartProps> = ({
  details,
  productName,
  laboratoryName,
  className = ''
}) => {
  const chartData = useMemo((): GenericChartDataPoint[] => {
    return convertToChartData(details);
  }, [details]);

  const trends = useMemo(() => {
    return calculateTrends(chartData);
  }, [chartData]);

  const hasValidData = chartData.length > 0;

  const first = chartData[0];
  const last = chartData[chartData.length - 1];
  
  const chartColors = {
    quantityBought: '#22c55e',  // green-500
    quantitySold: '#3b82f6',    // blue-500
    prixAchat: '#f59e0b',       // amber-500
    prixBrut: '#6b7280',        // gray-500
    marginRate: '#ef4444',      // red-500
    remise: '#8b5cf6'           // violet-500
  };

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
                {entry.dataKey === 'quantityBought' || entry.dataKey === 'quantitySold'
                  ? `${formatLargeNumber(entry.value)} unités`
                  : entry.dataKey === 'marginRate' || entry.dataKey === 'remise'
                  ? formatPercentage(entry.value)
                  : entry.value !== null
                  ? formatCurrency(entry.value)
                  : 'N/A'
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getTrendBadge = (trend: string, label: string) => {
    const variant = trend === 'hausse' ? 'success' 
      : trend === 'baisse' ? 'danger' : 'gray';
    
    const icon = trend === 'hausse' ? '↗' : trend === 'baisse' ? '↘' : '→';
    
    return (
      <Badge variant={variant} size="sm">
        {icon} {label} {trend}
      </Badge>
    );
  };

  if (!hasValidData) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Pas de données détaillées disponibles pour ce produit</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      
      {/* Header avec nom produit et tendances */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Évolution - {productName}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{laboratoryName}</p>
          <div className="flex items-center space-x-3">
            {getTrendBadge(trends.sales, 'Ventes')}
            {getTrendBadge(trends.purchases, 'Achats')}
            {getTrendBadge(trends.margin, 'Marge')}
          </div>
        </div>
        
        {/* Stats période */}
        {first && last && (
          <div className="text-right text-sm text-gray-600">
            <div>Période: {first.periode} → {last.periode}</div>
            {last.caVentes !== first.caVentes && (
              <div className="mt-1">
                CA Ventes: {formatCurrency(first.caVentes)} → {formatCurrency(last.caVentes)}
                <span className={`ml-2 font-medium ${
                  last.caVentes > first.caVentes 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {last.caVentes > first.caVentes ? '+' : ''}
                  {formatPercentage(((last.caVentes - first.caVentes) / first.caVentes) * 100)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Graphique */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="periode" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis 
              yAxisId="quantity"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis 
              yAxisId="price"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Barres quantités */}
            <Bar
              yAxisId="quantity"
              dataKey="quantityBought"
              name="Vol. Achats"
              fill={chartColors.quantityBought}
              opacity={0.7}
              radius={[2, 2, 0, 0]}
            />
            
            <Bar
              yAxisId="quantity"
              dataKey="quantitySold"
              name="Vol. Ventes"
              fill={chartColors.quantitySold}
              opacity={0.7}
              radius={[2, 2, 0, 0]}
            />
            
            {/* Lignes prix et marges */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="prixAchat"
              name="Prix Achat HT"
              stroke={chartColors.prixAchat}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls={false}
            />
            
            {/* Prix brut (peut être null) */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="prixBrut"
              name="Prix Brut"
              stroke={chartColors.prixBrut}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls={true}
            />
            
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="marginRate"
              name="Taux Marge (%)"
              stroke={chartColors.marginRate}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              connectNulls={false}
            />
            
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="remise"
              name="Remise (%)"
              stroke={chartColors.remise}
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={{ r: 3 }}
              connectNulls={false}
            />
            
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
    </Card>
  );
};