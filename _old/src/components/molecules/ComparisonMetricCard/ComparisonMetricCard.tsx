// src/components/molecules/ComparisonMetricCard/ComparisonMetricCard.tsx
'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Props for ComparisonMetricCard component
 */
export interface ComparisonMetricCardProps {
    readonly label: string;
    readonly icon: React.ReactNode;
    readonly pharmacyValue: number;
    readonly pharmacyEvolution?: number | undefined;
    readonly groupValue: number;
    readonly groupEvolution?: number | undefined;
    readonly unit: string; // '€', '%', 'pts'
    readonly isPercentage?: boolean; // For taux de marge
}

/**
 * Format number with thousands separator
 */
function formatNumber(value: number, decimals: number = 0): string {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

/**
 * Format evolution with sign and color
 */
function formatEvolution(evolution: number | undefined): {
    text: string;
    color: string;
    icon: React.ReactNode;
} {
    if (evolution === undefined || evolution === null) {
        return {
            text: 'N/A',
            color: 'text-gray-400',
            icon: <Minus className="w-3 h-3" />
        };
    }

    const isPositive = evolution > 0;
    const isNeutral = evolution === 0;

    return {
        text: `${isPositive ? '+' : ''}${formatNumber(evolution, 1)}%`,
        color: isNeutral ? 'text-gray-500' : isPositive ? 'text-green-600' : 'text-red-600',
        icon: isNeutral ? (
            <Minus className="w-3 h-3" />
        ) : isPositive ? (
            <TrendingUp className="w-3 h-3" />
        ) : (
            <TrendingDown className="w-3 h-3" />
        )
    };
}

/**
 * Calculate ecart (difference) between pharmacy and group
 */
function calculateEcart(pharmacyValue: number, groupValue: number, isPercentage: boolean): {
    value: number;
    text: string;
    color: string;
} {
    if (groupValue === 0) {
        return {
            value: 0,
            text: 'N/A',
            color: 'text-gray-400'
        };
    }

    let ecart: number;
    let text: string;

    if (isPercentage) {
        // For percentage values (taux de marge), show difference in points
        ecart = pharmacyValue - groupValue;
        text = `${ecart > 0 ? '+' : ''}${formatNumber(ecart, 1)} pts`;
    } else {
        // For absolute values, show percentage difference
        ecart = ((pharmacyValue - groupValue) / groupValue) * 100;
        text = `${ecart > 0 ? '+' : ''}${formatNumber(ecart, 1)}%`;
    }

    const isPositive = ecart > 0;
    const color = isPositive ? 'text-green-600' : ecart < 0 ? 'text-red-600' : 'text-gray-500';

    return { value: ecart, text, color };
}

/**
 * ComparisonMetricCard - Display a single metric comparison row
 * 
 * Shows pharmacy value vs group average with evolution and ecart
 */
export const ComparisonMetricCard: React.FC<ComparisonMetricCardProps> = ({
    label,
    icon,
    pharmacyValue,
    pharmacyEvolution,
    groupValue,
    groupEvolution,
    unit,
    isPercentage = false
}) => {
    const pharmacyEvo = formatEvolution(pharmacyEvolution);
    const groupEvo = formatEvolution(groupEvolution);
    const ecart = calculateEcart(pharmacyValue, groupValue, isPercentage);

    return (
        <div className="grid grid-cols-4 gap-4 py-4 px-6 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
            {/* Column 1: Indicateur */}
            <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg">
                    {icon}
                </div>
                <span className="font-semibold text-gray-900">{label}</span>
            </div>

            {/* Column 2: Ma Pharmacie */}
            <div className="flex flex-col justify-center">
                <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-gray-900">
                        {formatNumber(pharmacyValue, isPercentage ? 1 : 0)}
                    </span>
                    <span className="text-sm text-gray-500">{unit}</span>
                </div>
                {pharmacyEvolution !== undefined && (
                    <div className={`flex items-center space-x-1 mt-1 ${pharmacyEvo.color}`}>
                        {pharmacyEvo.icon}
                        <span className="text-xs font-medium">{pharmacyEvo.text}</span>
                    </div>
                )}
            </div>

            {/* Column 3: Moyenne Apothical */}
            <div className="flex flex-col justify-center">
                <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-gray-700">
                        {formatNumber(groupValue, isPercentage ? 1 : 0)}
                    </span>
                    <span className="text-sm text-gray-500">{unit}</span>
                </div>
                {groupEvolution !== undefined && (
                    <div className={`flex items-center space-x-1 mt-1 ${groupEvo.color}`}>
                        {groupEvo.icon}
                        <span className="text-xs font-medium">{groupEvo.text}</span>
                    </div>
                )}
            </div>

            {/* Column 4: Écart */}
            <div className="flex items-center justify-end">
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${ecart.value > 0 ? 'bg-green-50' : ecart.value < 0 ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                    {ecart.value > 0 ? (
                        <TrendingUp className={`w-5 h-5 ${ecart.color}`} />
                    ) : ecart.value < 0 ? (
                        <TrendingDown className={`w-5 h-5 ${ecart.color}`} />
                    ) : (
                        <Minus className={`w-5 h-5 ${ecart.color}`} />
                    )}
                    <span className={`text-lg font-bold ${ecart.color}`}>
                        {ecart.text}
                    </span>
                </div>
            </div>
        </div>
    );
};

// Performance optimization
export const MemoizedComparisonMetricCard = React.memo(ComparisonMetricCard);
