// src/components/organisms/FilterPanel/CategoriesFilterPanel.tsx
'use client';

import React from 'react';
import { Tag, Loader2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { useCategoryFilter } from './hooks/useCategoryFilter';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-components
import { FilterSearchInput } from './components/shared/FilterSearchInput';
import { PinnedSelectionList } from './components/shared/PinnedSelectionList';

interface CategoriesFilterPanelProps { onClose?: () => void; }

export const CategoriesFilterPanel: React.FC<CategoriesFilterPanelProps> = ({ onClose }) => {
    const {
        searchQuery, setSearchQuery,
        results, isLoading, selectedMap,
        handleToggle, handleRemoveSelection, handleApply, handleClearAll,
        getCategoryKey
    } = useCategoryFilter(onClose);

    const isUniverse = (type: string) => type === 'bcb_segment_l0';
    const unselectedResults = results.filter(cat => !selectedMap.has(getCategoryKey(cat.category_type, cat.category_name)));
    const selectedItems = Array.from(selectedMap.values()).map(item => ({
        id: getCategoryKey(item.type, item.name),
        name: item.name
    }));
    const hasSelection = selectedMap.size > 0;
    const hasResults = unselectedResults.length > 0;

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header */}
            <div className="bg-white px-6 pt-6 pb-2 z-30 border-b border-gray-50 shadow-sm shrink-0">
                <FilterSearchInput
                    value={searchQuery} onChange={setSearchQuery}
                    placeholder="Rechercher une catégorie..."
                    focusColor="red"
                />
                {/* Quick Actions (Clear All) */}
                {hasSelection && (
                    <div className="flex items-center justify-between pt-1 pb-2">
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">{selectedMap.size} sélectionné(s)</span>
                        <button onClick={handleClearAll} className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors">Tout effacer</button>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                <PinnedSelectionList
                    items={selectedItems}
                    onRemove={handleRemoveSelection}
                    icon={Tag}
                    colorTheme="red"
                />

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 animate-pulse">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <span className="text-sm font-medium">Chargement...</span>
                    </div>
                )}

                {!isLoading && !hasResults && !hasSelection && (
                    <div className="text-center py-12 text-gray-400">
                        <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Aucun résultat trouvé</p>
                    </div>
                )}

                {/* Results */}
                {hasResults && <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{searchQuery ? `Résultats` : `Suggestions`}</h3>}
                <AnimatePresence mode="popLayout">
                    {unselectedResults.map((cat) => (
                        <motion.div
                            key={getCategoryKey(cat.category_type, cat.category_name)}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => handleToggle(cat)}
                            className="group relative p-4 rounded-xl border-2 bg-white border-gray-100 hover:border-red-200 hover:bg-gray-50 transition-all cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-red-500">
                                        <Tag className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold truncate text-gray-700">{cat.category_name}</h4>
                                        <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                                                {isUniverse(cat.category_type) ? 'Univers' : 'Catégorie'}
                                            </span>
                                            {cat.product_count} produits
                                        </p>
                                    </div>
                                </div>
                                <div className="w-6 h-6 rounded-full border-2 border-gray-200 group-hover:border-red-300 transition-all" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] shrink-0">
                <Button variant="primary" fullWidth size="lg" onClick={handleApply} className="shadow-xl rounded-xl h-12 bg-red-600 hover:bg-red-700 shadow-red-500/20">
                    Appliquer ({selectedMap.size})
                </Button>
            </div>
        </div>
    );
};
