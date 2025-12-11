import React from 'react';
import { Package } from 'lucide-react';
import { FilterSearchInput } from '../shared/FilterSearchInput';
import { PinnedSelectionList } from '../shared/PinnedSelectionList';
import { ProductList } from '../ProductList';
import { Product, ProductSelection } from '../../hooks/useProductFilter';

interface ProductNameTabContentProps {
    searchQuery: string;
    onSearchChange: (val: string) => void;
    results: Product[];
    isLoading: boolean;
    selectedMap: Map<string, ProductSelection>;
    onToggle: (product: Product) => void;
    onRemoveSelection: (id: string) => void;
    onSelectAll: () => void;
    onClearAll: () => void;
}

export const ProductNameTabContent: React.FC<ProductNameTabContentProps> = ({
    searchQuery, onSearchChange, results, isLoading, selectedMap,
    onToggle, onRemoveSelection, onSelectAll, onClearAll
}) => {
    // Convert selectedMap to pinned items (limit to 50)
    const selectedItems = Array.from(selectedMap.values())
        .slice(0, 50)
        .map(item => ({
            id: item.bcb_product_id.toString(),
            name: item.name
        }));

    const hasSelection = selectedMap.size > 0;

    // Limit to 10 results if no search query
    const displayResults = (!searchQuery && results.length > 10) ? results.slice(0, 10) : results;

    return (
        <>
            <div className="sticky top-0 p-6 bg-white/95 backdrop-blur z-20 border-b border-gray-100">
                <FilterSearchInput
                    value={searchQuery}
                    onChange={onSearchChange}
                    placeholder="Rechercher (nom, code, *fin)..."
                    focusColor="green"
                />
            </div>

            {!isLoading && displayResults.length > 0 && (
                <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {displayResults.length} {searchQuery ? 'Résultats' : 'Suggestions'}
                    </span>
                    <div className="flex gap-3">
                        <button onClick={onSelectAll} className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
                            Tout sélectionner
                        </button>
                        {hasSelection && (
                            <button onClick={onClearAll} className="text-xs font-semibold text-gray-400 hover:text-gray-600 hover:underline">
                                Réinitialiser
                            </button>
                        )}
                    </div>
                </div>
            )}

            {searchQuery ? (
                // Search Mode: Results first, then Selection
                <div className="p-6 space-y-8">
                    {/* Results Section */}
                    {displayResults.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Résultats
                            </h3>
                            <ProductList
                                products={displayResults}
                                isLoading={isLoading}
                                selectedMap={selectedMap}
                                onToggle={onToggle}
                            />
                        </div>
                    )}

                    {/* Selection Section (if items exist) */}
                    {hasSelection && (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Sélection en cours ({selectedItems.length})
                            </h3>
                            <PinnedSelectionList
                                items={selectedItems}
                                onRemove={onRemoveSelection}
                                icon={Package}
                                colorTheme="green"
                            />
                        </div>
                    )}
                </div>
            ) : (
                // Default Mode: Selection first, then Suggestions
                <div className="p-6 space-y-6">
                    {hasSelection && (
                        <PinnedSelectionList
                            items={selectedItems}
                            onRemove={onRemoveSelection}
                            icon={Package}
                            colorTheme="green"
                        />
                    )}

                    <div className="space-y-4">
                        {!hasSelection && (
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Suggestions
                            </h3>
                        )}
                        <ProductList
                            products={displayResults}
                            isLoading={isLoading}
                            selectedMap={selectedMap} // This might need casting if ProductList expects strict type
                            onToggle={onToggle}
                        />
                    </div>
                </div>
            )}
        </>
    );
};
