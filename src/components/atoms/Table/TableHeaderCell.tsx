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

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({
    children,
    align = 'left',
    variant = 'gray',
    className = '',
    width,
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
            `}
            style={{ width }}
        >
            {children}
        </th>
    );
};
