// src/components/organisms/FilterPanel/components/TvaFilterSection.tsx
'use client';

import React from 'react';
import { Percent } from 'lucide-react';

const TVA_RATES = [0, 2.1, 5.5, 10, 20];

interface TvaFilterSectionProps {
    selectedTvaRates: number[];
    onToggleTva: (rate: number) => void;
}

export const TvaFilterSection: React.FC<TvaFilterSectionProps> = ({
    selectedTvaRates,
    onToggleTva
}) => {
    const formatTvaRate = (rate: number) => {
        return rate === 0 ? '0 %' : `${rate.toString().replace('.', ',')} %`;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2.5">
                    <Percent className="w-3.5 h-3.5" />
                    Taux de TVA
                </label>
                <p className="text-xs text-gray-500">
                    Cliquez pour sélectionner
                </p>
            </div>

            {/* TVA Checkboxes */}
            <div className="space-y-2">
                {TVA_RATES.map((rate) => {
                    const isSelected = selectedTvaRates.includes(rate);

                    return (
                        <button
                            key={rate}
                            onClick={() => onToggleTva(rate)}
                            className={`
                                w-full p-4 rounded-xl border-2 transition-all duration-200
                                flex items-center gap-3
                                ${isSelected
                                    ? 'bg-green-50 border-green-300 shadow-sm'
                                    : 'bg-white border-gray-200 hover:border-green-200 hover:bg-green-50/30'
                                }
                            `}
                        >
                            {/* Checkbox */}
                            <div className={`
                                w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                                ${isSelected
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-gray-300 bg-white'
                                }
                            `}>
                                {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>

                            {/* Label */}
                            <span className={`font-semibold ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                                {formatTvaRate(rate)}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
