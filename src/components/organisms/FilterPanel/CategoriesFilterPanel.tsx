// src/components/organisms/FilterPanel/CategoriesFilterPanel.tsx
'use client';

import React from 'react';
import { Folder } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { useCategoryFilter } from './hooks/useCategoryFilter';
import { CategoryHeader } from './components/categories/CategoryHeader';
import { CategoryList } from './components/categories/CategoryList';
import { PinnedSelectionList } from './components/shared/PinnedSelectionList';

interface CategoriesFilterPanelProps { onClose?: () => void; }

export const CategoriesFilterPanel: React.FC<CategoriesFilterPanelProps> = ({ onClose }) => {
    const {
        searchQuery, setSearchQuery, results, isLoading, selectedMap,
        handleToggle, handleRemoveSelection, handleApply, handleClearAll
    } = useCategoryFilter(onClose);

    // Use results directly (don't filter filtered items)
    const displayResults = (!searchQuery && results.length > 10) ? results.slice(0, 10) : results;
    const selectedItems = Array.from(selectedMap.values());

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <CategoryHeader
                currentSearch={searchQuery}
                onSearchChange={setSearchQuery}
                selectionCount={selectedMap.size}
                onClearAll={handleClearAll}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {searchQuery ? (
                    <>
                        <CategoryList
                            items={displayResults}
                            isLoading={isLoading}
                            selectedMap={selectedMap}
                            hasSelection={selectedMap.size > 0}
                            searchQuery={searchQuery}
                            onToggle={handleToggle}
                        />
                        {selectedItems.length > 0 && (
                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Sélection en cours ({selectedItems.length})
                                </h3>
                                <PinnedSelectionList
                                    items={selectedItems}
                                    onRemove={handleRemoveSelection}
                                    icon={Folder}
                                    colorTheme="red"
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <PinnedSelectionList
                            items={selectedItems}
                            onRemove={handleRemoveSelection}
                            icon={Folder}
                            colorTheme="red"
                        />
                        <CategoryList
                            items={displayResults}
                            isLoading={isLoading}
                            selectedMap={selectedMap}
                            hasSelection={selectedMap.size > 0}
                            searchQuery={searchQuery}
                            onToggle={handleToggle}
                        />
                    </>
                )}
            </div>

            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] shrink-0">
                <Button variant="primary" fullWidth size="lg" onClick={handleApply}
                    className="shadow-xl rounded-xl h-12 !bg-none !bg-red-600 hover:!bg-red-700 shadow-red-500/20"
                >
                    Appliquer ({selectedMap.size})
                </Button>
            </div>
        </div>
    );
};
