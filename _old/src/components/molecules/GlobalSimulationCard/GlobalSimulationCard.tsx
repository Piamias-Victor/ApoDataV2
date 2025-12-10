// src/components/molecules/GlobalSimulationCard/GlobalSimulationCard.tsx
import React, { useState } from 'react';
import { Package, Target, TrendingUp, TrendingDown, BarChart3, Percent } from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';

interface GlobalSimulationCardProps {
  readonly globalData: {
    readonly totalProducts: number;
    readonly avgDiscount: number;
    readonly totalCA: number;
    readonly totalMargin: number;
    readonly avgMarginPercent: number;
    readonly totalQuantityBought: number;
    readonly totalPurchaseAmount: number;
  };
  readonly aggregatedSimulation: {
    readonly totalDeltaCA: number;
    readonly totalDeltaMargin: number;
    readonly newAvgMargin: number;
  };
  readonly newGlobalDiscount: string;
  readonly onDiscountChange: (value: string) => void;
  readonly projectedGain: number;
}

export const GlobalSimulationCard: React.FC<GlobalSimulationCardProps> = ({
  globalData,
  aggregatedSimulation,
  projectedGain
}) => {
  const [rfaPercent, setRfaPercent] = useState('');

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
    const numValue = toNumber(value);
    
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1).replace('.', ',')}M €`;
    }
    if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(0)}k €`;
    }
    return `${numValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`;
  };

  const formatQuantity = (value: any) => {
    const numValue = toNumber(value);
    
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1).replace('.', ',')}M`;
    }
    if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(0)}k`;
    }
    return numValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  
  const formatPercent = (value: any) => {
    const numValue = toNumber(value);
    return `${numValue.toFixed(1).replace('.', ',')}%`;
  };

  // Calcul RFA
  const rfaAmount = toNumber(rfaPercent) * toNumber(globalData?.totalPurchaseAmount) / 100;
  const totalGainWithoutRFA = toNumber(aggregatedSimulation?.totalDeltaMargin) + toNumber(projectedGain);
  const totalGainWithRFA = totalGainWithoutRFA + rfaAmount;
  const isPositive = totalGainWithRFA >= 0;

  const handleRfaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*[.,]?\d*$/.test(value)) {
      setRfaPercent(value.replace(',', '.'));
    }
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Vue globale
            </h3>
            <p className="text-sm text-gray-500">
              {toNumber(globalData.totalProducts)} produits sélectionnés
            </p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
          <span className={`text-sm font-medium ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
            Impact total avec RFA: {isPositive ? '+' : ''}{formatCurrency(totalGainWithRFA)}
          </span>
        </div>
      </div>

      {/* Cards Grid - 5 colonnes */}
      <div className="grid grid-cols-5 gap-3">
        {/* État actuel */}
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">État actuel</span>
            <Package className="w-3 h-3 text-gray-400" />
          </div>
          
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">CA total</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(globalData?.totalCA)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Marge totale</p>
              <p className="text-sm font-semibold text-green-600">
                {formatCurrency(globalData?.totalMargin)}
              </p>
            </div>
            <div className="pt-1 border-t border-gray-100">
              <p className="text-xs text-gray-500">Marge moy.</p>
              <p className="text-sm font-medium">
                {formatPercent(globalData?.avgMarginPercent)}
              </p>
            </div>
          </div>
        </div>

        {/* Achats */}
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Achats</span>
            <Package className="w-3 h-3 text-blue-400" />
          </div>
          
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Qté achetée</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatQuantity(globalData?.totalQuantityBought)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Montant HT</p>
              <p className="text-sm font-semibold text-blue-600">
                {formatCurrency(globalData?.totalPurchaseAmount)}
              </p>
            </div>
            <div className="pt-1 border-t border-gray-100">
              <p className="text-xs text-gray-500">Prix moyen</p>
              <p className="text-sm font-medium">
                {globalData?.totalQuantityBought > 0 
                  ? formatCurrency(globalData?.totalPurchaseAmount / globalData?.totalQuantityBought)
                  : '0 €'}
              </p>
            </div>
          </div>
        </div>

        {/* RFA */}
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-purple-700">RFA</span>
            <Percent className="w-3 h-3 text-purple-400" />
          </div>
          
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-600 mb-1">% RFA</p>
              <Input
                type="text"
                value={rfaPercent}
                onChange={handleRfaChange}
                placeholder="0"
                className="h-7 text-sm"
              />
            </div>
            <div>
              <p className="text-xs text-gray-600">Montant RFA</p>
              <p className="text-sm font-semibold text-purple-600">
                {formatCurrency(rfaAmount)}
              </p>
            </div>
            <div className="pt-1 border-t border-purple-200">
              <p className="text-xs text-gray-500">Sur achats HT</p>
              <p className="text-xs font-medium text-gray-700">
                {formatCurrency(globalData?.totalPurchaseAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Impact simulations */}
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Impact</span>
            {toNumber(aggregatedSimulation?.totalDeltaMargin) >= 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
          </div>
          
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Δ CA</p>
              <p className={`text-sm font-semibold ${
                toNumber(aggregatedSimulation?.totalDeltaCA) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {toNumber(aggregatedSimulation?.totalDeltaCA) >= 0 ? '+' : ''}
                {formatCurrency(aggregatedSimulation?.totalDeltaCA)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Δ Marge</p>
              <p className={`text-sm font-semibold ${
                toNumber(aggregatedSimulation?.totalDeltaMargin) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {toNumber(aggregatedSimulation?.totalDeltaMargin) >= 0 ? '+' : ''}
                {formatCurrency(aggregatedSimulation?.totalDeltaMargin)}
              </p>
            </div>
            <div className="pt-1 border-t border-gray-100">
              <p className="text-xs text-gray-500">Nouv. marge</p>
              <p className="text-sm font-medium">
                {formatPercent(aggregatedSimulation?.newAvgMargin)}
              </p>
            </div>
          </div>
        </div>

        {/* Projection finale */}
        <div className={`rounded-lg border-2 p-3 ${
          isPositive 
            ? 'bg-green-50 border-green-300' 
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">Projection</span>
            <Target className={`w-3 h-3 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-600">Gain sans RFA</p>
              <p className={`text-sm font-bold ${
                totalGainWithoutRFA >= 0 ? 'text-gray-700' : 'text-red-600'
              }`}>
                {totalGainWithoutRFA >= 0 ? '+' : ''}{formatCurrency(totalGainWithoutRFA)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Gain avec RFA</p>
              <p className={`text-lg font-bold ${
                isPositive ? 'text-green-700' : 'text-red-700'
              }`}>
                {isPositive ? '+' : ''}{formatCurrency(totalGainWithRFA)}
              </p>
            </div>
            <div className="pt-1 border-t border-gray-200/50 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Marge proj.</span>
                <span className="font-medium">
                  {formatCurrency(toNumber(globalData?.totalMargin) + totalGainWithRFA)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};