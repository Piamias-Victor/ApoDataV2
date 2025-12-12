import React from 'react';
import { Building2, Package, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SelectedPharmacy } from '@/types/filters';
import { FilterLoadingState } from '../shared/FilterLoadingState';

interface ExcludedPharmacyListProps {
    items: SelectedPharmacy[];
    isLoading: boolean;
    hasSelection: boolean;
    searchQuery: string;
    selectedMap: Map<string, SelectedPharmacy>;
    onToggle: (pharmacy: SelectedPharmacy) => void;
}

export const ExcludedPharmacyList: React.FC<ExcludedPharmacyListProps> = ({
    items, isLoading, hasSelection, searchQuery, selectedMap, onToggle
}) => {
    const hasResults = items.length > 0;

    if (isLoading) {
        return <FilterLoadingState message="Chargement des pharmacies..." color="gray" />;
    }

    return (
        <div className="space-y-4">
            {!isLoading && !hasResults && !hasSelection && (
                <div className="text-center py-12 text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Aucun résultat trouvé</p>
                </div>
            )}

            {hasResults && (
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {searchQuery ? `Résultats` : `Suggestions`}
                </h3>
            )}

            <AnimatePresence mode="popLayout">
                {items.map((pharmacy) => {
                    const isSelected = selectedMap.has(pharmacy.id);
                    return (
                        <motion.div
                            key={pharmacy.id} layout
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            onClick={() => onToggle(pharmacy)}
                            className={`group relative p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected
                                ? 'bg-gray-50 border-gray-400'
                                : 'bg-white border-gray-100 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-gray-800'
                                        }`}>
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {pharmacy.name}
                                        </h4>
                                        <p className="text-xs text-gray-400 font-medium truncate">
                                            {pharmacy.address || pharmacy.id}
                                        </p>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                    ? 'border-gray-800 bg-gray-800 text-white'
                                    : 'border-gray-200 group-hover:border-gray-400'
                                    }`}>
                                    {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
