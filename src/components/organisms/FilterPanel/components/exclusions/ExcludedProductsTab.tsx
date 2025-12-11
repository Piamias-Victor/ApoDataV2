// src/components/organisms/FilterPanel/components/exclusions/ExcludedProductsTab.tsx
import React from 'react';
import { Button } from '@/components/atoms/Button/Button';
import { ExcludedProductList } from './ExcludedProductList';
import { useExcludedProductFilter } from '../../hooks/useExcludedProductFilter';

interface ExcludedProductsTabProps {
    onClose?: (() => void) | undefined;
}

export const ExcludedProductsTab: React.FC<ExcludedProductsTabProps> = ({ onClose }) => {
    const {
        searchQuery,
        setSearchQuery,
        results,
        isLoading,
        selectedMap,
        handleToggle,
        handleRemoveSelection,
        handleSelectAll,
        handleClearAll,
        handleApply,
        searchAndSelectByCodes
    } = useExcludedProductFilter(onClose);

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <ExcludedProductList
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    results={results}
                    isLoading={isLoading}
                    selectedMap={selectedMap}
                    onToggle={handleToggle}
                    onRemoveSelection={handleRemoveSelection}
                    onSelectAll={handleSelectAll}
                    onClearAll={handleClearAll}
                    onBulkSearch={searchAndSelectByCodes}
                />
            </div>

            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] shrink-0">
                <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={handleApply}
                    className="shadow-xl shadow-gray-500/20 rounded-xl h-12 !bg-none !bg-gray-800 hover:!bg-gray-900"
                >
                    Appliquer ({selectedMap.size})
                </Button>
            </div>
        </div>
    );
};
