import React from 'react';

type TableCellColor = 'purple' | 'blue' | 'orange' | 'green' | 'gray' | 'red' | 'pink' | 'none';

interface TableCellProps {
    children: React.ReactNode;
    align?: 'left' | 'center' | 'right';
    variant?: TableCellColor;
    className?: string;
    isGroupHover?: boolean;
}

const colorStyles: Record<TableCellColor, string> = {
    purple: 'bg-purple-50/5',
    blue: 'bg-blue-50/5',
    orange: 'bg-orange-50/5',
    green: 'bg-green-50/5',
    red: 'bg-red-50/5',
    pink: 'bg-pink-50/5',
    gray: 'bg-gray-50/30',
    none: '',
};

const groupHoverStyles: Record<TableCellColor, string> = {
    purple: 'group-hover:bg-purple-50/10',
    blue: 'group-hover:bg-blue-50/10',
    orange: 'group-hover:bg-orange-50/10',
    green: 'group-hover:bg-green-50/10',
    red: 'group-hover:bg-red-50/10',
    pink: 'group-hover:bg-pink-50/10',
    gray: 'group-hover:bg-gray-50/50',
    none: '',
};

export const TableCell: React.FC<TableCellProps & { isSticky?: boolean; style?: React.CSSProperties }> = ({
    children,
    align = 'left',
    variant = 'none',
    className = '',
    isGroupHover = true,
    isSticky = false,
    style
}) => {
    return (
        <td
            style={style}
            className={`
                px-2 md:px-4 py-3.5 
                whitespace-nowrap
                text-${align}
                ${colorStyles[variant]}
                ${isGroupHover ? groupHoverStyles[variant] : ''}
                ${className}
                ${isSticky ? 'sticky left-0 z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}
            `}
        >
            {children}
        </td>
    );
};
