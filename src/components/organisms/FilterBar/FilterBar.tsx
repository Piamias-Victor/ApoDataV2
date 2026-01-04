'use client';

import React from 'react';
import { Calendar, TestTube, Tag, Package, Building2, Settings, Ban } from 'lucide-react';
import { FilterSaveLoadBadges } from './FilterSaveLoadBadges';
import { FilterButton } from './components/FilterButton';
import { useFilterBarLogic } from './hooks/useFilterBarLogic';
import { FilterDrawerList } from './components/FilterDrawerList';

interface FilterBarProps {
    hiddenFilters?: ('products' | 'laboratories' | 'categories')[];
}

export const FilterBar: React.FC<FilterBarProps> = ({ hiddenFilters = [] }) => {
    const {
        isScrolled,
        activeDrawer,
        setActiveDrawer,
        handleClose,
        clearFilters,
        tooltips,
        storeState,
        computedState,
        canEditPharmacies
    } = useFilterBarLogic();

    return (
        <>
            <div className={`sticky top-0 z-40 transition-all duration-300 mx-auto max-w-full md:max-w-fit pt-4 pb-2 md:pb-0 px-4 md:px-0 ${isScrolled ? 'translate-y-0' : 'translate-y-0'}`}>
                <div className="flex items-center gap-3 px-3 py-2.5 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 ring-1 ring-black/5 overflow-x-auto no-scrollbar max-w-[calc(100vw-32px)] md:max-w-none">
                    <style jsx global>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>
                    <FilterButton
                        icon={<Building2 className="w-4 h-4" />}
                        label="Pharmacies"
                        count={storeState.pharmacies.length}
                        color="orange"
                        onClick={() => canEditPharmacies && setActiveDrawer('pharmacy')}
                        onClear={() => clearFilters('pharmacy')}
                        tooltip={canEditPharmacies ? tooltips.pharmacyTooltip : 'Filtre verrouillé pour votre compte'}
                        isActive={storeState.pharmacies.length > 0}
                        disabled={!canEditPharmacies}
                    />

                    <div className="w-px h-10 bg-gray-200" />

                    <FilterButton
                        icon={<Calendar className="w-4 h-4" />}
                        label="Période"
                        count={storeState.dateRange.start ? 1 : 0}
                        color="blue"
                        onClick={() => setActiveDrawer('date')}
                        onClear={() => clearFilters('date')}
                        tooltip={tooltips.dateTooltip}
                        isActive={!!storeState.dateRange.start}
                    />

                    <div className="w-px h-10 bg-gray-200" />

                    {!hiddenFilters.includes('products') && (
                        <>
                            <FilterButton
                                icon={<Package className="w-4 h-4" />}
                                label="Produits"
                                count={storeState.products.length}
                                color="green"
                                onClick={() => setActiveDrawer('products')}
                                onClear={() => clearFilters('products')}
                                tooltip={tooltips.productTooltip}
                                isActive={computedState.isProductsActive}
                            />
                            <div className="w-px h-10 bg-gray-200" />
                        </>
                    )}

                    {!hiddenFilters.includes('laboratories') && (
                        <>
                            <FilterButton
                                icon={<TestTube className="w-4 h-4" />}
                                label="Laboratoires"
                                count={storeState.laboratories.length}
                                color="purple"
                                onClick={() => setActiveDrawer('laboratories')}
                                onClear={() => clearFilters('laboratories')}
                                tooltip={tooltips.laboratoryTooltip}
                                isActive={storeState.laboratories.length > 0}
                            />
                            <div className="w-px h-10 bg-gray-200" />
                        </>
                    )}

                    {!hiddenFilters.includes('categories') && (
                        <>
                            <FilterButton
                                icon={<Tag className="w-4 h-4" />}
                                label="Catégories"
                                count={storeState.categories.length}
                                color="red"
                                onClick={() => setActiveDrawer('categories')}
                                onClear={() => clearFilters('categories')}
                                tooltip={tooltips.categoryTooltip}
                                isActive={storeState.categories.length > 0}
                            />
                            <div className="w-px h-10 bg-gray-200" />
                        </>
                    )}

                    <FilterButton
                        icon={<Settings className="w-4 h-4" />}
                        label="Opérateur Logique"
                        count={0}
                        color="yellow"
                        onClick={() => setActiveDrawer('operators')}
                        tooltip="Configurez comment combiner vos filtres (ET/OU)"
                        isActive={false}
                    />

                    <FilterButton
                        icon={<Ban className="w-4 h-4" />}
                        label="Exclusions"
                        count={computedState.exclusionsCount}
                        color="black"
                        onClick={() => setActiveDrawer('exclusions')}
                        onClear={() => clearFilters('exclusions')}
                        tooltip="Exclure des produits, labos ou catégories"
                        isActive={computedState.exclusionsCount > 0}
                    />
                </div>

                <FilterSaveLoadBadges />
            </div>

            <FilterDrawerList activeDrawer={activeDrawer} onClose={handleClose} />
        </>
    );
};
