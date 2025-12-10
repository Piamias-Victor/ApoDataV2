// src/components/atoms/Select/Select.tsx
'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  readonly value: string;
  readonly label: string;
}

interface SelectProps {
  readonly label?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: SelectOption[];
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  required = false,
  disabled = false,
  loading = false,
  error
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
          required={required}
          className={`
            w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          `}
        >
          <option value="" disabled>
            {loading ? 'Chargement...' : placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};