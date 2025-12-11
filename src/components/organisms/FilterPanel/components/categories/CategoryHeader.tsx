import React from 'react';
import { FilterSearchInput } from '../shared/FilterSearchInput';

interface CategoryHeaderProps {
    currentSearch: string;
    onSearchChange: (val: string) => void;
    selectionCount: number;
    onClearAll: () => void;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
    currentSearch, onSearchChange, selectionCount, onClearAll
}) => {
    return (
        <div className="bg-white px-6 pt-6 pb-2 z-30 border-b border-gray-50 shadow-sm shrink-0">
            <FilterSearchInput
                value={currentSearch}
                onChange={onSearchChange}
                placeholder="Rechercher une catégorie..."
                focusColor="red"
            />
            {selectionCount > 0 && (
                <div className="flex items-center justify-between pt-1 pb-2">
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                        {selectionCount} sélectionné(s)
                    </span>
                    <button onClick={onClearAll} className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors">
                        Tout effacer
                    </button>
                </div>
            )}
        </div>
    );
};
