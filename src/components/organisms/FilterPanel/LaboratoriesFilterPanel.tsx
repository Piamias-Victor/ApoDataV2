// src/components/organisms/FilterPanel/LaboratoriesFilterPanel.tsx
'use client';

import React from 'react';
import { TestTube, Tag, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { useLaboratoryFilter } from './hooks/useLaboratoryFilter';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-components
import { FilterTabs } from './components/shared/FilterTabs';
import { FilterSearchInput } from './components/shared/FilterSearchInput';
import { PinnedSelectionList } from './components/shared/PinnedSelectionList';

interface LaboratoriesFilterPanelProps { onClose?: () => void; }

export const LaboratoriesFilterPanel: React.FC<LaboratoriesFilterPanelProps> = ({ onClose }) => {
    const {
        searchQuery, setSearchQuery, labOrBrandMode, setLabOrBrandMode,
        results, isLoading, selectedMap,
        handleToggle, handleRemoveSelection, handleApply, handleClearAll
    } = useLaboratoryFilter(onClose);

    const unselectedResults = results.filter(lab => !selectedMap.has(lab.laboratory_name));
    const selectedItems = Array.from(selectedMap.values());
    const hasSelection = selectedMap.size > 0;
    const hasResults = unselectedResults.length > 0;

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header */}
            <div className="bg-white px-6 pt-6 pb-2 z-30 border-b border-gray-50 shadow-sm shrink-0">
                <FilterTabs
                    activeTab={labOrBrandMode}
                    onTabChange={setLabOrBrandMode}
                    tabs={[
                        { id: 'laboratory', label: 'Laboratoire', icon: TestTube },
                        { id: 'brand', label: 'Marque', icon: Tag }
                    ]}
                />
                <FilterSearchInput
                    value={searchQuery} onChange={setSearchQuery}
                    placeholder={labOrBrandMode === 'laboratory' ? "Rechercher un laboratoire..." : "Rechercher une marque..."}
                    focusColor="purple"
                />
                {/* Quick Actions (Clear All) */}
                {hasSelection && (
                    <div className="flex items-center justify-between pt-1 pb-2">
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">{selectedMap.size} sélectionné(s)</span>
                        <button onClick={handleClearAll} className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors">Tout effacer</button>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                <PinnedSelectionList
                    items={selectedItems} onRemove={handleRemoveSelection} icon={labOrBrandMode === 'laboratory' ? TestTube : Tag} colorTheme="purple"
                />

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 animate-pulse">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <span className="text-sm font-medium">Chargement...</span>
                    </div>
                )}

                {!isLoading && !hasResults && !hasSelection && (
                    <div className="text-center py-12 text-gray-400"><Package className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm">Aucun résultat trouvé</p></div>
                )}

                {/* Results */}
                {hasResults && <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{searchQuery ? `Résultats` : `Suggestions`}</h3>}
                <AnimatePresence mode="popLayout">
                    {unselectedResults.map((lab) => (
                        <motion.div
                            key={lab.laboratory_name} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            onClick={() => handleToggle(lab)}
                            className="group relative p-4 rounded-xl border-2 bg-white border-gray-100 hover:border-purple-200 hover:bg-gray-50 transition-all cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-purple-500">
                                        {labOrBrandMode === 'laboratory' ? <TestTube className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold truncate text-gray-700">{lab.laboratory_name}</h4>
                                        <p className="text-xs text-gray-400 font-medium flex items-center gap-1"><Package className="w-3 h-3" />{lab.product_count} produits</p>
                                    </div>
                                </div>
                                <div className="w-6 h-6 rounded-full border-2 border-gray-200 group-hover:border-purple-300 transition-all" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] shrink-0">
                <Button variant="primary" fullWidth size="lg" onClick={handleApply} className="shadow-xl rounded-xl h-12 bg-purple-600 hover:bg-purple-700 shadow-purple-500/20">
                    Appliquer ({selectedMap.size})
                </Button>
            </div>
        </div>
    );
};
