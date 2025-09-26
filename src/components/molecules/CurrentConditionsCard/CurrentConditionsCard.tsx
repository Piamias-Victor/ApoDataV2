// src/components/molecules/CurrentConditionsCard/CurrentConditionsCard.tsx
import React from 'react';
import { TrendingUp, Package, Percent, Calculator } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';

interface CurrentConditionsCardProps {
  readonly productName: string;
  readonly conditions: {
    readonly avg_buy_price_ht: number;
    readonly pharmacy_count: number;
    readonly quantity_sold: number;
    readonly avg_sell_price_ttc: number;
    readonly tva_rate: number;
    readonly current_margin_percent: number;
    readonly current_coefficient: number;
  };
}

export const CurrentConditionsCard: React.FC<CurrentConditionsCardProps> = ({
  productName,
  conditions
}) => {
  const formatCurrency = (value: number) => 
    `${value.toFixed(2).replace('.', ',')} €`;
  
  const formatNumber = (value: number, decimals = 0) => 
    value.toFixed(decimals).replace('.', ',');

  return (
    <Card variant="elevated" className="h-full">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Conditions actuelles</h3>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">
              {productName}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Prix achat HT</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(conditions.avg_buy_price_ht)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Prix vente TTC</div>
              <div className="font-semibold">{formatCurrency(conditions.avg_sell_price_ttc)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">TVA</div>
              <div className="font-semibold">{formatNumber(conditions.tva_rate, 1)}%</div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Percent className="w-3 h-3" />
                Marge
              </span>
              <span className="font-semibold text-blue-600">
                {formatNumber(conditions.current_margin_percent, 1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Calculator className="w-3 h-3" />
                Coefficient
              </span>
              <span className="font-semibold">
                {formatNumber(conditions.current_coefficient, 2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Package className="w-3 h-3" />
                Qté vendue
              </span>
              <span className="font-semibold">
                {formatNumber(conditions.quantity_sold)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};