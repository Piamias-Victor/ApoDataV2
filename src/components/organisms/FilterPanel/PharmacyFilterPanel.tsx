// src/components/organisms/FilterPanel/PharmacyFilterPanel.tsx
'use client';

import React from 'react';
import { Search, SlidersHorizontal, Building2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { usePharmacyFilter } from './hooks/usePharmacyFilter';

// Components
import { PharmacyList } from './components/PharmacyList';
import { ClusterTabContent } from './components/ClusterTabContent';
import { FilterTabs } from './components/shared/FilterTabs';
import { FilterSearchInput } from './components/shared/FilterSearchInput';
import { PinnedSelectionList } from './components/shared/PinnedSelectionList';

interface PharmacyFilterPanelProps { onClose?: () => void; }

export const PharmacyFilterPanel: React.FC<PharmacyFilterPanelProps> = ({ onClose }) => {
    const {
        activeTab, setActiveTab, searchQuery, setSearchQuery,
        selectedRegions, setSelectedRegions, caRange, setCaRange,
        pharmacies, isLoading, selectedMap,
        handleToggle, handleBatchAction, handleApply
    } = usePharmacyFilter(onClose);

    const unselectedPharmacies = pharmacies.filter(p => !selectedMap.has(p.id));
    const selectedItems = Array.from(selectedMap.values());
    const hasSelection = selectedMap.size > 0;

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header */}
            <div className="bg-white px-6 pt-6 pb-2 z-30 border-b border-gray-50 shadow-sm shrink-0">
                <FilterTabs
                    activeTab={activeTab} onTabChange={setActiveTab}
                    tabs={[
                        { id: 'search', label: 'Recherche', icon: Search },
                        { id: 'cluster', label: 'Cluster', icon: SlidersHorizontal }
                    ]}
                />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {activeTab === 'search' && (
                    <div className="sticky top-0 p-6 bg-white/95 backdrop-blur z-20 border-b border-gray-100">
                        <FilterSearchInput
                            value={searchQuery} onChange={setSearchQuery}
                            placeholder="Rechercher (Nom, ID, Ville)..."
                            focusColor="blue"
                        />
                    </div>
                )}

                {activeTab === 'cluster' ? (
                    <ClusterTabContent
                        selectedRegions={selectedRegions} caRange={caRange}
                        onToggleRegion={(r) => setSelectedRegions(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r])}
                        onCaRangeChange={setCaRange}
                    />
                ) : (
                    <>
                        <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-100">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{pharmacies.length} Résultats</span>
                            <div className="flex gap-3">
                                <button onClick={() => handleBatchAction('all')} className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">Tout sélectionner</button>
                                {hasSelection && <button onClick={() => handleBatchAction('none')} className="text-xs font-semibold text-gray-400 hover:text-gray-600 hover:underline">Réinitialiser</button>}
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <PinnedSelectionList
                                items={selectedItems}
                                onRemove={(id) => handleToggle({ id, name: '' } as any)} // Hack: handleToggle only needs ID for removal
                                icon={Building2} colorTheme="blue"
                            />
                            {hasSelection && searchQuery && <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Résultats</h3>}
                            <PharmacyList
                                pharmacies={unselectedPharmacies} isLoading={isLoading}
                                selectedMap={selectedMap} onToggle={handleToggle}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] shrink-0">
                <Button variant="primary" fullWidth size="lg" onClick={handleApply} className="shadow-xl shadow-blue-500/20 rounded-xl h-12 bg-blue-600 hover:bg-blue-700">
                    Appliquer ({selectedMap.size})
                </Button>
            </div>
        </div>
    );
};
