// src/components/molecules/Modal/SaveFilterModal.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Package, TestTube, Folder, Ban } from 'lucide-react';
import { useFilterStore } from '@/stores/useFilterStore';

interface SaveFilterModalProps {
    onClose: () => void;
}

export const SaveFilterModal: React.FC<SaveFilterModalProps> = ({ onClose }) => {
    const getFilterState = useFilterStore(state => state.getFilterState);
    const filterState = useMemo(() => getFilterState(), [getFilterState]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const filterCounts = {
        products: filterState.products.length,
        laboratories: filterState.laboratories.length,
        categories: filterState.categories.length,
        pharmacies: filterState.pharmacies.length,
        excludedProducts: filterState.excludedProducts.length,
        excludedLaboratories: filterState.excludedLaboratories.length,
        excludedCategories: filterState.excludedCategories.length,
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Le nom est requis');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const response = await fetch('/api/filters/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                    filterData: filterState
                })
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la sauvegarde');
            }

            onClose();
        } catch (err) {
            setError('Erreur lors de la sauvegarde du filtre');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                            <Save className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Sauvegarder le filtre</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nom du filtre *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Produits Viatris Q4 2024"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                            autoFocus
                        />
                    </div>

                    {/* Description (optional) */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description (optionnel)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ajoutez une description..."
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors resize-none"
                        />
                    </div>

                    {/* Filter Recap */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">Récapitulatif du filtre</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {filterCounts.products > 0 && (
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-green-600" />
                                    <span className="text-gray-700">{filterCounts.products} produit(s)</span>
                                </div>
                            )}
                            {filterCounts.laboratories > 0 && (
                                <div className="flex items-center gap-2">
                                    <TestTube className="w-4 h-4 text-purple-600" />
                                    <span className="text-gray-700">{filterCounts.laboratories} labo(s)</span>
                                </div>
                            )}
                            {filterCounts.categories > 0 && (
                                <div className="flex items-center gap-2">
                                    <Folder className="w-4 h-4 text-red-600" />
                                    <span className="text-gray-700">{filterCounts.categories} catégorie(s)</span>
                                </div>
                            )}
                            {filterCounts.excludedProducts > 0 && (
                                <div className="flex items-center gap-2">
                                    <Ban className="w-4 h-4 text-gray-600" />
                                    <span className="text-gray-700">{filterCounts.excludedProducts} exclu(s)</span>
                                </div>
                            )}
                        </div>
                        {Object.values(filterCounts).every(c => c === 0) && (
                            <p className="text-sm text-gray-500 italic">Aucun filtre actif</p>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
