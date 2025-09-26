// src/components/molecules/CurrentConditionsCard/CurrentConditionsCard.tsx
import React from 'react';
import { Package } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';

interface CurrentConditionsCardProps {
  readonly productName: string;
  readonly conditions: {
    readonly avg_buy_price_ht: number;
    readonly avg_sell_price_ttc: number;
    readonly tva_rate: number;
    readonly current_margin_percent: number;
    readonly current_coefficient: number;
    readonly quantity_sold: number;
    readonly quantity_bought: number;
    readonly total_purchase_amount: number;
  };
}

export const CurrentConditionsCard: React.FC<CurrentConditionsCardProps> = ({
  productName,
  conditions
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

  const formatPrice = (value: any, decimals: number = 2) => {
    const num = toNumber(value);
    return num.toFixed(decimals).replace('.', ',');
  };

  const formatLargeNumber = (value: any) => {
    const num = toNumber(value);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1).replace('.', ',')}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1).replace('.', ',')}k`;
    }
    return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const formatCurrency = (value: any, compact: boolean = true) => {
    const num = toNumber(value);
    if (compact && num >= 1000000) {
      return `${(num / 1000000).toFixed(1).replace('.', ',')}M €`;
    }
    if (compact && num >= 1000) {
      return `${(num / 1000).toFixed(0)}k €`;
    }
    return `${num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`;
  };

  return (
    <Card variant="elevated" className="h-full border-2 border-blue-200">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Conditions actuelles</h3>
            <p className="text-xs text-gray-500 truncate max-w-[200px]" title={productName}>
              {productName}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500">Prix achat HT</div>
              <div className="font-semibold text-gray-900">
                {formatPrice(conditions.avg_buy_price_ht)} €
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Prix vente TTC</div>
              <div className="font-semibold text-gray-900">
                {formatPrice(conditions.avg_sell_price_ttc)} €
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500">TVA</div>
              <div className="font-medium text-gray-700">
                {formatPrice(conditions.tva_rate, 1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Marge</div>
              <div className="font-medium text-green-600">
                {formatPrice(conditions.current_margin_percent, 1)}%
              </div>
            </div>
          </div>

          <div className="pt-3 border-t space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Coefficient</span>
              <span className="font-medium text-purple-600">
                {formatPrice(conditions.current_coefficient)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Qté vendue</span>
              <span className="font-medium text-gray-900">
                {formatLargeNumber(conditions.quantity_sold)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Qté achetée</span>
              <span className="font-medium text-gray-900">
                {formatLargeNumber(conditions.quantity_bought)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Montant acheté</span>
              <span className="font-medium text-blue-600">
                {formatCurrency(conditions.total_purchase_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};