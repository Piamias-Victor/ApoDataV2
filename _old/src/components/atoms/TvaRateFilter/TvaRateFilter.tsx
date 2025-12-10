// src/components/atoms/TvaRateFilter/TvaRateFilter.tsx
'use client';

import React from 'react';
import { Receipt } from 'lucide-react';

interface TvaRateFilterProps {
  readonly selectedRates: number[];
  readonly onChange: (rates: number[]) => void;
}

const TVA_RATES = [0, 2.1, 5.5, 10, 20];

export const TvaRateFilter: React.FC<TvaRateFilterProps> = ({
  selectedRates,
  onChange
}) => {
  const handleToggle = (rate: number) => {
    if (selectedRates.includes(rate)) {
      onChange(selectedRates.filter(r => r !== rate));
    } else {
      onChange([...selectedRates, rate]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Receipt className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-900">Taux de TVA</h3>
        {selectedRates.length > 0 && (
          <span className="text-xs text-indigo-600 font-medium">
            ({selectedRates.length} sélectionné{selectedRates.length > 1 ? 's' : ''})
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {TVA_RATES.map((rate) => {
          const isSelected = selectedRates.includes(rate);
          
          return (
            <button
              key={rate}
              onClick={() => handleToggle(rate)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${isSelected
                  ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {rate}%
            </button>
          );
        })}
      </div>

      {selectedRates.length > 0 && (
        <p className="text-xs text-gray-500">
          Filtrera les produits avec {selectedRates.length === 1 
            ? `un taux de ${selectedRates[0]}%` 
            : `les taux: ${selectedRates.sort((a, b) => a - b).join('%, ')}%`
          }
        </p>
      )}
    </div>
  );
};