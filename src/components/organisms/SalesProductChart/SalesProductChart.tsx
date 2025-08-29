// src/components/organisms/SalesProductChart/SalesProductChart.tsx
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
import { formatCurrency, formatPercentage, formatLargeNumber } from '../SalesProductsTable/utils';

interface SalesProductRow {
  readonly nom: string;
  readonly code_ean: string;
  readonly periode: string;
  readonly periode_libelle: string;
  readonly type_ligne: 'DETAIL' | 'SYNTHESE';
  readonly quantite_vendue: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
  readonly part_marche_quantite_pct: number;
  readonly part_marche_marge_pct: number;
  readonly montant_ventes_ttc: number;
  readonly montant_marge_total: number;
}

interface SalesChartDataPoint {
  readonly periode: string;
  readonly quantite: number;
  readonly prixVente: number;
  readonly prixAchat: number;
  readonly tauxMarge: number;
  readonly montantVentes: number;
}

interface SalesProductChartProps {
  readonly salesDetails: SalesProductRow[];
  readonly productName: string;
  readonly className?: string;
}

const convertToChartData = (salesDetails: SalesProductRow[]): SalesChartDataPoint[] => {
  return salesDetails
    .filter(row => row.type_ligne === 'DETAIL')
    .map(row => ({
      periode: formatPeriodLabel(row.periode),
      quantite: row.quantite_vendue,
      prixVente: row.prix_vente_moyen,
      prixAchat: row.prix_achat_moyen,
      tauxMarge: row.taux_marge_moyen,
      montantVentes: row.montant_ventes_ttc
    }))
    .sort((a, b) => {
      const dateA = parsePeriodFromLabel(a.periode);
      const dateB = parsePeriodFromLabel(b.periode);
      return dateA.getTime() - dateB.getTime();
    });
};

const formatPeriodLabel = (periode: string): string => {
  if (periode.match(/^\d{4}-\d{2}$/)) {
    try {
      const [year, month] = periode.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return new Intl.DateTimeFormat('fr-FR', { 
        month: 'short', 
        year: 'numeric' 
      }).format(date);
    } catch {
      return periode;
    }
  }
  
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

const calculateTrends = (chartData: SalesChartDataPoint[]) => {
  if (chartData.length < 2) return { sales: 'stable', margin: 'stable' };
  
  const first = chartData[0];
  const last = chartData[chartData.length - 1];
  
  const salesTrend = last.quantite > first.quantite * 1.1 ? 'hausse' 
    : last.quantite < first.quantite * 0.9 ? 'baisse' : 'stable';
  
  const marginTrend = last.tauxMarge > first.tauxMarge + 2 ? 'hausse'
    : last.tauxMarge < first.tauxMarge - 2 ? 'baisse' : 'stable';
  
  return { sales: salesTrend, margin: marginTrend };
};

export const SalesProductChart: React.FC<SalesProductChartProps> = ({
  salesDetails,
  productName,
  className = ''
}) => {
  const chartData = useMemo((): SalesChartDataPoint[] => {
    return convertToChartData(salesDetails);
  }, [salesDetails]);

  const trends = useMemo(() => {
    return calculateTrends(chartData);
  }, [chartData]);

  const hasValidData = chartData.length > 0;

  const chartColors = {
    quantite: '#6b7280',      // gray-500 - barres quantité
    prixVente: '#3b82f6',     // blue-500 - ligne
    prixAchat: '#22c55e',     // green-500 - ligne
    tauxMarge: '#f59e0b'      // amber-500 - ligne pointillée
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
                {entry.dataKey === 'quantite'
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
      <Card variant="elevated" padding="lg" className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 mb-4">
          <BarChart3 className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucune donnée détaillée
        </h3>
        <p className="text-gray-600">
          Pas de données d'évolution disponibles pour <strong>{productName}</strong>
        </p>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg" className={`space-y-6 ${className}`}>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Évolution des ventes - {productName}
            </h3>
            <p className="text-sm text-gray-600">
              Analyse sur {chartData.length} période{chartData.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {getTrendBadge(trends.sales, 'Ventes')}
          {getTrendBadge(trends.margin, 'Marge')}
        </div>
      </div>

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
              tickFormatter={(value: any) => formatLargeNumber(value)}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Bar
              yAxisId="quantity"
              dataKey="quantite"
              name="Quantité vendue"
              fill={chartColors.quantite}
              opacity={0.6}
            />
            
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