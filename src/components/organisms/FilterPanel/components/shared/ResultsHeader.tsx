// src/components/organisms/FilterPanel/components/shared/ResultsHeader.tsx
import React from 'react';

interface ResultsHeaderProps {
    resultsCount: number;
    isSearchMode: boolean;
    hasSelection: boolean;
    onSelectAll: () => void;
    onClearAll: () => void;
    accentColor?: 'green' | 'gray';
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({
    resultsCount,
    isSearchMode,
    hasSelection,
    onSelectAll,
    onClearAll,
    accentColor = 'green'
}) => {
    const selectAllColor = accentColor === 'gray'
        ? 'text-gray-700 hover:text-gray-900'
        : 'text-green-600 hover:text-green-700';

    return (
        <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {resultsCount} {isSearchMode ? 'Résultats' : 'Suggestions'}
            </span>
            <div className="flex gap-3">
                <button
                    onClick={onSelectAll}
                    className={`text-xs font-semibold ${selectAllColor} hover:underline`}
                >
                    Tout sélectionner
                </button>
                {hasSelection && (
                    <button
                        onClick={onClearAll}
                        className="text-xs font-semibold text-gray-400 hover:text-gray-600 hover:underline"
                    >
                        Tout effacer
                    </button>
                )}
            </div>
        </div>
    );
};
