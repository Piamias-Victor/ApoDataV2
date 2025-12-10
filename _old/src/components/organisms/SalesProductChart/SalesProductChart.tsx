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
import { BarChart3 } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';
import { Badge } from '@/components/atoms/Badge/Badge';

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

// Utilitaires formatting
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
  // Guard clauses pour valeurs invalides
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

// CORRECTION : Guard clauses pour éviter les erreurs de nullabilité
const formatDateFromPeriode = (periode: string | undefined, type: 'short' | 'long' = 'short'): string => {
  if (!periode) return ''; // Guard clause
  
  // Gestion format YYYY-MM
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
  
  // Gestion format YYYY-MM-DD
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

const convertToChartData = (salesDetails: SalesProductRow[]): SalesChartDataPoint[] => {
  return salesDetails
    .filter(row => row.type_ligne === 'DETAIL')
    .map(row => ({
      periode: formatDateFromPeriode(row.periode),
      quantite: parseFloat(String(row.quantite_vendue)) || 0, // CORRECTION: Assurer conversion numérique
      prixVente: parseFloat(String(row.prix_vente_moyen)) || 0,
      prixAchat: parseFloat(String(row.prix_achat_moyen)) || 0,
      tauxMarge: parseFloat(String(row.taux_marge_moyen)) || 0,
      montantVentes: parseFloat(String(row.montant_ventes_ttc)) || 0
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

const calculateTrends = (chartData: SalesChartDataPoint[]) => {
  if (chartData.length < 2) return { sales: 'stable', margin: 'stable' };
  
  const first = chartData[0];
  const last = chartData[chartData.length - 1];
  
  // CORRECTION : Guard clauses pour éviter first/last undefined
  if (!first || !last) return { sales: 'stable', margin: 'stable' };
  
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
    console.log('🔍 [SalesChart] Raw salesDetails:', salesDetails);
    const converted = convertToChartData(salesDetails);
    console.log('📊 [SalesChart] Converted chartData:', converted);
    return converted;
  }, [salesDetails]);

  const trends = useMemo(() => {
    return calculateTrends(chartData);
  }, [chartData]);

  const hasValidData = chartData.length > 0;

  // CORRECTION : Guard clauses pour first/last
  const first = chartData[0];
  const last = chartData[chartData.length - 1];
  
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Évolution des ventes - {productName}
          </h3>
          <div className="flex items-center space-x-3">
            {getTrendBadge(trends.sales, 'Ventes')}
            {getTrendBadge(trends.margin, 'Marge')}
          </div>
        </div>
        
        {/* Stats période */}
        {first && last && (
          <div className="text-right text-sm text-gray-600">
            <div>Période: {first.periode} → {last.periode}</div>
            {/* CORRECTION : Vérifications nullabilité pour éviter erreurs */}
            {last.montantVentes !== first.montantVentes && (
              <div className="mt-1">
                Évolution CA: {formatCurrency(first.montantVentes)} → {formatCurrency(last.montantVentes)}
                <span className={`ml-2 font-medium ${
                  last.montantVentes > first.montantVentes 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {last.montantVentes > first.montantVentes ? '+' : ''}
                  {formatPercentage(((last.montantVentes - first.montantVentes) / first.montantVentes) * 100)}
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
            
            {/* Barres quantité */}
            <Bar
              yAxisId="quantity"
              dataKey="quantite"
              name="Quantité vendue"
              fill={chartColors.quantite}
              opacity={0.7}
              radius={[2, 2, 0, 0]}
            />
            
            {/* Lignes prix */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="prixVente"
              name="Prix vente"
              stroke={chartColors.prixVente}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls={false}
            />
            
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="prixAchat"
              name="Prix achat"
              stroke={chartColors.prixAchat}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls={false}
            />
            
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="tauxMarge"
              name="Taux marge (%)"
              stroke={chartColors.tauxMarge}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              connectNulls={false}
            />
            
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
    </Card>
  );
};