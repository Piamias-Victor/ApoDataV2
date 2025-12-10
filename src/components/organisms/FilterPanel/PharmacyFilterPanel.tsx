// src/components/organisms/FilterPanel/PharmacyFilterPanel.tsx
'use client';

import React from 'react';
import { Search, SlidersHorizontal, Check, Building2, X, Plus } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { motion, AnimatePresence } from 'framer-motion';

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

    // Filter out selected items from the main results list
    const unselectedPharmacies = pharmacies.filter(p => !selectedMap.has(p.id));
    const selectedItems = Array.from(selectedMap.values());
    const hasSelection = selectedMap.size > 0;

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
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-50 hover:bg-white focus:bg-white border-2 border-transparent focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 outline-none focus:outline-none focus:ring-0 transition-all font-medium text-sm text-gray-800 placeholder:text-gray-400"
                                placeholder="Rechercher (Nom, ID, Ville)..."
                            />
                        </div>
                    </div>
                )}
                {activeTab === 'cluster' && (
                    <ClusterTabContent
                        selectedRegions={selectedRegions} caRange={caRange}
                        onToggleRegion={(r) => setSelectedRegions(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r])}
                        onCaRangeChange={setCaRange}
                    />
                )}

                {/* Actions Bar */}
                <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{pharmacies.length} Résultats</span>
                    <div className="flex gap-3">
                        {/* Batch actions work on the filtered list or all? Usually all visible. Let's keep it simple. */}
                        <button onClick={() => handleBatchAction('all')} className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">Tout sélectionner</button>
                        {selectedMap.size > 0 && <button onClick={() => handleBatchAction('none')} className="text-xs font-semibold text-gray-400 hover:text-gray-600 hover:underline">Réinitialiser</button>}
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Pinned Selected Items (Blue Theme) */}
                    {hasSelection && activeTab === 'search' && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Check className="w-3 h-3 text-blue-500" />
                                Déjà sélectionné(s)
                            </h3>
                            <AnimatePresence mode="popLayout">
                                {selectedItems.map((sel) => (
                                    <motion.div
                                        key={sel.id}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="group relative p-3 rounded-lg border border-blue-200 bg-blue-50 flex items-center justify-between shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 rounded-md bg-white text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold text-blue-900 truncate">{sel.name}</span>
                                        </div>
                                        {/* Since handleToggle requires a full Pharmacy object, and we only have SelectedPharmacy here (id, name),
                                            we need to find the full object or adapt toggle. 
                                            But wait, handleToggle takes a `Pharmacy` object.
                                            If we don't have the full object here (only ID/Name from store), we might have issues toggling it OFF if we need pass full object.
                                            However, handleToggle usually just needs the ID for removal. Let's check usePharmacyFilter.
                                            Actually, handleToggle uses `p.id` to add/remove. When removing, we just need the ID.
                                            But `handleToggle` type signature expects `Pharmacy`.
                                            Workaround: Construct a dummy Pharmacy object with the ID since removal only checks ID.
                                         */}
                                        <button
                                            onClick={() => handleToggle({ id: sel.id, name: sel.name } as any)}
                                            className="p-1.5 hover:bg-white text-blue-400 hover:text-red-500 rounded-md transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div className="border-b border-gray-100 mt-4 mb-2" />

                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                {searchQuery ? `Résultats de recherche` : `Pharmacies`}
                            </h3>
                        </div>
                    )}

                    {/* Unselected Items List */}
                    <PharmacyList
                        pharmacies={unselectedPharmacies}
                        isLoading={isLoading}
                        selectedMap={selectedMap}
                        onToggle={handleToggle}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] z-30 shrink-0">
                <Button variant="primary" fullWidth size="lg" onClick={handleApply} className="shadow-xl shadow-blue-500/20 rounded-xl h-12 bg-blue-600 hover:bg-blue-700">
                    Appliquer ({selectedMap.size})
                </Button>
            </div>
        </div>
    );
};
