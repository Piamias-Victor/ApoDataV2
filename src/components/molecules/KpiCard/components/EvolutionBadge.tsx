import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface EvolutionBadgeProps {
    evolutionPercent: number | undefined;
    label?: string | undefined;
    isSecondary?: boolean;
}

export const EvolutionBadge: React.FC<EvolutionBadgeProps> = ({ evolutionPercent, label, isSecondary = false }) => {
    if (evolutionPercent === undefined) return null;

    const isPositive = evolutionPercent > 0;
    const isNegative = evolutionPercent < 0;

    const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

    if (isSecondary) {
        const colorClass = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500';
        return (
            <div className={`flex items-center gap-1 mt-0.5 ${colorClass}`}>
                <Icon className="w-3 h-3" />
                <span className="text-xs font-bold">
                    {Math.abs(evolutionPercent).toFixed(1)}%
                </span>
                {label && <span className="text-[10px] text-gray-400 ml-1">{label}</span>}
            </div>
        );
    }

    // Primary Style
    const colorClass = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500';
    const bgClass = isPositive ? 'bg-green-50' : isNegative ? 'bg-red-50' : 'bg-gray-50';

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 ${bgClass} rounded-lg`}>
            <Icon className={`w-4 h-4 ${colorClass}`} />
            <span className={`text-sm font-bold ${colorClass}`}>
                {isPositive && '+'}{evolutionPercent.toFixed(1)}%
            </span>
            {label && <span className="text-[10px] text-gray-500 ml-1">{label}</span>}
        </div>
    );
};
