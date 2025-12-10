// src/components/organisms/SaveFilterModal/SaveFilterModal.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Package, TestTube, Tag, Building, Ban } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Card } from '@/components/atoms/Card/Card';

interface SaveFilterModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (name: string) => Promise<void>;
  readonly isSaving: boolean;
  readonly productsCount: number;
  readonly laboratoriesCount: number;
  readonly categoriesCount: number;
  readonly pharmaciesCount: number;
  readonly exclusionsCount?: number; // 🔥 NOUVEAU
}

/**
 * SaveFilterModal - Modal pour sauvegarder la sélection actuelle - AVEC EXCLUSIONS
 * 
 * Features :
 * - Input nom du filtre
 * - Preview des sélections (produits, labos, catégories, pharmacies, exclusions)
 * - Validation : nom obligatoire + au moins une sélection
 * - Design Apple/Stripe : modal centré avec overlay
 */
export const SaveFilterModal: React.FC<SaveFilterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving,
  productsCount,
  laboratoriesCount,
  categoriesCount,
  pharmaciesCount,
  exclusionsCount = 0, // 🔥 NOUVEAU
}) => {
  const [filterName, setFilterName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const totalSelections = productsCount + laboratoriesCount + categoriesCount + pharmaciesCount;

  const handleSave = async () => {
    // Validation
    if (!filterName.trim()) {
      setError('Le nom du filtre est obligatoire');
      return;
    }

    if (filterName.length > 255) {
      setError('Le nom est trop long (max 255 caractères)');
      return;
    }

    if (totalSelections === 0) {
      setError('Aucune sélection à sauvegarder');
      return;
    }

    try {
      await onSave(filterName.trim());
      // Reset et fermer
      setFilterName('');
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    }
  };

  const handleClose = () => {
    setFilterName('');
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card variant="elevated" padding="lg" className="bg-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Save className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Sauvegarder la sélection
                    </h2>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isSaving}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Preview sélections */}
                <div className="mb-6 space-y-3">
                  <p className="text-sm text-gray-600">
                    Vous allez sauvegarder :
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Produits */}
                    <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <Package className="w-5 h-5 text-purple-600 mb-2" />
                      <span className="text-2xl font-bold text-purple-900">
                        {productsCount}
                      </span>
                      <span className="text-xs text-purple-700 mt-1">
                        Produit{productsCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Laboratoires */}
                    <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <TestTube className="w-5 h-5 text-green-600 mb-2" />
                      <span className="text-2xl font-bold text-green-900">
                        {laboratoriesCount}
                      </span>
                      <span className="text-xs text-green-700 mt-1">
                        Labo{laboratoriesCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Catégories */}
                    <div className="flex flex-col items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <Tag className="w-5 h-5 text-orange-600 mb-2" />
                      <span className="text-2xl font-bold text-orange-900">
                        {categoriesCount}
                      </span>
                      <span className="text-xs text-orange-700 mt-1">
                        Catégorie{categoriesCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Pharmacies */}
                    <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Building className="w-5 h-5 text-blue-600 mb-2" />
                      <span className="text-2xl font-bold text-blue-900">
                        {pharmaciesCount}
                      </span>
                      <span className="text-xs text-blue-700 mt-1">
                        Pharmacie{pharmaciesCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* 🔥 NOUVEAU - Exclusions (si présentes) */}
                  {exclusionsCount > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-center space-x-2">
                        <Ban className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium text-red-900">
                          {exclusionsCount} produit{exclusionsCount > 1 ? 's' : ''} exclu{exclusionsCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}

                  {totalSelections === 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        Aucune sélection active. Veuillez d'abord sélectionner des produits, laboratoires, catégories ou pharmacies.
                      </p>
                    </div>
                  )}
                </div>

                {/* Input nom */}
                <div className="mb-6">
                  <label
                    htmlFor="filter-name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nom du filtre *
                  </label>
                  <Input
                    type="text"
                    value={filterName}
                    onChange={(e) => {
                      setFilterName(e.target.value);
                      setError(null);
                    }}
                    placeholder="Ex: Antibiotiques hiver 2024"
                    disabled={isSaving}
                    className="w-full"
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-600">
                      {error}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    {filterName.length} / 255 caractères
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={handleClose}
                    disabled={isSaving}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSave}
                    disabled={isSaving || totalSelections === 0}
                    className="min-w-[120px]"
                  >
                    {isSaving ? (
                      <span className="flex items-center space-x-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Sauvegarde...</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <Save className="w-4 h-4" />
                        <span>Sauvegarder</span>
                      </span>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};