import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export const EvolutionBadge = ({ value }: { value?: number | null }) => {
    if (!value || isNaN(value)) return <span className="text-gray-300 text-[10px]">-</span>;
    const isPositive = value > 0;
    const isNegative = value < 0;
    const color = isPositive ? 'text-green-600 bg-green-50' : isNegative ? 'text-red-600 bg-red-50' : 'text-gray-400 bg-gray-50';
    const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : null;

    return (
        <div className={`flex items-center w-fit px-1.5 py-0.5 rounded text-[10px] font-medium ${color}`}>
            {Icon && <Icon className="w-3 h-3 mr-0.5" />}
            {Math.abs(value).toFixed(1)}%
        </div>
    );
};

export const ValueCell = ({
    value,
    evolution,
    isCurrency = false,
    suffix = '',
    textSize = 'text-sm',
    decimals = 0,
    className = ''
}: {
    value?: number | null | undefined,
    evolution?: number | null | undefined,
    isCurrency?: boolean | undefined,
    suffix?: string | undefined,
    textSize?: string | undefined,
    decimals?: number | undefined,
    className?: string
}) => {
    if (value === undefined || value === null) return <span className="text-gray-300">-</span>;

    // Format value
    let formattedValue;
    if (isCurrency) {
        formattedValue = Math.round(value).toLocaleString('fr-FR');
        if (decimals > 0) {
            formattedValue = value.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        } else {
            formattedValue = Math.round(value).toLocaleString('fr-FR');
        }
    } else {
        formattedValue = value.toLocaleString('fr-FR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    return (
        <div className="flex flex-col items-end gap-0.5">
            <span className={`font-medium ${textSize} truncate ${className} ${!className.includes('text-') ? 'text-gray-900' : ''}`}>
                {formattedValue}{isCurrency ? ' €' : suffix}
            </span>
            {(evolution !== undefined && evolution !== null) && <EvolutionBadge value={evolution} />}
        </div>
    );
};
