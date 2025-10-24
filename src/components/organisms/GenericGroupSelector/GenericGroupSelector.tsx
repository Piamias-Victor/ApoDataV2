// src/components/organisms/GenericGroupSelector/GenericGroupSelector.tsx
'use client';

import React from 'react';
import { Search, Package, Beaker, Hash, X, Pill, Check, TestTube, Filter } from 'lucide-react';
import { useGenericGroupSearch, type SearchMode } from '@/hooks/generic-groups/useGenericGroupSearch';
import { useGenericGroupStore } from '@/stores/useGenericGroupStore';

export const GenericGroupSelector: React.FC = () => {
  const {
    groups,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    toggleGroup,
    isGroupSelected,
  } = useGenericGroupSearch();

  // Récupérer toutes les sélections depuis le store
  const selectedGroups = useGenericGroupStore(state => state.selectedGroups);
  const selectedProducts = useGenericGroupStore(state => state.selectedProducts);
  const selectedLaboratories = useGenericGroupStore(state => state.selectedLaboratories);
  const removeGroup = useGenericGroupStore(state => state.removeGroup);
  const removeProduct = useGenericGroupStore(state => state.removeProduct);
  const removeLaboratory = useGenericGroupStore(state => state.removeLaboratory);
  const clearSelection = useGenericGroupStore(state => state.clearSelection);

  const searchModes: Array<{ mode: SearchMode; label: string; icon: React.ReactNode }> = [
    { mode: 'group', label: 'Groupe', icon: <Package className="w-4 h-4" /> },
    { mode: 'molecule', label: 'Molécule/DCI', icon: <Beaker className="w-4 h-4" /> },
    { mode: 'code', label: 'Code produit', icon: <Hash className="w-4 h-4" /> },
  ];

  const hasAnySelection = selectedGroups.length > 0 || selectedProducts.length > 0 || selectedLaboratories.length > 0;
  const totalSelections = selectedGroups.length + selectedProducts.length + selectedLaboratories.length;

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

      {/* Sélections actives */}
      {hasAnySelection && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">
                {totalSelections} sélection{totalSelections > 1 ? 's' : ''} active{totalSelections > 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={clearSelection}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Tout effacer
            </button>
          </div>

          <div className="space-y-3">
            {/* Groupes génériques */}
            {selectedGroups.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  🏷️ Groupes génériques ({selectedGroups.length})
                </p>
                {selectedGroups.map((group) => (
                  <div 
                    key={group.generic_group}
                    className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <Pill className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">
                            {group.generic_group}
                          </h3>
                        </div>
                        
                        {group.referent_name && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Référent:</span> {group.referent_name}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-500">
                            {group.product_count} produits
                          </span>
                          <span className="text-gray-500">
                            {group.generic_count} génériques
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeGroup(group.generic_group)}
                        className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Produits individuels */}
            {selectedProducts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  📦 Produits individuels ({selectedProducts.length})
                </p>
                {selectedProducts.map((product) => (
                  <div 
                    key={product.code_13_ref}
                    className="bg-pink-50 border-2 border-pink-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <Package className="w-5 h-5 text-pink-600" />
                          <h3 className="font-semibold text-gray-900">
                            {product.name}
                          </h3>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm">
                          <span className={`
                            px-2 py-0.5 rounded text-xs font-medium
                            ${product.bcb_generic_status === 'RÉFÉRENT' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                          `}>
                            {product.bcb_generic_status}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-500">{product.bcb_lab}</span>
                        </div>
                        
                        <p className="text-xs text-gray-400 font-mono mt-1">
                          {product.code_13_ref}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => removeProduct(product.code_13_ref)}
                        className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Laboratoires */}
            {selectedLaboratories.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  🧪 Laboratoires ({selectedLaboratories.length})
                </p>
                {selectedLaboratories.map((lab) => (
                  <div 
                    key={lab.laboratory_name}
                    className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <TestTube className="w-5 h-5 text-purple-600" />
                          <h3 className="font-semibold text-gray-900">
                            {lab.laboratory_name}
                          </h3>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          {lab.product_count} produits • {lab.generic_count} génériques • {lab.referent_count} référents
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeLaboratory(lab.laboratory_name)}
                        className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Résultats de recherche */}
      {searchQuery.length >= 2 && (
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
          
          {!isLoading && !error && groups.map((group) => {
            const selected = isGroupSelected(group.generic_group);
            
            return (
              <button
                key={group.generic_group}
                onClick={() => toggleGroup(group)}
                className={`
                  w-full text-left p-4 border rounded-lg transition-all
                  ${selected 
                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium text-gray-900">
                        {group.generic_group}
                      </div>
                      {selected && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
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
            );
          })}
        </div>
      )}

      {/* Message si aucune sélection */}
      {!hasAnySelection && searchQuery.length < 2 && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Filter className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="font-medium">Aucune sélection active</p>
          <p className="text-sm mt-1">
            Recherchez des groupes génériques ci-dessus ou utilisez le drawer pour ajouter des produits/laboratoires
          </p>
        </div>
      )}
    </div>
  );
};