// src/components/organisms/FilterPanel/ProductsFilterPanel.tsx
'use client';

import React from 'react';
import { Package, SlidersHorizontal, Euro } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { useProductFilter } from './hooks/useProductFilter';
import { FilterTabs } from './components/shared/FilterTabs';
import { TvaFilterSection } from './components/TvaFilterSection';
import { ReimbursementFilterSection } from './components/ReimbursementFilterSection';
import { ProductNameTabContent } from './components/products/ProductNameTabContent';

import { GenericFilterSection } from './components/GenericFilterSection';
import { ProductPriceTabContent } from './components/products/ProductPriceTabContent';

interface ProductsFilterPanelProps { onClose?: () => void; }

export const ProductsFilterPanel: React.FC<ProductsFilterPanelProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = React.useState<'name' | 'type' | 'price'>('name');

    const {
        searchQuery, setSearchQuery, results, isLoading,
        selectedMap,
        handleToggle, handleRemoveSelection, handleApply, handleClearAll,
        handleSelectAll,
        selectedTvaRates, handleToggleTva,
        reimbursementStatus, handleToggleReimbursement,
        isGeneric, setIsGeneric,
        purchasePriceNetRange, setPurchasePriceNetRange,
        purchasePriceGrossRange, setPurchasePriceGrossRange,
        sellPriceRange, setSellPriceRange,
        discountRange, setDiscountRange,
        marginRange, setMarginRange
    } = useProductFilter(onClose);

    // selectedItems is computed inside ProductNameTabContent or here? 
    // ProductNameTabContent computes it from selectedMap. We don't need to pass it.

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <div className="bg-white px-6 pt-6 pb-2 z-30 border-b border-gray-50 shadow-sm shrink-0">
                <FilterTabs
                    activeTab={activeTab} onTabChange={setActiveTab}
                    tabs={[
                        { id: 'name', label: 'Par nom', icon: Package },
                        { id: 'type', label: 'Par type', icon: SlidersHorizontal },
                        { id: 'price', label: 'Par prix', icon: Euro }
                    ]}
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {activeTab === 'name' ? (
                    <ProductNameTabContent
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        results={results}
                        isLoading={isLoading}
                        selectedMap={selectedMap}
                        onToggle={handleToggle}
                        onRemoveSelection={handleRemoveSelection}
                        onSelectAll={handleSelectAll}
                        onClearAll={handleClearAll}
                    />
                ) : activeTab === 'type' ? (
                    <div className="py-2 divide-y divide-gray-100">
                        <TvaFilterSection
                            selectedTvaRates={selectedTvaRates}
                            onToggleTva={handleToggleTva}
                        />
                        <ReimbursementFilterSection
                            selectedStatus={reimbursementStatus}
                            onToggle={handleToggleReimbursement}
                        />
                        <GenericFilterSection
                            isGeneric={isGeneric}
                            onToggle={setIsGeneric}
                        />
                    </div>
                ) : (
                    <ProductPriceTabContent
                        purchasePriceNetRange={purchasePriceNetRange}
                        onPurchasePriceNetRangeChange={setPurchasePriceNetRange}
                        purchasePriceGrossRange={purchasePriceGrossRange}
                        onPurchasePriceGrossRangeChange={setPurchasePriceGrossRange}
                        sellPriceRange={sellPriceRange}
                        onSellPriceRangeChange={setSellPriceRange}
                        discountRange={discountRange}
                        onDiscountRangeChange={setDiscountRange}
                        marginRange={marginRange}
                        onMarginRangeChange={setMarginRange}
                    />
                )}
            </div>

            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] shrink-0">
                <Button variant="primary" fullWidth size="lg" onClick={handleApply} className="shadow-xl shadow-green-500/20 rounded-xl h-12 !bg-none !bg-green-600 hover:!bg-green-700">
                    Appliquer ({selectedMap.size})
                </Button>
            </div>
        </div>
    );
};
