// src/components/organisms/FilterDrawer/FilterDrawer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter } from 'lucide-react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { TvaRateFilter } from '@/components/atoms/TvaRateFilter/TvaRateFilter';

interface FilterDrawerProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onCountChange: (count: number) => void;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
    isOpen,
    onClose,
    onCountChange
}) => {
    const tvaRates = useFiltersStore((state) => state.tvaRates);
    const setTvaRates = useFiltersStore((state) => state.setTvaRates);

    // État local pour les taux TVA (avant application)
    const [localTvaRates, setLocalTvaRates] = useState<number[]>(tvaRates);

    // Sync avec le store quand le drawer s'ouvre
    useEffect(() => {
        if (isOpen) {
            setLocalTvaRates(tvaRates);
        }
    }, [isOpen, tvaRates]);

    // Calculer s'il y a des changements
    const hasChanges = () => {
        if (localTvaRates.length !== tvaRates.length) return true;
        return !localTvaRates.every(rate => tvaRates.includes(rate));
    };

    const changesCount = hasChanges() ? 1 : 0;

    // Notifier le parent du nombre de changements
    useEffect(() => {
        onCountChange(changesCount);
    }, [changesCount, onCountChange]);

    const handleApply = () => {
        console.log('🎯 [FilterDrawer] Applying TVA rates:', localTvaRates);
        setTvaRates(localTvaRates);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={onClose}
            >
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <Filter className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Filtres
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-600">
                                    <span className="font-medium text-indigo-600">{localTvaRates.length}</span> taux sélectionné{localTvaRates.length > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="h-[calc(100%-140px)] overflow-y-auto px-6 py-4">
                        <div className="space-y-6">
                            {/* Section TVA */}
                            <TvaRateFilter
                                selectedRates={localTvaRates}
                                onChange={setLocalTvaRates}
                            />

                            {/* 🔮 Espace pour futurs filtres */}
                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-400 italic">
                                    D'autres filtres seront ajoutés ici prochainement...
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                        <button
                            onClick={handleApply}
                            disabled={!hasChanges()}
                            className={`w-full py-3 rounded-lg font-medium transition-colors ${hasChanges()
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Appliquer {hasChanges() && '(1 changement)'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
