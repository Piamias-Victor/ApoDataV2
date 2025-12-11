// src/components/organisms/FilterPanel/components/ReimbursementFilterSection.tsx
'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';

type ReimbursementStatus = 'ALL' | 'REIMBURSED' | 'NOT_REIMBURSED';

interface ReimbursementFilterSectionProps {
    selectedStatus: ReimbursementStatus;
    onToggle: (status: ReimbursementStatus) => void;
}

const REIMBURSEMENT_OPTIONS: { value: ReimbursementStatus; label: string }[] = [
    { value: 'ALL', label: 'Tout' },
    { value: 'REIMBURSED', label: 'Remboursé' },
    { value: 'NOT_REIMBURSED', label: 'Non Remboursé' }
];

export const ReimbursementFilterSection: React.FC<ReimbursementFilterSectionProps> = ({
    selectedStatus,
    onToggle
}) => {
    return (
        <div className="p-6 space-y-6 border-t border-gray-100">
            {/* Header */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Statut de Remboursement
                </label>
                <p className="text-xs text-gray-500">
                    Sélectionnez un statut
                </p>
            </div>

            {/* Radio Options */}
            <div className="space-y-2">
                {REIMBURSEMENT_OPTIONS.map((option) => {
                    const isSelected = selectedStatus === option.value;

                    return (
                        <button
                            key={option.value}
                            onClick={() => onToggle(option.value)}
                            className={`
                                w-full p-4 rounded-xl border-2 transition-all duration-200
                                flex items-center gap-3
                                ${isSelected
                                    ? 'bg-green-50 border-green-300 shadow-sm'
                                    : 'bg-white border-gray-200 hover:border-green-200 hover:bg-green-50/30'
                                }
                            `}
                        >
                            {/* Radio Button */}
                            <div className={`
                                w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                ${isSelected
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-gray-300 bg-white'
                                }
                            `}>
                                {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                            </div>

                            {/* Label */}
                            <span className={`font-semibold ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                                {option.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
