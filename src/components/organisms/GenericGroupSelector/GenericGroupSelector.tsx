// src/components/organisms/GenericGroupSelector/GenericGroupSelector.tsx
'use client';

import React from 'react';
import { Search, Package, Beaker, Hash, X, Pill } from 'lucide-react';
import { useGenericGroupSearch, type SearchMode } from '@/hooks/generic-groups/useGenericGroupSearch';

export const GenericGroupSelector: React.FC = () => {
  const {
    groups,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    selectedGroup,
    selectGroup,
    clearSelection,
  } = useGenericGroupSearch();

  const searchModes: Array<{ mode: SearchMode; label: string; icon: React.ReactNode }> = [
    { mode: 'group', label: 'Groupe', icon: <Package className="w-4 h-4" /> },
    { mode: 'molecule', label: 'Molécule/DCI', icon: <Beaker className="w-4 h-4" /> },
    { mode: 'code', label: 'Code produit', icon: <Hash className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Mode de recherche */}
      <div className="flex space-x-2">
        {searchModes.map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => setSearchMode(mode)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg transition-all
              ${searchMode === mode 
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' 
                : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300'
              }
            `}
          >
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            searchMode === 'group' ? "Rechercher un groupe générique..." :
            searchMode === 'molecule' ? "Rechercher par molécule/DCI..." :
            "Rechercher par code produit..."
          }
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Groupe sélectionné */}
      {selectedGroup && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Pill className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  {selectedGroup.generic_group}
                </h3>
              </div>
              
              {selectedGroup.referent_name && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Référent:</span> {selectedGroup.referent_name}
                </div>
              )}
              
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-500">
                  {selectedGroup.product_count} produits total
                </span>
                <span className="text-gray-500">
                  {selectedGroup.generic_count} génériques
                </span>
              </div>
            </div>
            
            <button
              onClick={clearSelection}
              className="p-1 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Résultats de recherche */}
      {!selectedGroup && searchQuery.length >= 2 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="text-center py-8 text-gray-500">
              Recherche en cours...
            </div>
          )}
          
          {error && (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          )}
          
          {!isLoading && !error && groups.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun groupe trouvé
            </div>
          )}
          
          {!isLoading && !error && groups.map((group) => (
            <button
              key={group.generic_group}
              onClick={() => selectGroup(group)}
              className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">
                    {group.generic_group}
                  </div>
                  {group.referent_name && (
                    <div className="text-sm text-gray-600">
                      Référent: {group.referent_name}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {group.product_count} produits
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};