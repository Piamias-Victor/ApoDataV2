// src/components/atoms/GenericStatusFilter/GenericStatusFilter.tsx
'use client';

import React from 'react';
import { Pill } from 'lucide-react';

type GenericStatus = 'BOTH' | 'GÉNÉRIQUE' | 'RÉFÉRENT';

interface GenericStatusFilterProps {
  readonly value: GenericStatus;
  readonly onChange: (status: GenericStatus) => void;
}

const OPTIONS: { value: GenericStatus; label: string; color: string }[] = [
  { value: 'BOTH', label: 'Les deux', color: 'gray' },
  { value: 'GÉNÉRIQUE', label: 'Générique', color: 'blue' },
  { value: 'RÉFÉRENT', label: 'Référent', color: 'green' }
];

export const GenericStatusFilter: React.FC<GenericStatusFilterProps> = ({
  value,
  onChange
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Pill className="w-4 h-4 text-emerald-600" />
        <h3 className="text-sm font-semibold text-gray-900">Type de produit</h3>
      </div>

      <div className="space-y-2">
        {OPTIONS.map((option) => {
          const isSelected = value === option.value;
          
          return (
            <label
              key={option.value}
              className={`
                flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                ${isSelected
                  ? option.color === 'gray'
                    ? 'bg-gray-50 border-gray-300'
                    : option.color === 'blue'
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-green-50 border-green-300'
                  : 'bg-white border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="radio"
                name="generic-status"
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className={`
                  w-4 h-4 cursor-pointer
                  ${option.color === 'gray' && 'text-gray-600'}
                  ${option.color === 'blue' && 'text-blue-600'}
                  ${option.color === 'green' && 'text-green-600'}
                `}
              />
              <span className="text-sm font-medium text-gray-900">
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};