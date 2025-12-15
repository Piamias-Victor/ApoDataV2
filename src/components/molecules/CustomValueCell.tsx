import React from 'react';
import { EvolutionBadge } from '@/components/atoms/EvolutionBadge';

interface CustomValueCellProps {
    value: number | undefined | null;
    evolution?: number | null;
    isCurrency?: boolean;
    suffix?: string;
    decimals?: number;
}

export const CustomValueCell: React.FC<CustomValueCellProps> = ({
    value,
    evolution,
    isCurrency = false,
    suffix = '',
    decimals = 0
}) => {
    if (value === undefined || value === null) return <span className="text-gray-300">-</span>;

    // Format value
    let formattedValue;
    if (isCurrency) {
        formattedValue = Math.round(value).toLocaleString('fr-FR') + ' €';
    } else {
        formattedValue = value.toLocaleString('fr-FR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }) + suffix;
    }

    return (
        <div className="flex flex-col items-end">
            <span className="font-medium text-gray-900 text-sm">
                {formattedValue}
            </span>
            {evolution !== undefined && evolution !== null && <EvolutionBadge value={evolution} />}
        </div>
    );
};
