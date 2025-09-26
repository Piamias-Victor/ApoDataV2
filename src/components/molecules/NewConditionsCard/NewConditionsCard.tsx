// src/components/molecules/NewConditionsCard/NewConditionsCard.tsx
import React, { useState } from 'react';
import { Calculator, Percent, DollarSign, ArrowRightLeft } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';

interface NewConditionsCardProps {
  readonly values: {
    readonly newBuyPrice: string;
    readonly newDiscount: string;
    readonly newSellPrice: string;
  };
  readonly placeholders: {
    readonly buyPrice: number;
    readonly sellPrice: number;
    readonly tvaRate: number;
  };
  readonly onChange: (field: 'newBuyPrice' | 'newDiscount' | 'newSellPrice', value: string) => void;
  readonly netPrice?: number | undefined;
}

export const NewConditionsCard: React.FC<NewConditionsCardProps> = ({
  values,
  placeholders,
  onChange,
  netPrice
}) => {
  const [reverseMode, setReverseMode] = useState(false);
  const [targetMargin, setTargetMargin] = useState('');
  const [targetCoef, setTargetCoef] = useState('');
  const [targetSellPrice, setTargetSellPrice] = useState('');

  const handleInputChange = (field: 'newBuyPrice' | 'newDiscount' | 'newSellPrice') => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === '' || /^\d*[.,]?\d*$/.test(value)) {
        onChange(field, value.replace(',', '.'));
      }
    };

  const calculateRequiredBuyPrice = () => {
    const sellPrice = parseFloat(targetSellPrice.replace(',', '.'));
    const margin = parseFloat(targetMargin.replace(',', '.'));
    const coef = parseFloat(targetCoef.replace(',', '.'));
    
    if (sellPrice > 0) {
      const sellPriceHT = sellPrice / (1 + placeholders.tvaRate / 100);
      
      if (margin > 0 && margin < 100) {
        const buyPrice = sellPriceHT * (1 - margin / 100);
        return buyPrice.toFixed(2).replace('.', ',');
      } else if (coef > 0) {
        const buyPrice = sellPrice / coef;
        return buyPrice.toFixed(2).replace('.', ',');
      }
    }
    return 'Saisir les valeurs';
  };

  const formatPlaceholder = (value: number) => 
    value.toFixed(2).replace('.', ',');

  return (
    <Card variant="elevated" className="h-full border-2 border-green-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calculator className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Nouvelles conditions</h3>
              <p className="text-xs text-gray-500">
                {reverseMode ? 'Calcul inversé' : 'Simulez vos tarifs'}
              </p>
            </div>
          </div>
        </div>

        {/* Bouton de bascule bien visible */}
        <div className="mb-4">
          <Button
            variant={reverseMode ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setReverseMode(!reverseMode)}
            iconLeft={<ArrowRightLeft className="w-4 h-4" />}
            className="w-full"
          >
            {reverseMode 
              ? 'Retour au mode normal' 
              : 'Fixer un PV ou Marge Cible'}
          </Button>
        </div>

        {!reverseMode ? (
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                Prix tarif HT
              </label>
              <Input
                type="text"
                value={values.newBuyPrice}
                onChange={handleInputChange('newBuyPrice')}
                placeholder={formatPlaceholder(placeholders.buyPrice)}
                className="w-full"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Percent className="w-4 h-4 text-gray-400" />
                Remise (%)
              </label>
              <Input
                type="text"
                value={values.newDiscount}
                onChange={handleInputChange('newDiscount')}
                placeholder="0"
                className="w-full"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                Prix vente TTC
              </label>
              <Input
                type="text"
                value={values.newSellPrice}
                onChange={handleInputChange('newSellPrice')}
                placeholder={formatPlaceholder(placeholders.sellPrice)}
                className="w-full"
              />
            </div>

            {netPrice !== undefined && netPrice > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <div className="text-sm text-gray-600 mb-1">Prix net après remise HT</div>
                <div className="text-xl font-bold text-green-600">
                  {netPrice.toFixed(2).replace('.', ',')} €
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                Prix vente TTC cible
              </label>
              <Input
                type="text"
                value={targetSellPrice}
                onChange={(e) => setTargetSellPrice(e.target.value)}
                placeholder={formatPlaceholder(placeholders.sellPrice)}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1">
                  Marge cible (%)
                </label>
                <Input
                  type="text"
                  value={targetMargin}
                  onChange={(e) => {
                    setTargetMargin(e.target.value);
                    setTargetCoef('');
                  }}
                  placeholder="30"
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1">
                  OU Coef. cible
                </label>
                <Input
                  type="text"
                  value={targetCoef}
                  onChange={(e) => {
                    setTargetCoef(e.target.value);
                    setTargetMargin('');
                  }}
                  placeholder="1,5"
                  className="w-full"
                />
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Prix d'achat HT requis</div>
              <div className="text-xl font-bold text-purple-600">
                {calculateRequiredBuyPrice()} €
              </div>
              
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};