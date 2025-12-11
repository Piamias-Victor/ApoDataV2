// src/components/organisms/FilterPanel/ProductsFilterPanel.tsx
'use client';

import React from 'react';
import { Package, Search, Grid } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { useProductFilter } from './hooks/useProductFilter';

// Sub-components
import { FilterTabs } from './components/shared/FilterTabs';
import { FilterSearchInput } from './components/shared/FilterSearchInput';
import { PinnedSelectionList } from './components/shared/PinnedSelectionList';
import { ProductList } from './components/ProductList';
import { TvaFilterSection } from './components/TvaFilterSection';

interface ProductsFilterPanelProps { onClose?: () => void; }

export const ProductsFilterPanel: React.FC<ProductsFilterPanelProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = React.useState<'name' | 'type'>('name');

    const {
        searchQuery, setSearchQuery,
        results, isLoading, selectedMap,
        handleToggle, handleRemoveSelection, handleApply, handleClearAll, handleSelectAll,
        selectedTvaRates, handleToggleTva
    } = useProductFilter(onClose);

    // Convert selectedMap to pinned items (one per bcb_product_id) - limit to 50
    const selectedItems = Array.from(selectedMap.values())
        .slice(0, 50)
        .map(item => ({
            id: item.bcb_product_id,
            name: `${item.name} (${item.all_codes.length} code${item.all_codes.length > 1 ? 's' : ''})`
        }));

    const hasSelection = selectedMap.size > 0;

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header with Tabs */}
            <div className="bg-white px-6 pt-6 pb-2 z-30 border-b border-gray-50 shadow-sm shrink-0">
                <FilterTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabs={[
                        { id: 'name', label: 'Par Nom', icon: Search },
                        { id: 'type', label: 'Par Type', icon: Grid }
                    ]}
                />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {activeTab === 'name' ? (
                    <>
                        {/* Search Input */}
                        <div className="sticky top-0 p-6 bg-white/95 backdrop-blur z-20 border-b border-gray-100">
                            <FilterSearchInput
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Rechercher (nom, code, *fin)..."
                                focusColor="green"
                            />
                        </div>

                        {/* Results Header with Actions */}
                        {!isLoading && results.length > 0 && (
                            <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-100">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    {results.length} Résultats
                                </span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline"
                                    >
                                        Tout sélectionner
                                    </button>
                                    {hasSelection && (
                                        <button
                                            onClick={handleClearAll}
                                            className="text-xs font-semibold text-gray-400 hover:text-gray-600 hover:underline"
                                        >
                                            Réinitialiser
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Pinned + Results */}
                        <div className="p-6 space-y-4">
                            {hasSelection && (
                                <>
                                    <PinnedSelectionList
                                        items={selectedItems}
                                        onRemove={(id) => handleRemoveSelection(id)}
                                        icon={Package}
                                        colorTheme="green"
                                    />
                                    {searchQuery && results.length > 0 && (
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                            Résultats
                                        </h3>
                                    )}
                                </>
                            )}
                            <ProductList
                                products={results}
                                isLoading={isLoading}
                                selectedMap={selectedMap}
                                onToggle={handleToggle}
                            />
                        </div>
                    </>
                ) : (
                    /* Par Type Tab - TVA Filter */
                    <TvaFilterSection
                        selectedTvaRates={selectedTvaRates}
                        onToggleTva={handleToggleTva}
                    />
                )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] shrink-0">
                <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={handleApply}
                    className="shadow-xl rounded-xl h-12 bg-green-600 hover:bg-green-700 shadow-green-500/20"
                >
                    Appliquer ({selectedMap.size})
                </Button>
            </div>
        </div>
    );
};
