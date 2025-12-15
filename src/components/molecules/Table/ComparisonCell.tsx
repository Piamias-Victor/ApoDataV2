import React from 'react';
import { ValueCell } from '@/components/molecules/Table/ValueCell';

interface ComparisonCellProps {
    value?: number | null | undefined;
    evolution?: number | null | undefined;
    groupValue?: number | null | undefined;
    groupEvolution?: number | null | undefined;
    isCurrency?: boolean | undefined;
    suffix?: string | undefined;
    textSize?: string | undefined;
    decimals?: number | undefined;
}

export const ComparisonCell: React.FC<ComparisonCellProps> = ({
    value,
    evolution,
    groupValue,
    groupEvolution,
    isCurrency,
    suffix,
    textSize = 'text-xs',
    decimals,
}) => {
    return (
        <div className="grid grid-cols-2 gap-4 min-w-[100px] md:min-w-[140px]">
            <ValueCell
                value={value ?? undefined}
                evolution={evolution ?? undefined}
                isCurrency={isCurrency}
                suffix={suffix}
                textSize={textSize}
                decimals={decimals}
            />
            <div className="opacity-60 grayscale scale-95 origin-top-left">
                <ValueCell
                    value={groupValue ?? undefined}
                    evolution={groupEvolution ?? undefined}
                    isCurrency={isCurrency}
                    suffix={suffix}
                    textSize={textSize}
                    decimals={decimals}
                />
            </div>
        </div>
    );
};
