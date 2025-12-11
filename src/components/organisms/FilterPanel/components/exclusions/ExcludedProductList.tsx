// src/components/organisms/FilterPanel/components/exclusions/ExcludedProductList.tsx
import React from 'react';
import { Package } from 'lucide-react';
import { FilterSearchInput } from '../shared/FilterSearchInput';
import { PinnedSelectionList } from '../shared/PinnedSelectionList';
import { BulkCodeInput } from '../shared/BulkCodeInput';
import { ResultsHeader } from '../shared/ResultsHeader';
import { ProductList } from '../ProductList';
import { Product, ProductSelection } from '../../hooks/useProductFilter';

interface ExcludedProductListProps {
    searchQuery: string;
    onSearchChange: (val: string) => void;
    results: Product[];
    isLoading: boolean;
    selectedMap: Map<string, ProductSelection>;
    onToggle: (product: Product) => void;
    onRemoveSelection: (id: string) => void;
    onSelectAll: () => void;
    onClearAll: () => void;
    onBulkSearch: (codes: string[]) => Promise<void>;
}

export const ExcludedProductList: React.FC<ExcludedProductListProps> = ({
    searchQuery, onSearchChange, results, isLoading, selectedMap,
    onToggle, onRemoveSelection, onSelectAll, onClearAll, onBulkSearch
}) => {
    const selectedItems = Array.from(selectedMap.values())
        .slice(0, 50)
        .map(item => ({
            id: item.bcb_product_id.toString(),
            name: item.name
        }));

    const hasSelection = selectedMap.size > 0;
    const displayResults = (!searchQuery && results.length > 10) ? results.slice(0, 10) : results;

    return (
        <>
            <div className="sticky top-0 p-6 bg-white/95 backdrop-blur z-20 border-b border-gray-100 space-y-3">
                <FilterSearchInput
                    value={searchQuery}
                    onChange={onSearchChange}
                    placeholder="Rechercher (nom, code, *fin)..."
                    focusColor="gray"
                />
                <BulkCodeInput onCodesExtracted={onBulkSearch} buttonColor="gray" />
            </div>

            {!isLoading && displayResults.length > 0 && (
                <ResultsHeader
                    resultsCount={displayResults.length}
                    isSearchMode={!!searchQuery}
                    hasSelection={hasSelection}
                    onSelectAll={onSelectAll}
                    onClearAll={onClearAll}
                    accentColor="gray"
                />
            )}

            {searchQuery ? (
                <div className="p-6 space-y-8">
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

                    {hasSelection && (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Sélection en cours ({selectedItems.length})
                            </h3>
                            <PinnedSelectionList
                                items={selectedItems}
                                onRemove={onRemoveSelection}
                                icon={Package}
                                colorTheme="black"
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-6 space-y-6">
                    {hasSelection && (
                        <PinnedSelectionList
                            items={selectedItems}
                            onRemove={onRemoveSelection}
                            icon={Package}
                            colorTheme="black"
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
                            selectedMap={selectedMap}
                            onToggle={onToggle}
                        />
                    </div>
                </div>
            )}
        </>
    );
};
