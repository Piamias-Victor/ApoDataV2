// src/components/molecules/ImpactSimulationCard/ImpactSimulationCard.tsx
import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';

interface ImpactSimulationCardProps {
  readonly simulation?: {
    readonly new_margin_percent: number;
    readonly new_coefficient: number;
    readonly delta_margin_percent: number;
    readonly projected_ca_ttc: number;
    readonly projected_total_margin: number;
  } | undefined;
  readonly currentConditions?: {
    readonly current_margin_percent: number;
    readonly total_ca_ttc: number;
    readonly current_margin_ht: number;
    readonly quantity_sold: number;
  };
}

export const ImpactSimulationCard: React.FC<ImpactSimulationCardProps> = ({
  simulation,
  currentConditions
}) => {
  const formatCurrency = (value: number) => 
    `${value.toFixed(2).replace('.', ',')} €`;
  
  const formatPercent = (value: number, showSign = true) => {
    const formatted = value.toFixed(1).replace('.', ',');
    return showSign && value >= 0 ? `+${formatted}%` : `${formatted}%`;
  };

  if (!simulation || !currentConditions) {
    return (
      <Card variant="elevated" className="h-full bg-gray-50">
        <div className="p-6 flex flex-col items-center justify-center h-full">
          <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-center">
            Modifiez les conditions pour voir la simulation
          </p>
        </div>
      </Card>
    );
  }

  const isPositive = simulation.delta_margin_percent > 0;
  const totalMarginCurrent = currentConditions.current_margin_ht * currentConditions.quantity_sold;
  const deltaCA = simulation.projected_ca_ttc - currentConditions.total_ca_ttc;
  const deltaMarge = simulation.projected_total_margin - totalMarginCurrent;

  return (
    <Card variant="elevated" className="h-full border-2 border-purple-200">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
            {isPositive ? 
              <TrendingUp className="w-5 h-5 text-green-600" /> :
              <TrendingDown className="w-5 h-5 text-red-600" />
            }
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Impact & Projections</h3>
            <p className="text-xs text-gray-500">Analyse comparative</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`rounded-lg p-4 ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm text-gray-600">Nouvelle marge</span>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {formatPercent(simulation.new_margin_percent, false)}
                </div>
                <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(simulation.delta_margin_percent)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    isPositive ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(simulation.new_margin_percent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Nouveau coef.</div>
              <div className="font-semibold text-purple-600">
                {simulation.new_coefficient.toFixed(2).replace('.', ',')}
              </div>
            </div>
            <div className={`rounded-lg p-3 ${isPositive ? 'bg-green-50' : 'bg-orange-50'}`}>
              <div className="text-xs text-gray-600 mb-1">Δ Marge</div>
              <div className={`font-semibold ${isPositive ? 'text-green-600' : 'text-orange-600'}`}>
                {formatPercent(simulation.delta_margin_percent)}
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">CA TTC</span>
                <span className="text-sm text-gray-500">
                  {formatCurrency(currentConditions.total_ca_ttc)} →
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">Projeté</span>
                <span className="font-bold text-lg">
                  {formatCurrency(simulation.projected_ca_ttc)}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-sm ${deltaCA >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {deltaCA >= 0 ? '+' : ''}{formatCurrency(deltaCA)}
                </span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Marge HT</span>
                <span className="text-sm text-gray-500">
                  {formatCurrency(totalMarginCurrent)} →
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">Projetée</span>
                <span className="font-bold text-purple-600">
                  {formatCurrency(simulation.projected_total_margin)}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-sm ${deltaMarge >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {deltaMarge >= 0 ? '+' : ''}{formatCurrency(deltaMarge)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};