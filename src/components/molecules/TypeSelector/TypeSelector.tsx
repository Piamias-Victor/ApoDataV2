// src/components/molecules/TypeSelector/TypeSelector.tsx
'use client';

import React from 'react';
import { Package, TestTube, Tag } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';
import type { ComparisonType } from '@/types/comparison';

interface TypeSelectorProps {
  readonly selectedType: ComparisonType | null;
  readonly onTypeSelect: (type: ComparisonType) => void;
  readonly className?: string;
}

/**
 * TypeSelector - Sélection type de comparaison
 * 
 * 3 cards horizontales avec icônes Lucide :
 * - Produits (Package)
 * - Laboratoires (TestTube) 
 * - Catégories (Tag)
 * 
 * Design Apple/Stripe : cards interactives avec border blue-500
 * Responsive : grid-cols-1 md:grid-cols-3
 */
export const TypeSelector: React.FC<TypeSelectorProps> = ({
  selectedType,
  onTypeSelect,
  className = '',
}) => {
  const types: Array<{
    key: ComparisonType;
    label: string;
    description: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }> = [
    {
      key: 'products',
      label: 'Produits',
      description: 'Comparer 2-3 produits pharmaceutiques',
      icon: Package,
    },
    {
      key: 'laboratories',
      label: 'Laboratoires',
      description: 'Comparer 2-3 laboratoires',
      icon: TestTube,
    },
    {
      key: 'categories',
      label: 'Catégories',
      description: 'Comparer 2-3 catégories/univers',
      icon: Tag,
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          1. Choisissez le type de comparaison
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Sélectionnez le type d'éléments que vous souhaitez comparer (2 minimum, 3 maximum)
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {types.map(({ key, label, description, icon: Icon }) => {
          const isSelected = selectedType === key;
          
          return (
            <Card
              key={key}
              variant="elevated"
              padding="md"
              onClick={() => onTypeSelect(key)}
              className={`
                text-center transition-all duration-200 cursor-pointer hover:shadow-md
                border-gray-200 bg-white
                ${isSelected 
                  ? 'ring-2 ring-blue-500 ring-opacity-50 border-blue-300 bg-blue-50' 
                  : 'hover:border-gray-300'
                }
              `}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className={`
                  p-3 rounded-xl transition-colors
                  ${isSelected 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                  }
                `}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <div>
                  <h3 className={`
                    font-semibold text-sm
                    ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                  `}>
                    {label}
                  </h3>
                  <p className={`
                    text-xs mt-1 leading-relaxed
                    ${isSelected ? 'text-blue-700' : 'text-gray-600'}
                  `}>
                    {description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};