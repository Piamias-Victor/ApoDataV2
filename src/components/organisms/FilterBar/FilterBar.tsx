// src/components/organisms/FilterBar/FilterBar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, TestTube, Tag, Package, Building2, Settings, Ban } from 'lucide-react';
import { Drawer } from '@/components/molecules/Drawer/Drawer';
import { PharmacyFilterPanel } from '../FilterPanel/PharmacyFilterPanel';
import { DateFilterPanel } from '../FilterPanel/DateFilterPanel';
import { LaboratoriesFilterPanel } from '../FilterPanel/LaboratoriesFilterPanel';
import { CategoriesFilterPanel } from '../FilterPanel/CategoriesFilterPanel';
import { ProductsFilterPanel } from '../FilterPanel/ProductsFilterPanel';
import { LogicalOperatorFilterPanel } from '../FilterPanel/LogicalOperatorFilterPanel';
import { ExclusionsFilterPanel } from '../FilterPanel/ExclusionsFilterPanel';
import { FilterSaveLoadBadges } from './FilterSaveLoadBadges';
import { FilterButton } from './components/FilterButton';
import { useFilterTooltips } from './hooks/useFilterTooltips';
import { useFilterStore } from '@/stores/useFilterStore';

type DrawerType = 'pharmacy' | 'date' | 'laboratories' | 'categories' | 'products' | 'operators' | 'exclusions' | null;

export const FilterBar: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
    const { pharmacies, dateRange, laboratories, categories, products, excludedProducts, excludedLaboratories, excludedCategories } = useFilterStore();

    const tooltips = useFilterTooltips({ pharmacies, laboratories, categories, products, dateRange });

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleClose = () => setActiveDrawer(null);

    const exclusionsCount = excludedProducts.length + excludedLaboratories.length + excludedCategories.length;

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
                        count={pharmacies.length}
                        color="orange"
                        onClick={() => setActiveDrawer('pharmacy')}
                        tooltip={tooltips.pharmacyTooltip}
                        isActive={pharmacies.length > 0}
                    />

                    <div className="w-px h-10 bg-gray-200" />

                    <FilterButton
                        icon={<Calendar className="w-4 h-4" />}
                        label="Période"
                        count={dateRange.start ? 1 : 0}
                        color="blue"
                        onClick={() => setActiveDrawer('date')}
                        tooltip={tooltips.dateTooltip}
                        isActive={!!dateRange.start}
                    />

                    <div className="w-px h-10 bg-gray-200" />

                    <FilterButton
                        icon={<Package className="w-4 h-4" />}
                        label="Produits"
                        count={products.length}
                        color="green"
                        onClick={() => setActiveDrawer('products')}
                        tooltip={tooltips.productTooltip}
                        isActive={products.length > 0}
                    />

                    <FilterButton
                        icon={<TestTube className="w-4 h-4" />}
                        label="Laboratoires"
                        count={laboratories.length}
                        color="purple"
                        onClick={() => setActiveDrawer('laboratories')}
                        tooltip={tooltips.laboratoryTooltip}
                        isActive={laboratories.length > 0}
                    />

                    <FilterButton
                        icon={<Tag className="w-4 h-4" />}
                        label="Catégories"
                        count={categories.length}
                        color="red"
                        onClick={() => setActiveDrawer('categories')}
                        tooltip={tooltips.categoryTooltip}
                        isActive={categories.length > 0}
                    />

                    <div className="w-px h-10 bg-gray-200" />

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
                        count={exclusionsCount}
                        color="black"
                        onClick={() => setActiveDrawer('exclusions')}
                        tooltip="Exclure des produits, labos ou catégories"
                        isActive={exclusionsCount > 0}
                    />
                </div>

                <FilterSaveLoadBadges />
            </div>

            <Drawer isOpen={activeDrawer === 'pharmacy'} onClose={handleClose} title="Sélection Pharmacies" accentColor="orange">
                <PharmacyFilterPanel onClose={handleClose} />
            </Drawer>

            <Drawer isOpen={activeDrawer === 'date'} onClose={handleClose} title="Période" accentColor="blue">
                <DateFilterPanel onClose={handleClose} />
            </Drawer>

            <Drawer isOpen={activeDrawer === 'laboratories'} onClose={handleClose} title="Laboratoires & Marques" accentColor="purple">
                <LaboratoriesFilterPanel onClose={handleClose} />
            </Drawer>

            <Drawer isOpen={activeDrawer === 'categories'} onClose={handleClose} title="Catégories" accentColor="red">
                <CategoriesFilterPanel onClose={handleClose} />
            </Drawer>

            <Drawer isOpen={activeDrawer === 'products'} onClose={handleClose} title="Produits" accentColor="green">
                <ProductsFilterPanel onClose={handleClose} />
            </Drawer>

            <Drawer isOpen={activeDrawer === 'operators'} onClose={handleClose} title="Opérateur Logique" accentColor="yellow">
                <LogicalOperatorFilterPanel onClose={handleClose} />
            </Drawer>

            <Drawer isOpen={activeDrawer === 'exclusions'} onClose={handleClose} title="Exclusions" accentColor="black">
                <ExclusionsFilterPanel onClose={handleClose} />
            </Drawer>
        </>
    );
};
