// src/components/atoms/ProductTypeFilter/ProductTypeFilter.tsx
'use client';

import React from 'react';
import { Pill, Package } from 'lucide-react';

interface ProductTypeFilterProps {
    readonly selectedType: 'ALL' | 'MEDICAMENT' | 'PARAPHARMACIE';
    readonly onChange: (type: 'ALL' | 'MEDICAMENT' | 'PARAPHARMACIE') => void;
}

export const ProductTypeFilter: React.FC<ProductTypeFilterProps> = ({
    selectedType,
    onChange
}) => {
    const options = [
        { value: 'ALL' as const, label: 'Tous', icon: Package },
        { value: 'MEDICAMENT' as const, label: 'Médicaments', icon: Pill },
        { value: 'PARAPHARMACIE' as const, label: 'Parapharmacie', icon: Package }
    ];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Type de produit</h3>
                {selectedType !== 'ALL' && (
                    <span className="text-xs text-indigo-600 font-medium">
                        1 sélectionné
                    </span>
                )}
            </div>

            <div className="space-y-2">
                {options.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedType === option.value;

                    return (
                        <button
                            key={option.value}
                            onClick={() => onChange(option.value)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${isSelected
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                <Icon
                                    className={`w-5 h-5 ${isSelected ? 'text-indigo-600' : 'text-gray-400'
                                        }`}
                                />
                                <span className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-700'
                                    }`}>
                                    {option.label}
                                </span>
                            </div>

                            {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <p className="text-xs text-gray-500 mt-2">
                Les médicaments ont un code commençant par <code className="px-1 py-0.5 bg-gray-100 rounded text-gray-700">34009</code>
            </p>
        </div>
    );
};
