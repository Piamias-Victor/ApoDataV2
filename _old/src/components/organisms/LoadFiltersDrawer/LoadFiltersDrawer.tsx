// src/components/organisms/LoadFiltersDrawer/LoadFiltersDrawer.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FolderOpen,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFilterId, setExpandedFilterId] = useState<string | null>(null);

  // Filtrer les filtres selon la recherche
  const filteredFilters = useMemo(() => {
    if (!searchQuery.trim()) return savedFilters;

    const query = searchQuery.toLowerCase();
    return savedFilters.filter(filter =>
      filter.name.toLowerCase().includes(query)
    );
  }, [savedFilters, searchQuery]);

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

  // Helper pour résumé compact inline
  const renderCompactSummary = (filter: SavedFilter): string => {
    if (filter.filter_type === 'classic') {
      const f = filter as ClassicSavedFilter;
      const parts = [];
      if (f.product_codes.length > 0) parts.push(`📦 ${f.product_codes.length} produit${f.product_codes.length > 1 ? 's' : ''}`);
      if (f.laboratory_names.length > 0) parts.push(`🧪 ${f.laboratory_names.length} labo${f.laboratory_names.length > 1 ? 's' : ''}`);
      if (f.category_names.length > 0) parts.push(`🏷️ ${f.category_names.length} catég.`);
      return parts.join(' • ');
    } else {
      const f = filter as GenericSavedFilter;
      const parts = [];
      if (f.generic_groups.length > 0) parts.push(`🔷 ${f.generic_groups.length} groupe${f.generic_groups.length > 1 ? 's' : ''}`);
      if (f.generic_products.length > 0) parts.push(`📦 ${f.generic_products.length} produit${f.generic_products.length > 1 ? 's' : ''}`);
      if (f.generic_laboratories.length > 0) parts.push(`🧪 ${f.generic_laboratories.length} labo${f.generic_laboratories.length > 1 ? 's' : ''}`);
      return parts.join(' • ');
    }
  };

  // Helper pour afficher les détails complets
  const renderDetailedView = (filter: SavedFilter) => {
    if (filter.filter_type === 'classic') {
      const f = filter as ClassicSavedFilter;
      return (
        <div className="mt-3 space-y-3 text-sm">
          {f.laboratory_names.length > 0 && (
            <div>
              <div className="font-semibold text-gray-700 mb-1">🧪 Laboratoires ({f.laboratory_names.length})</div>
              <div className="flex flex-wrap gap-1">
                {f.laboratory_names.map((lab, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                    {lab}
                  </span>
                ))}
              </div>
            </div>
          )}
          {f.category_names.length > 0 && (
            <div>
              <div className="font-semibold text-gray-700 mb-1">🏷️ Catégories ({f.category_names.length})</div>
              <div className="flex flex-wrap gap-1">
                {f.category_names.map((cat, idx) => (
                  <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
          {f.product_codes.length > 0 && (
            <div>
              <div className="font-semibold text-gray-700 mb-1">📦 Produits ({f.product_codes.length})</div>
              <div className="text-xs text-gray-600">
                {f.product_codes.length} produit{f.product_codes.length > 1 ? 's' : ''} sélectionné{f.product_codes.length > 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      );
    } else {
      const f = filter as GenericSavedFilter;
      return (
        <div className="mt-3 space-y-3 text-sm">
          {f.generic_laboratories.length > 0 && (
            <div>
              <div className="font-semibold text-gray-700 mb-1">🧪 Laboratoires ({f.generic_laboratories.length})</div>
              <div className="flex flex-wrap gap-1">
                {f.generic_laboratories.map((lab, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                    {lab.laboratory_name} ({lab.product_count})
                  </span>
                ))}
              </div>
            </div>
          )}
          {f.generic_groups.length > 0 && (
            <div>
              <div className="font-semibold text-gray-700 mb-1">🔷 Groupes génériques ({f.generic_groups.length})</div>
              <div className="flex flex-wrap gap-1">
                {f.generic_groups.map((group, idx) => (
                  <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs">
                    {group.generic_group} ({group.product_count})
                  </span>
                ))}
              </div>
            </div>
          )}
          {f.generic_products.length > 0 && (
            <div>
              <div className="font-semibold text-gray-700 mb-1">📦 Produits ({f.generic_products.length})</div>
              <div className="text-xs text-gray-600">
                {f.generic_products.length} produit{f.generic_products.length > 1 ? 's' : ''} sélectionné{f.generic_products.length > 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
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

            {/* Barre de recherche */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <Input
                type="text"
                placeholder="🔍 Rechercher un filtre par nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              {searchQuery && (
                <p className="text-xs text-gray-500 mt-2">
                  {filteredFilters.length} résultat{filteredFilters.length > 1 ? 's' : ''}
                </p>
              )}
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
              ) : filteredFilters.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <FolderOpen className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchQuery ? 'Aucun résultat' : 'Aucun filtre sauvegardé'}
                  </h3>
                  <p className="text-gray-600 max-w-sm">
                    {searchQuery
                      ? `Aucun filtre ne correspond à "${searchQuery}"`
                      : 'Commencez par sélectionner des produits, laboratoires ou catégories, puis cliquez sur "Sauvegarder" pour créer votre premier filtre.'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {/* Avertissement unique en haut */}
                  <div className="mb-4 flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      Le chargement d'un filtre remplacera vos filtres actuels
                    </p>
                  </div>

                  {/* Liste compacte des filtres */}
                  <div className="space-y-2">
                    {filteredFilters.map((filter) => {
                      const isEditing = editingId === filter.id;
                      const isDeleting = deletingId === filter.id;

                      return (
                        <div
                          key={filter.id}
                          className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                        >
                          {/* Ligne 1: Nom + Badge + Actions */}
                          <div className="flex items-center justify-between mb-2">
                            {isEditing ? (
                              <div className="flex items-center space-x-2 flex-1">
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
                              <>
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <h3 className="text-base font-semibold text-gray-900 truncate">
                                    {filter.name}
                                  </h3>
                                  <FilterTypeBadge type={filter.filter_type} />
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  <button
                                    onClick={() => handleStartEdit(filter)}
                                    disabled={isDeletingFilter || isLoadingFilter}
                                    className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                                    title="Renommer"
                                  >
                                    <Edit3 className="w-4 h-4 text-gray-600" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(filter.id)}
                                    disabled={isDeleting || isLoadingFilter}
                                    className="p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
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
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => onLoad(filter.id)}
                                    disabled={isLoadingFilter || isDeletingFilter || isEditing}
                                    className="ml-2"
                                  >
                                    Mes Filtres
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Ligne 2: Résumé compact cliquable */}
                          {!isEditing && (
                            <button
                              onClick={() => setExpandedFilterId(expandedFilterId === filter.id ? null : filter.id)}
                              className="w-full text-left text-sm text-gray-600 mb-1 hover:text-blue-600 transition-colors flex items-center justify-between group"
                            >
                              <span>{renderCompactSummary(filter)}</span>
                              <span className="text-xs text-gray-400 group-hover:text-blue-500">
                                {expandedFilterId === filter.id ? '▼ Masquer' : '▶ Voir détails'}
                              </span>
                            </button>
                          )}

                          {/* Vue détaillée (expandable) */}
                          {!isEditing && expandedFilterId === filter.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              {renderDetailedView(filter)}
                            </motion.div>
                          )}

                          {/* Ligne 3: Date */}
                          {!isEditing && (
                            <p className="text-xs text-gray-500">
                              Modifié le {formatDate(filter.updated_at)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};