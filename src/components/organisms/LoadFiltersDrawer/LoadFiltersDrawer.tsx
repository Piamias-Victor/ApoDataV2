// src/components/organisms/LoadFiltersDrawer/LoadFiltersDrawer.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FolderOpen, 
  Package, 
  TestTube, 
  Tag, 
  Trash2, 
  Edit3,
  Check,
  AlertCircle,
  Layers, // 🔥 Pour groupes génériques
  Zap, // 🔥 Pour filtres prix/TVA
} from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Card } from '@/components/atoms/Card/Card';
import type { SavedFilter, ClassicSavedFilter, GenericSavedFilter } from '@/types/savedFilters';
import { FilterTypeBadge } from '@/components/atoms/FilterTypeBadge/FilterTypeBadge';

interface LoadFiltersDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly savedFilters: SavedFilter[];
  readonly onLoad: (id: string) => Promise<void>;
  readonly onRename: (id: string, newName: string) => Promise<void>;
  readonly onDelete: (id: string) => Promise<void>;
  readonly isLoading: boolean;
  readonly isLoadingFilter: boolean;
  readonly isDeletingFilter: boolean;
  readonly isRenamingFilter: boolean;
}

/**
 * LoadFiltersDrawer - Drawer pour charger/gérer les filtres sauvegardés
 * 
 * Features :
 * - Liste des filtres sauvegardés (classiques + génériques)
 * - Badge de type (Classique / Générique)
 * - Preview adaptée selon le type
 * - Actions : Charger / Renommer / Supprimer
 * - Renommage inline
 * - Empty state si aucun filtre
 */
export const LoadFiltersDrawer: React.FC<LoadFiltersDrawerProps> = ({
  isOpen,
  onClose,
  savedFilters,
  onLoad,
  onRename,
  onDelete,
  isLoading,
  isLoadingFilter,
  isDeletingFilter,
  isRenamingFilter,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleStartEdit = (filter: SavedFilter) => {
    setEditingId(filter.id);
    setEditingName(filter.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    
    try {
      await onRename(id, editingName.trim());
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      console.error('Error renaming filter:', error);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Error deleting filter:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // 🔥 Helper pour rendre le preview selon le type
  const renderFilterPreview = (filter: SavedFilter) => {
    if (filter.filter_type === 'classic') {
      const classicFilter = filter as ClassicSavedFilter;
      const productsCount = classicFilter.product_codes.length;
      const laboratoriesCount = classicFilter.laboratory_names.length;
      const categoriesCount = classicFilter.category_names.length;

      return (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
            <Package className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-purple-900">
                {productsCount}
              </p>
              <p className="text-xs text-purple-700 truncate">
                Produit{productsCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg border border-green-200">
            <TestTube className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-green-900">
                {laboratoriesCount}
              </p>
              <p className="text-xs text-green-700 truncate">
                Labo{laboratoriesCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
            <Tag className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-orange-900">
                {categoriesCount}
              </p>
              <p className="text-xs text-orange-700 truncate">
                Catégorie{categoriesCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      );
    } else {
      const genericFilter = filter as GenericSavedFilter;
      const groupsCount = genericFilter.generic_groups.length;
      const productsCount = genericFilter.generic_products.length;
      const laboratoriesCount = genericFilter.generic_laboratories.length;
      
      const hasPriceFilters = Object.values(genericFilter.price_filters).some(
        range => range.min !== null || range.max !== null
      );
      const hasTvaFilters = genericFilter.tva_rates.length > 0;
      const hasStatusFilter = genericFilter.generic_status !== 'BOTH';

      return (
        <>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="flex items-center space-x-2 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
              <Layers className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-indigo-900">
                  {groupsCount}
                </p>
                <p className="text-xs text-indigo-700 truncate">
                  Groupe{groupsCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
              <Package className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-purple-900">
                  {productsCount}
                </p>
                <p className="text-xs text-purple-700 truncate">
                  Produit{productsCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg border border-green-200">
              <TestTube className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-green-900">
                  {laboratoriesCount}
                </p>
                <p className="text-xs text-green-700 truncate">
                  Labo{laboratoriesCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Indicateur filtres additionnels */}
          {(hasPriceFilters || hasTvaFilters || hasStatusFilter) && (
            <div className="flex items-center space-x-2 p-2 bg-amber-50 rounded-lg border border-amber-200 mb-3">
              <Zap className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                {hasPriceFilters && 'Filtres prix'}
                {hasPriceFilters && (hasTvaFilters || hasStatusFilter) && ' • '}
                {hasTvaFilters && `TVA (${genericFilter.tva_rates.length})`}
                {hasTvaFilters && hasStatusFilter && ' • '}
                {hasStatusFilter && genericFilter.generic_status}
              </p>
            </div>
          )}
        </>
      );
    }
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
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FolderOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Mes filtres sauvegardés
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {savedFilters.length} filtre{savedFilters.length > 1 ? 's' : ''} disponible{savedFilters.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/80 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
                  />
                </div>
              ) : savedFilters.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <FolderOpen className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucun filtre sauvegardé
                  </h3>
                  <p className="text-gray-600 max-w-sm">
                    Commencez par sélectionner des produits, laboratoires ou catégories, puis cliquez sur "Sauvegarder" pour créer votre premier filtre.
                  </p>
                </div>
              ) : (
                // Liste des filtres
                <div className="space-y-4">
                  {savedFilters.map((filter) => {
                    const isEditing = editingId === filter.id;
                    const isDeleting = deletingId === filter.id;

                    return (
                      <Card
                        key={filter.id}
                        variant="elevated"
                        padding="lg"
                        className="hover:shadow-lg transition-shadow"
                      >
                        {/* Nom du filtre + Badge */}
                        {isEditing ? (
                          <div className="flex items-center space-x-2 mb-4">
                            <Input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1"
                              disabled={isRenamingFilter}
                            />
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleSaveEdit(filter.id)}
                              disabled={isRenamingFilter || !editingName.trim()}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={isRenamingFilter}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {filter.name}
                                </h3>
                                <FilterTypeBadge type={filter.filter_type} />
                              </div>
                              <p className="text-xs text-gray-500">
                                Modifié le {formatDate(filter.updated_at)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleStartEdit(filter)}
                                disabled={isDeletingFilter || isLoadingFilter}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Renommer"
                              >
                                <Edit3 className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleDelete(filter.id)}
                                disabled={isDeleting || isLoadingFilter}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Supprimer"
                              >
                                {isDeleting ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full"
                                  />
                                ) : (
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Preview sélections */}
                        {renderFilterPreview(filter)}

                        {/* Avertissement remplacement */}
                        <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800">
                            Le chargement remplacera vos filtres actuels
                          </p>
                        </div>

                        {/* Action Charger */}
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => onLoad(filter.id)}
                          disabled={isLoadingFilter || isDeletingFilter || isEditing}
                          className="w-full"
                        >
                          {isLoadingFilter ? (
                            <span className="flex items-center justify-center space-x-2">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                              />
                              <span>Chargement...</span>
                            </span>
                          ) : (
                            <span className="flex items-center justify-center space-x-2">
                              <FolderOpen className="w-4 h-4" />
                              <span>Charger ce filtre</span>
                            </span>
                          )}
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};