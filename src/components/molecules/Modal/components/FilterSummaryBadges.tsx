// src/components/molecules/Modal/components/FilterSummaryBadges.tsx
import React from 'react';
import { Package, TestTube, Folder, Ban } from 'lucide-react';
import { FilterCounts } from '../hooks/useFilterSummary';

interface FilterSummaryBadgesProps {
    counts: FilterCounts;
}

/**
 * Displays a visual summary of active filters with icons and counts
 */
export const FilterSummaryBadges: React.FC<FilterSummaryBadgesProps> = ({ counts }) => {
    const hasActiveFilters = Object.values(counts).some(c => c > 0);

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Récapitulatif du filtre</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
                {counts.products > 0 && (
                    <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">{counts.products} produit(s)</span>
                    </div>
                )}
                {counts.laboratories > 0 && (
                    <div className="flex items-center gap-2">
                        <TestTube className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-700">{counts.laboratories} labo(s)</span>
                    </div>
                )}
                {counts.categories > 0 && (
                    <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-red-600" />
                        <span className="text-gray-700">{counts.categories} catégorie(s)</span>
                    </div>
                )}
                {counts.excludedProducts > 0 && (
                    <div className="flex items-center gap-2">
                        <Ban className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-700">{counts.excludedProducts} exclu(s)</span>
                    </div>
                )}
            </div>
            {!hasActiveFilters && (
                <p className="text-sm text-gray-500 italic">Aucun filtre actif</p>
            )}
        </div>
    );
};
