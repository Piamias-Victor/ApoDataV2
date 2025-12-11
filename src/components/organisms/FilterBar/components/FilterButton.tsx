// src/components/organisms/FilterBar/components/FilterButton.tsx
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

export type FilterButtonColor = 'orange' | 'blue' | 'purple' | 'red' | 'green' | 'yellow' | 'black';

interface FilterButtonProps {
    icon: React.ReactNode;
    label: string;
    count: number;
    color: FilterButtonColor;
    onClick: () => void;
    tooltip?: string;
    isActive: boolean;
}

const COLOR_CLASSES: Record<FilterButtonColor, {
    bg: string;
    text: string;
    border: string;
    hover: string;
    activeBorder: string;
    activeGlow: string;
}> = {
    orange: {
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        border: 'border-orange-300',
        hover: 'hover:border-orange-400 hover:bg-orange-50/50',
        activeBorder: 'border-orange-500',
        activeGlow: 'shadow-orange-200'
    },
    blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-300',
        hover: 'hover:border-blue-400 hover:bg-blue-50/50',
        activeBorder: 'border-blue-500',
        activeGlow: 'shadow-blue-200'
    },
    purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-300',
        hover: 'hover:border-purple-400 hover:bg-purple-50/50',
        activeBorder: 'border-purple-500',
        activeGlow: 'shadow-purple-200'
    },
    red: {
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-300',
        hover: 'hover:border-red-400 hover:bg-red-50/50',
        activeBorder: 'border-red-500',
        activeGlow: 'shadow-red-200'
    },
    green: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-300',
        hover: 'hover:border-green-400 hover:bg-green-50/50',
        activeBorder: 'border-green-500',
        activeGlow: 'shadow-green-200'
    },
    yellow: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        border: 'border-yellow-300',
        hover: 'hover:border-yellow-400 hover:bg-yellow-50/50',
        activeBorder: 'border-yellow-500',
        activeGlow: 'shadow-yellow-200'
    },
    black: {
        bg: 'bg-gray-50',
        text: 'text-gray-900',
        border: 'border-gray-300',
        hover: 'hover:border-gray-400 hover:bg-gray-50/50',
        activeBorder: 'border-gray-900',
        activeGlow: 'shadow-gray-200'
    }
};

/**
 * Filter button component with tooltip support
 */
export const FilterButton: React.FC<FilterButtonProps> = ({ icon, label, count, color, onClick, tooltip, isActive }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const colors = COLOR_CLASSES[color];

    return (
        <div className="relative pointer-events-none">
            <button
                ref={buttonRef}
                onClick={onClick}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`
                    pointer-events-auto flex items-center gap-2.5 px-3 md:px-4 py-2.5 bg-white rounded-xl border-2 transition-all group whitespace-nowrap min-w-max
                    ${isActive ? `${colors.activeBorder} shadow-lg ${colors.activeGlow}` : `border-gray-200 ${colors.hover}`}
                `}
            >
                <div className={`p-1.5 ${colors.bg} ${colors.text} rounded-lg group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                    <span className="text-sm font-bold text-gray-900">
                        {count > 0 ? `${count} sélectionné${count > 1 ? 's' : ''}` : 'Tous'}
                    </span>
                </div>
            </button>

            {/* Tooltip */}
            {showTooltip && tooltip && createPortal(
                <div
                    className="fixed z-[9999] pointer-events-none animate-in fade-in slide-in-from-top-1 duration-200"
                    style={{
                        top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 8 : 0,
                        left: buttonRef.current ? buttonRef.current.getBoundingClientRect().left + (buttonRef.current.offsetWidth / 2) : 0,
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl max-w-xs relative">
                        <div className="font-semibold mb-1">{label}</div>
                        <div className="text-gray-300">{tooltip}</div>
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
