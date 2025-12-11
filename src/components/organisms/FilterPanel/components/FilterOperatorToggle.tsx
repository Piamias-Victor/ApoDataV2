// src/components/organisms/FilterPanel/components/FilterOperatorToggle.tsx
import React from 'react';

interface FilterOperatorToggleProps {
    value: 'AND' | 'OR';
    onChange: (value: 'AND' | 'OR') => void;
    filterName: string;
    selectedItems: string[]; // Array of selected item names
    count: number;
}

export const FilterOperatorToggle: React.FC<FilterOperatorToggleProps> = ({
    value,
    onChange,
    filterName,
    selectedItems,
    count
}) => {
    return (
        <div className="group">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-700">{filterName}</h3>
                <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                    {count} sélectionné{count > 1 ? 's' : ''}
                </span>
            </div>

            {/* Selected Items */}
            <div className="mb-3 flex flex-wrap gap-1.5">
                {selectedItems.slice(0, 5).map((item, idx) => (
                    <span
                        key={idx}
                        className="inline-block px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-lg border border-yellow-100"
                    >
                        {item}
                    </span>
                ))}
                {selectedItems.length > 5 && (
                    <span className="inline-block px-2.5 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded-lg border border-gray-100">
                        +{selectedItems.length - 5} autres
                    </span>
                )}
            </div>

            {/* Pill Toggles (like ReimbursementFilterSection) */}
            <div className="flex gap-2">
                <button
                    onClick={() => onChange('AND')}
                    className={`
                        flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
                        ${value === 'AND'
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/25'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }
                    `}
                >
                    ET
                </button>
                <button
                    onClick={() => onChange('OR')}
                    className={`
                        flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
                        ${value === 'OR'
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/25'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }
                    `}
                >
                    OU
                </button>
            </div>
        </div>
    );
};
