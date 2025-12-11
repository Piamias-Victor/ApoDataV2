// src/components/molecules/Modal/LoadFilterModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FolderOpen } from 'lucide-react';
import { useFilterStore } from '@/stores/useFilterStore';
import { useSavedFilters } from './hooks/useSavedFilters';
import { SavedFilterCard } from './components/SavedFilterCard';

interface LoadFilterModalProps {
    onClose: () => void;
}

export const LoadFilterModal: React.FC<LoadFilterModalProps> = ({ onClose }) => {
    const loadFilterState = useFilterStore(state => state.loadFilterState);
    const { filters, isLoading, error, deleteFilter } = useSavedFilters();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleLoad = (filter: any) => {
        loadFilterState(filter.filter_data);
        onClose();
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Charger un filtre</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-500">Chargement...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                            {error}
                        </div>
                    ) : filters.length === 0 ? (
                        <div className="text-center py-12">
                            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="font-medium text-gray-500">Aucun filtre sauvegardé</p>
                            <p className="text-sm text-gray-400 mt-1">Créez votre premier filtre en cliquant sur &quot;Sauvegarder&quot;</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filters.map((filter) => (
                                <SavedFilterCard
                                    key={filter.id}
                                    filter={filter}
                                    onLoad={handleLoad}
                                    onDelete={deleteFilter}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
