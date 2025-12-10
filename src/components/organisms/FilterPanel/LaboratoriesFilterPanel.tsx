// src/components/organisms/FilterPanel/LaboratoriesFilterPanel.tsx
'use client';

import React from 'react';
import { Search, TestTube, Tag, Package, Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { useLaboratoryFilter, Laboratory } from './hooks/useLaboratoryFilter';
import { motion, AnimatePresence } from 'framer-motion';

interface LaboratoriesFilterPanelProps {
    onClose?: () => void;
}

export const LaboratoriesFilterPanel: React.FC<LaboratoriesFilterPanelProps> = ({ onClose }) => {
    const {
        searchQuery, setSearchQuery,
        labOrBrandMode, setLabOrBrandMode,
        results,
        isLoading,
        selectedMap,
        handleToggle,
        handleRemoveSelection,
        handleApply,
        handleClearAll
    } = useLaboratoryFilter(onClose);

    // Filter out selected items from the main results list to avoid duplication
    // We will show selected items in a pinned section at the top
    const unselectedResults = results.filter(lab => !selectedMap.has(lab.laboratory_name));
    const selectedItems = Array.from(selectedMap.values());
    const hasSelection = selectedMap.size > 0;
    const hasResults = unselectedResults.length > 0;

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header / Tabs */}
            <div className="bg-white px-6 pt-6 pb-2 z-30 border-b border-gray-50 shadow-sm shrink-0">
                {/* Styled Tabs matching Pharmacy Filter */}
                <div className="flex p-1 bg-gray-100/80 rounded-xl relative mb-4">
                    <motion.div
                        className="absolute inset-y-1 bg-white rounded-lg shadow-sm"
                        initial={false}
                        animate={{ left: labOrBrandMode === 'laboratory' ? '4px' : '50%' }}
                        style={{ width: 'calc(50% - 6px)' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    <button
                        onClick={() => setLabOrBrandMode('laboratory')}
                        className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${labOrBrandMode === 'laboratory' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <TestTube className="w-4 h-4" /> Laboratoire
                    </button>
                    <button
                        onClick={() => setLabOrBrandMode('brand')}
                        className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${labOrBrandMode === 'brand' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Tag className="w-4 h-4" /> Marque
                    </button>
                </div>

                {/* Search Input without default outline */}
                <div className="relative group mb-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <input
                        type="text"
                        placeholder={labOrBrandMode === 'laboratory' ? "Rechercher un laboratoire..." : "Rechercher une marque..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 hover:bg-white focus:bg-white border-2 border-transparent focus:border-purple-500 rounded-xl py-3 pl-10 pr-4 outline-none focus:outline-none focus:ring-0 transition-all font-medium text-sm text-gray-800 placeholder:text-gray-400"
                        autoFocus
                    />
                </div>

                {/* Selected Count (Quick View) */}
                {hasSelection && (
                    <div className="flex items-center justify-between pt-1 pb-2">
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                            {selectedMap.size} sélectionné(s)
                        </span>
                        <button onClick={handleClearAll} className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors">
                            Tout effacer
                        </button>
                    </div>
                )}
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">

                {/* Pinned Selected Items Section */}
                {hasSelection && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Check className="w-3 h-3 text-purple-500" />
                            Déjà sélectionné(s)
                        </h3>
                        <AnimatePresence mode="popLayout">
                            {selectedItems.map((sel) => (
                                <motion.div
                                    key={sel.name}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="group relative p-3 rounded-lg border border-purple-200 bg-purple-50 flex items-center justify-between shadow-sm"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-md bg-white text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                                            {labOrBrandMode === 'laboratory' ? <TestTube className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                                        </div>
                                        <span className="text-sm font-bold text-purple-900 truncate">{sel.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveSelection(sel.name)}
                                        className="p-1.5 hover:bg-white text-purple-400 hover:text-red-500 rounded-md transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div className="border-b border-gray-100 mt-4 mb-2" />
                    </div>
                )}


                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 animate-pulse">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <span className="text-sm font-medium">Chargement...</span>
                    </div>
                )}

                {!isLoading && !hasResults && !hasSelection && (
                    <div className="text-center py-12 text-gray-400">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Aucun résultat trouvé{searchQuery ? ` pour "${searchQuery}"` : ''}</p>
                    </div>
                )}

                {/* Results List */}
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {searchQuery ? `Résultats de recherche` : `Suggestions`}
                </h3>
                <AnimatePresence mode="popLayout">
                    {unselectedResults.map((lab) => (
                        <motion.div
                            key={lab.laboratory_name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            layout
                            onClick={() => handleToggle(lab)}
                            className="group relative p-4 rounded-xl border-2 bg-white border-gray-100 hover:border-purple-200 hover:bg-gray-50 transition-all cursor-pointer select-none"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-purple-500">
                                        {labOrBrandMode === 'laboratory' ? <TestTube className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold truncate text-gray-700">
                                            {lab.laboratory_name}
                                        </h4>
                                        <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                            <Package className="w-3 h-3" />
                                            {lab.product_count} produits référencés
                                        </p>
                                    </div>
                                </div>

                                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all border-gray-200 bg-transparent group-hover:border-purple-300">
                                    {/* Empty circle for unselected items */}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] z-30 shrink-0">
                <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={handleApply}
                    className="shadow-xl rounded-xl h-12 text-base font-bold bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
                >
                    Appliquer ({selectedMap.size})
                </Button>
            </div>
        </div>
    );
};
