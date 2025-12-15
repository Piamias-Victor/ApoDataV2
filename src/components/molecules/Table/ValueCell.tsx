import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export const EvolutionBadge = ({ value }: { value?: number | null }) => {
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

export const ValueCell = ({
    value,
    evolution,
    isCurrency = false,
    suffix = '',
    textSize = 'text-sm',
    decimals = 0
}: {
    value?: number | null | undefined,
    evolution?: number | null | undefined,
    isCurrency?: boolean | undefined,
    suffix?: string | undefined,
    textSize?: string | undefined,
    decimals?: number | undefined
}) => {
    if (value === undefined || value === null) return <span className="text-gray-300">-</span>;

    // Format value
    let formattedValue;
    if (isCurrency) {
        formattedValue = Math.round(value).toLocaleString('fr-FR'); // Currency usually rounded to int in this app based on prev code? Original was Math.round(value).
        // specific request: "clean code". If currency, usually we want standard formatting.
        // But original Code: "Math.round(value).toLocaleString()".
        // Let's stick to simple formatting but allow decimals if provided?
        // If decimals provided, respect it. If not, round (for retro compatibility).
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
        <div className="flex flex-col">
            <span className={`font-medium text-gray-900 ${textSize}`}>
                {formattedValue}{isCurrency ? ' €' : suffix}
            </span>
            {(evolution !== undefined && evolution !== null) && <EvolutionBadge value={evolution} />}
        </div>
    );
};
