// src/components/organisms/FilterPanel/components/PharmacyCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Euro, Hash, Check, Building2 } from 'lucide-react';


interface Pharmacy {
    id: string;
    name: string;
    address: string;
    ca: number;
    region: string;
    id_nat: string;
}

interface PharmacyCardProps {
    pharmacy: Pharmacy;
    isSelected: boolean;
    onToggle: (pharmacy: Pharmacy) => void;
}

export const PharmacyCard: React.FC<PharmacyCardProps> = ({ pharmacy, isSelected, onToggle }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <motion.div
            layoutId={pharmacy.id}
            onClick={() => onToggle(pharmacy)}
            className={`
                group relative p-4 rounded-xl cursor-pointer transition-all duration-200 border
                ${isSelected
                    ? 'bg-orange-50/50 border-orange-200 shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-md'
                }
            `}
        >
            <div className="flex items-start gap-4">
                {/* Visual Icon */}
                <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors
                    ${isSelected
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600'
                    }
                `}>
                    <Building2 className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start">
                        <h4 className={`font-bold text-base truncate pr-2 ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>
                            {pharmacy.name}
                        </h4>

                        {/* Checkmark Indicator */}
                        <div className={`
                            w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0
                            ${isSelected
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'border-gray-200 bg-transparent'
                            }
                        `}>
                            {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                        </div>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5" title="Identifiant National">
                            <Hash className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-mono text-xs">{pharmacy.id_nat}</span>
                        </div>
                        <div className="w-1 h-1 bg-gray-300 rounded-full" />
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate">{pharmacy.region}</span>
                        </div>
                        <div className="w-1 h-1 bg-gray-300 rounded-full" />
                        <div className="flex items-center gap-1.5">
                            <Euro className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-medium text-gray-700">{formatCurrency(pharmacy.ca)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
