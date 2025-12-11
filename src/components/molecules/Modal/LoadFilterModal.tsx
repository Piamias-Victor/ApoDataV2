// src/components/molecules/Modal/LoadFilterModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FolderOpen, Trash2, Package, TestTube, Folder, Calendar } from 'lucide-react';
import { useFilterStore } from '@/stores/useFilterStore';
import { FilterState } from '@/types/filters';

interface SavedFilter {
    id: number;
    name: string;
    description: string | null;
    filter_data: any;
    created_at: string;
}

interface LoadFilterModalProps {
    onClose: () => void;
}

export const LoadFilterModal: React.FC<LoadFilterModalProps> = ({ onClose }) => {
    const loadFilterState = useFilterStore(state => state.loadFilterState);
    const [filters, setFilters] = useState<SavedFilter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchFilters();
        return () => setMounted(false);
    }, []);

    const fetchFilters = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/filters/list');
            if (!response.ok) throw new Error('Erreur de chargement');
            const data = await response.json();
            setFilters(data.filters || []);
        } catch (err) {
            setError('Erreur lors du chargement des filtres');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoad = (filter: SavedFilter) => {
        loadFilterState(filter.filter_data);
        onClose();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce filtre ?')) return;

        try {
            const response = await fetch(`/api/filters/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Erreur de suppression');
            await fetchFilters(); // Refresh list
        } catch (err) {
            alert('Erreur lors de la suppression');
            console.error(err);
        }
    };

    const getFilterCounts = (data: FilterState) => ({
        products: data.products?.length || 0,
        laboratories: data.laboratories?.length || 0,
        categories: data.categories?.length || 0,
    });

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
                            <p className="text-sm text-gray-400 mt-1">Créez votre premier filtre en cliquant sur "Sauvegarder"</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filters.map((filter) => {
                                const counts = getFilterCounts(filter.filter_data);
                                const date = new Date(filter.created_at).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                });

                                return (
                                    <div
                                        key={filter.id}
                                        className="group bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-cyan-50 rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-all"
                                    >
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
                                                    onClick={() => handleLoad(filter)}
                                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold rounded-lg transition-all shadow-md"
                                                >
                                                    Charger
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(filter.id)}
                                                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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
