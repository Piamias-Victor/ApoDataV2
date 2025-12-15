import React from 'react';

type TableHeaderColor = 'purple' | 'blue' | 'orange' | 'green' | 'red' | 'pink' | 'gray';

interface TableHeaderCellProps {
    children: React.ReactNode;
    align?: 'left' | 'center' | 'right';
    variant?: TableHeaderColor;
    className?: string;
    width?: string;
}

const colorStyles: Record<TableHeaderColor, string> = {
    purple: 'text-purple-600/80 bg-purple-50/20',
    blue: 'text-blue-600/80 bg-blue-50/20',
    orange: 'text-orange-600/80 bg-orange-50/20',
    green: 'text-green-600/80 bg-green-50/20',
    red: 'text-red-600/80 bg-red-50/20',
    pink: 'text-pink-600/80 bg-pink-50/20',
    gray: 'text-gray-600',
};

import { ArrowUp, ArrowDown } from 'lucide-react';

export const TableHeaderCell: React.FC<TableHeaderCellProps & { isSortable?: boolean; sortDirection?: 'asc' | 'desc' | null; onSort?: () => void }> = ({
    children,
    align = 'left',
    variant = 'gray',
    className = '',
    width,
    isSortable = false,
    sortDirection = null,
    onSort
}) => {
    return (
        <th
            className={`
                px-2 md:px-4 py-3.5 
                font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap
                border-b border-gray-100
                text-${align}
                ${colorStyles[variant]}
                ${className}
                ${isSortable ? 'cursor-pointer hover:bg-opacity-50 transition-colors select-none' : ''}
            `}
            style={{ width }}
            onClick={isSortable ? onSort : undefined}
        >
            <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
                {children}
                {isSortable && (
                    <div className="flex flex-col opacity-50">
                        {sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-current font-bold" />
                        ) : sortDirection === 'desc' ? (
                            <ArrowDown className="w-3 h-3 text-current font-bold" />
                        ) : (
                            <div className="h-3 w-3" /> // Placeholder to prevent jump, or maybe just show nothing/greyed arrows
                        )}
                    </div>
                )}
            </div>
        </th>
    );
};
