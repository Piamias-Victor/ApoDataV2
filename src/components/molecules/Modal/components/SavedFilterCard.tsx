// src/components/molecules/Modal/components/SavedFilterCard.tsx
import React from 'react';
import { Package, TestTube, Folder, Calendar, Trash2 } from 'lucide-react';
import { SavedFilter } from '../hooks/useSavedFilters';


interface SavedFilterCardProps {
    filter: SavedFilter;
    onLoad: (filter: SavedFilter) => void;
    onDelete: (id: number) => void;
}

/**
 * Card component displaying a saved filter with load/delete actions
 */
export const SavedFilterCard: React.FC<SavedFilterCardProps> = ({ filter, onLoad, onDelete }) => {
    const counts = {
        products: filter.filter_data.products?.length || 0,
        laboratories: filter.filter_data.laboratories?.length || 0,
        categories: filter.filter_data.categories?.length || 0,
    };

    const date = new Date(filter.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    return (
        <div className="group bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-cyan-50 rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-all">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1 truncate">
                        {filter.name}
                    </h3>
                    {filter.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                            {filter.description}
                        </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{date}</span>
                        </div>
                        {counts.products > 0 && (
                            <div className="flex items-center gap-1">
                                <Package className="w-3 h-3 text-green-600" />
                                <span>{counts.products}</span>
                            </div>
                        )}
                        {counts.laboratories > 0 && (
                            <div className="flex items-center gap-1">
                                <TestTube className="w-3 h-3 text-purple-600" />
                                <span>{counts.laboratories}</span>
                            </div>
                        )}
                        {counts.categories > 0 && (
                            <div className="flex items-center gap-1">
                                <Folder className="w-3 h-3 text-red-600" />
                                <span>{counts.categories}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={() => onLoad(filter)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold rounded-lg transition-all shadow-md"
                    >
                        Charger
                    </button>
                    <button
                        onClick={() => onDelete(filter.id)}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
