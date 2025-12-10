// src/components/organisms/FilterPanel/PharmacyFilterPanel.tsx
'use client';

import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';
import { motion } from 'framer-motion';

// Components
import { PharmacyList } from './components/PharmacyList';
import { ClusterTabContent } from './components/ClusterTabContent';
// Hook
import { usePharmacyFilter } from './hooks/usePharmacyFilter';

interface PharmacyFilterPanelProps { onClose?: () => void; }

export const PharmacyFilterPanel: React.FC<PharmacyFilterPanelProps> = ({ onClose }) => {
    const {
        activeTab, setActiveTab, searchQuery, setSearchQuery,
        selectedRegions, setSelectedRegions, caRange, setCaRange,
        pharmacies, isLoading, selectedMap,
        handleToggle, handleBatchAction, handleApply
    } = usePharmacyFilter(onClose);

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Tabs */}
            <div className="bg-white px-6 pt-6 pb-2 z-30 border-b border-gray-50 shadow-sm shrink-0">
                <div className="flex p-1 bg-gray-100/80 rounded-xl relative">
                    <motion.div
                        className="absolute inset-y-1 bg-white rounded-lg shadow-sm"
                        initial={false}
                        animate={{ left: activeTab === 'search' ? '4px' : '50%' }}
                        style={{ width: 'calc(50% - 6px)' }}
                    />
                    <button onClick={() => setActiveTab('search')} className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'search' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Search className="w-4 h-4" /> Recherche
                    </button>
                    <button onClick={() => setActiveTab('cluster')} className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'cluster' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                        <SlidersHorizontal className="w-4 h-4" /> Cluster
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {activeTab === 'search' && (
                    <div className="sticky top-0 p-6 bg-white/95 backdrop-blur z-20 border-b border-gray-100">
                        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} iconLeft={<Search className="w-5 h-5 text-gray-500" />} className="bg-gray-50 focus:bg-white transition-all rounded-xl h-11" placeholder="Rechercher (Nom, ID, Ville)..." />
                    </div>
                )}
                {activeTab === 'cluster' && (
                    <ClusterTabContent
                        selectedRegions={selectedRegions} caRange={caRange}
                        onToggleRegion={(r) => setSelectedRegions(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r])}
                        onCaRangeChange={setCaRange}
                    />
                )}
                {/* Actions */}
                <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{pharmacies.length} Résultats</span>
                    <div className="flex gap-3">
                        <button onClick={() => handleBatchAction('all')} className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline">Tout sélectionner</button>
                        {selectedMap.size > 0 && <button onClick={() => handleBatchAction('none')} className="text-xs font-semibold text-gray-400 hover:text-gray-600 hover:underline">Réinitialiser</button>}
                    </div>
                </div>
                <PharmacyList
                    pharmacies={pharmacies}
                    isLoading={isLoading}
                    selectedMap={selectedMap}
                    onToggle={handleToggle}
                />
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] z-30 shrink-0">
                <Button variant="primary" fullWidth size="lg" onClick={handleApply} className="shadow-xl shadow-orange-500/20 rounded-xl h-12">
                    Appliquer ({selectedMap.size})
                </Button>
            </div>
        </div>
    );
};
