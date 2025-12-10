// src/components/molecules/PriceRangeFilters/PriceRangeFilters.tsx
'use client';

import React from 'react';
import { DollarSign, TrendingDown } from 'lucide-react';

interface PriceRange {
  min: string;
  max: string;
}

interface LocalPriceFilters {
  prixFabricant: PriceRange;
  prixNetRemise: PriceRange;
  remise: PriceRange;
}

interface PriceRangeFiltersProps {
  readonly localFilters: LocalPriceFilters;
  readonly onFiltersChange: (filters: LocalPriceFilters) => void;
  readonly onClear: () => void;
  readonly hasActiveFilters: boolean;
  readonly className?: string;
}

/**
 * PriceRangeFilters Component
 * 
 * Composant controllé pour filtres de prix.
 * State géré par le parent (GenericFilterDrawer).
 * Pas de bouton "Appliquer" interne - géré par le drawer.
 */
export const PriceRangeFilters: React.FC<PriceRangeFiltersProps> = ({ 
  localFilters,
  onFiltersChange,
  onClear,
  hasActiveFilters,
  className = '' 
}) => {

  const handleChange = (
    category: 'prixFabricant' | 'prixNetRemise' | 'remise',
    type: 'min' | 'max',
    value: string
  ) => {
    onFiltersChange({
      ...localFilters,
      [category]: {
        ...localFilters[category],
        [type]: value
      }
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Filtres de prix</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-red-600 font-medium transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Prix Fabricant */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">
          Prix Fabricant (€)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={localFilters.prixFabricant.min}
            onChange={(e) => handleChange('prixFabricant', 'min', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            step="0.01"
            min="0"
          />
          <input
            type="number"
            placeholder="Max"
            value={localFilters.prixFabricant.max}
            onChange={(e) => handleChange('prixFabricant', 'max', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            step="0.01"
            min="0"
          />
        </div>
      </div>

      {/* Prix Net Remise */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">
          Prix Net Remise (€)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={localFilters.prixNetRemise.min}
            onChange={(e) => handleChange('prixNetRemise', 'min', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            step="0.01"
            min="0"
          />
          <input
            type="number"
            placeholder="Max"
            value={localFilters.prixNetRemise.max}
            onChange={(e) => handleChange('prixNetRemise', 'max', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            step="0.01"
            min="0"
          />
        </div>
      </div>

      {/* Remise */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700 flex items-center space-x-1">
          <TrendingDown className="w-3 h-3" />
          <span>Remise (%)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={localFilters.remise.min}
            onChange={(e) => handleChange('remise', 'min', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            step="0.1"
            min="0"
            max="100"
          />
          <input
            type="number"
            placeholder="Max"
            value={localFilters.remise.max}
            onChange={(e) => handleChange('remise', 'max', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            step="0.1"
            min="0"
            max="100"
          />
        </div>
      </div>

      {/* Info filtres actifs dans le store */}
      {hasActiveFilters && (
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <p className="font-medium text-gray-700 mb-1">Filtres appliqués</p>
          <p className="text-gray-500">Modifiez les valeurs ci-dessus et cliquez sur "Appliquer" pour mettre à jour</p>
        </div>
      )}
    </div>
  );
};