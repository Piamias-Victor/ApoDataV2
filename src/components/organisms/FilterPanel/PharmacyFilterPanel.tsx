// src/components/organisms/FilterPanel/PharmacyFilterPanel.tsx
'use client';

import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { usePharmacyFilter } from './hooks/usePharmacyFilter';
import { ClusterTabContent } from './components/ClusterTabContent';
import { PharmacySearchTabContent } from './components/pharmacy/PharmacySearchTabContent';
import { PharmacyList } from './components/PharmacyList';
import { FilterTabs } from './components/shared/FilterTabs';

interface PharmacyFilterPanelProps { onClose?: () => void; }

export const PharmacyFilterPanel: React.FC<PharmacyFilterPanelProps> = ({ onClose }) => {
    const {
        activeTab, setActiveTab, searchQuery, setSearchQuery,
        selectedRegions, setSelectedRegions, caRange, setCaRange,
        pharmacies, isLoading, selectedMap,
        handleToggle, handleBatchAction, handleApply
    } = usePharmacyFilter(onClose);

    // const unselectedPharmacies = pharmacies.filter(p => !selectedMap.has(p.id)); -- Allow already selected to show so they can be deselected
    const displayPharmacies = pharmacies;

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <div className="bg-white px-6 pt-6 pb-2 z-30 border-b border-gray-50 shadow-sm shrink-0">
                <FilterTabs
                    activeTab={activeTab} onTabChange={setActiveTab}
                    tabs={[
                        { id: 'search', label: 'Recherche', icon: Search },
                        { id: 'cluster', label: 'Cluster', icon: SlidersHorizontal }
                    ]}
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {activeTab === 'search' ? (
                    <PharmacySearchTabContent
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        results={pharmacies}
                        isLoading={isLoading}
                        selectedMap={selectedMap}
                        onToggle={handleToggle}
                        onBatchAction={handleBatchAction}
                    />
                ) : (
                    <div className="space-y-6">
                        <ClusterTabContent
                            selectedRegions={selectedRegions} caRange={caRange}
                            onToggleRegion={(r) => setSelectedRegions(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r])}
                            onCaRangeChange={setCaRange}
                        />
                        <div className="px-6 pb-6 border-t border-gray-100 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    {pharmacies.length} Résultats
                                </span>
                                <div className="flex gap-3">
                                    <button onClick={() => handleBatchAction('all')} className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline">
                                        Tout sélectionner
                                    </button>
                                    {selectedMap.size > 0 && (
                                        <button onClick={() => handleBatchAction('none')} className="text-xs font-semibold text-gray-400 hover:text-gray-600 hover:underline">
                                            Réinitialiser
                                        </button>
                                    )}
                                </div>
                            </div>
                            <PharmacyList
                                pharmacies={displayPharmacies}
                                isLoading={isLoading}
                                selectedMap={selectedMap}
                                onToggle={handleToggle}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] shrink-0">
                <Button variant="primary" fullWidth size="lg" onClick={handleApply} className="shadow-xl shadow-orange-500/20 rounded-xl h-12 !bg-none !bg-orange-600 hover:!bg-orange-700">
                    Appliquer ({selectedMap.size})
                </Button>
            </div>
        </div>
    );
};
