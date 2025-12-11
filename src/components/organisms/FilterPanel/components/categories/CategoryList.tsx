import React from 'react';
import { Folder, Package, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CategoryResult } from '../../hooks/useCategoryFilter';
import { SelectedCategory } from '@/types/filters';
import { FilterLoadingState } from '../shared/FilterLoadingState';

interface CategoryListProps {
    items: CategoryResult[];
    isLoading: boolean;
    hasSelection: boolean;
    searchQuery: string;
    selectedMap: Map<string, SelectedCategory>;
    onToggle: (cat: CategoryResult) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
    items, isLoading, hasSelection, searchQuery, selectedMap, onToggle
}) => {
    if (isLoading) {
        return <FilterLoadingState message="Chargement des catégories..." color="red" />;
    }

    const hasResults = items.length > 0;

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
                {items.map((cat) => {
                    const categoryKey = `${cat.category_type}:${cat.category_name}`;
                    const isSelected = selectedMap.has(categoryKey);
                    return (
                        <motion.div
                            key={`${cat.category_type}:${cat.category_name}`}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => onToggle(cat)}
                            className={`group relative p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected
                                ? 'bg-red-50 border-red-200'
                                : 'bg-white border-gray-100 hover:border-red-200 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-red-500'
                                        }`}>
                                        <Folder className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-red-900' : 'text-gray-700'}`}>
                                            {cat.category_name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                {cat.category_type.replace('bcb_', '')}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                                <Package className="w-3 h-3" />
                                                {cat.product_count}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                    ? 'border-red-500 bg-red-500 text-white'
                                    : 'border-gray-200 group-hover:border-red-300'
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
