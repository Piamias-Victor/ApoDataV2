import React from 'react';
import { FilterSearchInput } from '../shared/FilterSearchInput';

interface ExcludedPharmacyHeaderProps {
    currentSearch: string;
    onSearchChange: (val: string) => void;
    selectionCount: number;
    onClearAll: () => void;
}

export const ExcludedPharmacyHeader: React.FC<ExcludedPharmacyHeaderProps> = ({
    currentSearch, onSearchChange, selectionCount, onClearAll
}) => {
    return (
        <div className="bg-white px-6 pt-6 pb-2 z-30 border-b border-gray-50 shadow-sm shrink-0">
            <FilterSearchInput
                value={currentSearch}
                onChange={onSearchChange}
                placeholder="Rechercher une pharmacie..."
                focusColor="gray"
            />
            {selectionCount > 0 && (
                <div className="flex items-center justify-between pt-1 pb-2">
                    <span className="text-xs font-bold text-gray-800 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                        {selectionCount} sélectionnée(s)
                    </span>
                    <button onClick={onClearAll} className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors">
                        Tout effacer
                    </button>
                </div>
            )}
        </div>
    );
};
