// src/components/molecules/ImpactSimulationCard/ImpactSimulationCard.tsx
import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';

interface ImpactSimulationCardProps {
  readonly simulation?: {
    readonly new_buy_price_ht: number;
    readonly new_sell_price_ttc: number;
    readonly new_margin_percent: number;
    readonly new_margin_ht: number;
    readonly new_coefficient: number;
    readonly delta_margin_percent: number;
    readonly projected_ca_ttc: number;
    readonly projected_total_margin: number;
  } | undefined; // Ajout explicite de undefined
  readonly currentConditions: {
    readonly total_ca_ttc: number;
    readonly current_margin_ht: number;
    readonly quantity_sold: number;
  };
}

export const ImpactSimulationCard: React.FC<ImpactSimulationCardProps> = ({
  simulation,
  currentConditions
}) => {
  // Fonction de conversion sécurisée
  const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(',', '.').replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const formatCurrency = (value: any) => {
    const num = toNumber(value);
    return `${num.toFixed(2).replace('.', ',')} €`;
  };
  
  const formatPercent = (value: any, showSign = true) => {
    const num = toNumber(value);
    const formatted = num.toFixed(1).replace('.', ',');
    if (showSign && num > 0) return `+${formatted}%`;
    return `${formatted}%`;
  };

  if (!simulation) {
    return (
      <Card variant="elevated" className="h-full border-2 border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Impact simulation</h3>
              <p className="text-xs text-gray-500">En attente de simulation</p>
            </div>
          </div>
          
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Modifiez les conditions pour voir l'impact</p>
          </div>
        </div>
      </Card>
    );
  }

  const deltaCA = toNumber(simulation.projected_ca_ttc) - toNumber(currentConditions.total_ca_ttc);
  const currentTotalMargin = toNumber(currentConditions.current_margin_ht) * toNumber(currentConditions.quantity_sold);
  const deltaMargin = toNumber(simulation.projected_total_margin) - currentTotalMargin;
  
  const isPositive = deltaMargin >= 0;

  return (
    <Card variant="elevated" className={`h-full border-2 ${isPositive ? 'border-green-200' : 'border-red-200'}`}>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Impact simulation</h3>
            <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? 'Impact positif' : 'Impact négatif'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500">Nouvelle marge</div>
              <div className={`font-semibold ${
                toNumber(simulation.new_margin_percent) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercent(simulation.new_margin_percent, false)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Delta marge</div>
              <div className={`font-semibold ${
                toNumber(simulation.delta_margin_percent) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercent(simulation.delta_margin_percent)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500">CA projeté</div>
              <div className="font-medium text-gray-900">
                {formatCurrency(simulation.projected_ca_ttc)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Delta CA</div>
              <div className={`font-medium ${
                deltaCA >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {deltaCA >= 0 ? '+' : ''}{formatCurrency(deltaCA)}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Impact marge totale</div>
              <div className={`text-lg font-bold ${
                deltaMargin >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {deltaMargin >= 0 ? '+' : ''}{formatCurrency(deltaMargin)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Sur {toNumber(currentConditions.quantity_sold)} unités vendues
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Nouveau coef.</span>
              <span className="font-medium text-purple-600">
                {toNumber(simulation.new_coefficient).toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Marge unitaire</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(simulation.new_margin_ht)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};