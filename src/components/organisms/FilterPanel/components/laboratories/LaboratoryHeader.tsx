import React from 'react';
import { TestTube, Tag } from 'lucide-react';
import { FilterTabs } from '../shared/FilterTabs';
import { FilterSearchInput } from '../shared/FilterSearchInput';

interface LaboratoryHeaderProps {
    mode: 'laboratory' | 'brand';
    onModeChange: (mode: 'laboratory' | 'brand') => void;
    currentSearch: string;
    onSearchChange: (val: string) => void;
    selectionCount: number;
    onClearAll: () => void;
}

export const LaboratoryHeader: React.FC<LaboratoryHeaderProps> = ({
    mode, onModeChange, currentSearch, onSearchChange, selectionCount, onClearAll
}) => {
    return (
        <div className="bg-white px-6 pt-6 pb-2 z-30 border-b border-gray-50 shadow-sm shrink-0">
            <FilterTabs
                activeTab={mode}
                onTabChange={onModeChange as any}
                tabs={[
                    { id: 'laboratory', label: 'Laboratoire', icon: TestTube },
                    { id: 'brand', label: 'Marque', icon: Tag }
                ]}
            />
            <FilterSearchInput
                value={currentSearch} onChange={onSearchChange}
                placeholder={mode === 'laboratory' ? "Rechercher un laboratoire..." : "Rechercher une marque..."}
                focusColor="purple"
            />
            {selectionCount > 0 && (
                <div className="flex items-center justify-between pt-1 pb-2">
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
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
