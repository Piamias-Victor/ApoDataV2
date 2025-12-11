import React from 'react';
import { Building2 } from 'lucide-react';
import { FilterSearchInput } from '../shared/FilterSearchInput';
import { PinnedSelectionList } from '../shared/PinnedSelectionList';
import { PharmacyList } from '../PharmacyList';
// import { Pharmacy } from '../../hooks/usePharmacyFilter'; // Assuming type exists or is compatible

interface PharmacySearchTabContentProps {
    searchQuery: string;
    onSearchChange: (val: string) => void;
    results: any[]; // Using any to avoid type hassle if not exported, but should be Pharmacy[]
    isLoading: boolean;
    selectedMap: Map<string, any>;
    onToggle: (pharmacy: any) => void;
    onBatchAction: (action: 'all' | 'none') => void;
}

export const PharmacySearchTabContent: React.FC<PharmacySearchTabContentProps> = ({
    searchQuery, onSearchChange, results, isLoading, selectedMap,
    onToggle, onBatchAction
}) => {
    // Use results directly
    // const unselectedPharmacies = results.filter(p => !selectedMap.has(p.id));
    const selectedItems = Array.from(selectedMap.values());
    const hasSelection = selectedMap.size > 0;

    return (
        <>
            <div className="sticky top-0 p-6 bg-white/95 backdrop-blur z-20 border-b border-gray-100">
                <FilterSearchInput
                    value={searchQuery}
                    onChange={onSearchChange}
                    placeholder="Rechercher (Nom, ID, Ville)..."
                    focusColor="orange"
                />
            </div>

            <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {results.length} Résultats
                </span>
                <div className="flex gap-3">
                    <button onClick={() => onBatchAction('all')} className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline">
                        Tout sélectionner
                    </button>
                    {hasSelection && (
                        <button onClick={() => onBatchAction('none')} className="text-xs font-semibold text-gray-400 hover:text-gray-600 hover:underline">
                            Réinitialiser
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-4">
                {searchQuery ? (
                    <>
                        <PharmacyList
                            pharmacies={results}
                            isLoading={isLoading}
                            selectedMap={selectedMap}
                            onToggle={onToggle}
                        />
                        {hasSelection && (
                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Sélection en cours ({selectedItems.length})
                                </h3>
                                <PinnedSelectionList
                                    items={selectedItems}
                                    onRemove={(id) => onToggle({ id, name: '' })}
                                    icon={Building2}
                                    colorTheme="orange"
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <PinnedSelectionList
                            items={selectedItems}
                            onRemove={(id) => onToggle({ id, name: '' })}
                            icon={Building2}
                            colorTheme="orange"
                        />
                        <PharmacyList
                            pharmacies={results}
                            isLoading={isLoading}
                            selectedMap={selectedMap}
                            onToggle={onToggle}
                        />
                    </>
                )}
            </div>
        </>
    );
};
