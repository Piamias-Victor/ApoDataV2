import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export const EvolutionBadge = ({ value }: { value: number }) => {
    if (!value || isNaN(value)) return <span className="text-gray-300 text-[10px]">-</span>;
    const isPositive = value > 0;
    const isNegative = value < 0;
    const color = isPositive ? 'text-green-600 bg-green-50' : isNegative ? 'text-red-600 bg-red-50' : 'text-gray-400 bg-gray-50';
    const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : null;

    return (
        <div className={`flex items-center w-fit px-1.5 py-0.5 rounded text-[10px] font-medium ${color} mt-1`}>
            {Icon && <Icon className="w-3 h-3 mr-0.5" />}
            {Math.abs(value).toFixed(1)}%
        </div>
    );
};

export const ValueCell = ({ value, evolution, isCurrency = false, suffix = '' }: { value: number, evolution?: number, isCurrency?: boolean, suffix?: string }) => (
    <div className="flex flex-col">
        <span className="font-medium text-gray-900 text-sm">
            {isCurrency ? Math.round(value).toLocaleString() : Math.round(value)}
            {isCurrency ? '€' : suffix}
        </span>
        {evolution !== undefined && <EvolutionBadge value={evolution} />}
    </div>
);
