// src/components/organisms/FilterBar/FilterBar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, TestTube, Tag, Package, Building2, Settings } from 'lucide-react';
import { Drawer } from '@/components/molecules/Drawer/Drawer';
import { PharmacyFilterPanel } from '../FilterPanel/PharmacyFilterPanel';
import { DateFilterPanel } from '../FilterPanel/DateFilterPanel';
import { LaboratoriesFilterPanel } from '../FilterPanel/LaboratoriesFilterPanel';
import { CategoriesFilterPanel } from '../FilterPanel/CategoriesFilterPanel';
import { ProductsFilterPanel } from '../FilterPanel/ProductsFilterPanel';
import { LogicalOperatorFilterPanel } from '../FilterPanel/LogicalOperatorFilterPanel';
import { useFilterStore } from '@/stores/useFilterStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FilterButtonProps {
    icon: React.ReactNode;
    label: string;
    count: number;
    color: 'orange' | 'blue' | 'purple' | 'red' | 'green' | 'yellow';
    onClick: () => void;
    tooltip?: string;
    isActive: boolean;
}

const FilterButton: React.FC<FilterButtonProps> = ({ icon, label, count, color, onClick, tooltip, isActive }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const colorClasses = {
        orange: {
            bg: 'bg-orange-50',
            text: 'text-orange-600',
            border: 'border-orange-300',
            hover: 'hover:border-orange-400 hover:bg-orange-50/50',
            activeBorder: 'border-orange-500',
            activeGlow: 'shadow-orange-200'
        },
        blue: {
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            border: 'border-blue-300',
            hover: 'hover:border-blue-400 hover:bg-blue-50/50',
            activeBorder: 'border-blue-500',
            activeGlow: 'shadow-blue-200'
        },
        purple: {
            bg: 'bg-purple-50',
            text: 'text-purple-600',
            border: 'border-purple-300',
            hover: 'hover:border-purple-400 hover:bg-purple-50/50',
            activeBorder: 'border-purple-500',
            activeGlow: 'shadow-purple-200'
        },
        red: {
            bg: 'bg-red-50',
            text: 'text-red-600',
            border: 'border-red-300',
            hover: 'hover:border-red-400 hover:bg-red-50/50',
            activeBorder: 'border-red-500',
            activeGlow: 'shadow-red-200'
        },
        green: {
            bg: 'bg-green-50',
            text: 'text-green-600',
            border: 'border-green-300',
            hover: 'hover:border-green-400 hover:bg-green-50/50',
            activeBorder: 'border-green-500',
            activeGlow: 'shadow-green-200'
        },
        yellow: {
            bg: 'bg-yellow-50',
            text: 'text-yellow-600',
            border: 'border-yellow-300',
            hover: 'hover:border-yellow-400 hover:bg-yellow-50/50',
            activeBorder: 'border-yellow-500',
            activeGlow: 'shadow-yellow-200'
        }
    };

    const colors = colorClasses[color];

    return (
        <div className="relative">
            <button
                onClick={onClick}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`
                    flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-xl border-2 transition-all group
                    ${isActive ? `${colors.activeBorder} shadow-lg ${colors.activeGlow}` : `border-gray-200 ${colors.hover}`}
                `}
            >
                <div className={`p-1.5 ${colors.bg} ${colors.text} rounded-lg group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                    <span className="text-sm font-bold text-gray-900">
                        {count > 0 ? `${count} sélectionné${count > 1 ? 's' : ''}` : 'Tous'}
                    </span>
                </div>
            </button>

            {/* Tooltip */}
            {showTooltip && tooltip && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl max-w-xs">
                        <div className="font-semibold mb-1">{label}</div>
                        <div className="text-gray-300">{tooltip}</div>
                    </div>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
            )}
        </div>
    );
};

export const FilterBar: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeDrawer, setActiveDrawer] = useState<'pharmacy' | 'date' | 'laboratories' | 'categories' | 'products' | 'operators' | null>(null);
    const { pharmacies, dateRange, laboratories, categories, products } = useFilterStore();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleClose = () => setActiveDrawer(null);

    const formatDateRange = (dateRange: { start: string | null; end: string | null }) => {
        if (!dateRange.start) return 'Aucune période';
        try {
            const start = format(new Date(dateRange.start), 'MMM yyyy', { locale: fr });
            const end = dateRange.end ? format(new Date(dateRange.end), 'MMM yyyy', { locale: fr }) : 'Aujourd\'hui';
            return `${start} - ${end}`;
        } catch { return 'Période invalide'; }
    };

    const getPharmacyTooltip = () => {
        if (pharmacies.length === 0) return 'Toutes les pharmacies';
        if (pharmacies.length === 1) return pharmacies[0]?.name || '';
        return `${pharmacies.slice(0, 3).map(p => p?.name || '').filter(Boolean).join(', ')}${pharmacies.length > 3 ? '...' : ''}`;
    };

    const getLabTooltip = () => {
        if (laboratories.length === 0) return 'Tous les laboratoires';
        if (laboratories.length === 1) return laboratories[0]?.name || '';
        return `${laboratories.slice(0, 3).map(l => l?.name || '').filter(Boolean).join(', ')}${laboratories.length > 3 ? '...' : ''}`;
    };

    const getCategoryTooltip = () => {
        if (categories.length === 0) return 'Toutes les catégories';
        if (categories.length === 1) return categories[0]?.name || '';
        return `${categories.slice(0, 3).map(c => c?.name || '').filter(Boolean).join(', ')}${categories.length > 3 ? '...' : ''}`;
    };

    const getProductTooltip = () => {
        if (products.length === 0) return 'Tous les produits';
        if (products.length === 1) return products[0]?.name || '';
        return `${products.slice(0, 3).map(p => p?.name || '').filter(Boolean).join(', ')}${products.length > 3 ? '...' : ''}`;
    };

    return (
        <>
            <div
                className={`
                    sticky top-0 z-40 transition-all duration-300 mx-auto max-w-fit pt-4
                    ${isScrolled ? 'translate-y-0' : 'translate-y-0'}
                `}
            >
                <div className="flex items-center gap-3 px-3 py-2.5 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 ring-1 ring-black/5">

                    <FilterButton
                        icon={<Building2 className="w-4 h-4" />}
                        label="Pharmacies"
                        count={pharmacies.length}
                        color="orange"
                        onClick={() => setActiveDrawer('pharmacy')}
                        tooltip={getPharmacyTooltip()}
                        isActive={pharmacies.length > 0}
                    />

                    <div className="w-px h-10 bg-gray-200" />

                    <FilterButton
                        icon={<Calendar className="w-4 h-4" />}
                        label="Période"
                        count={dateRange.start ? 1 : 0}
                        color="blue"
                        onClick={() => setActiveDrawer('date')}
                        tooltip={formatDateRange(dateRange)}
                        isActive={!!dateRange.start}
                    />

                    <div className="w-px h-10 bg-gray-200" />

                    <FilterButton
                        icon={<TestTube className="w-4 h-4" />}
                        label="Laboratoires"
                        count={laboratories.length}
                        color="purple"
                        onClick={() => setActiveDrawer('laboratories')}
                        tooltip={getLabTooltip()}
                        isActive={laboratories.length > 0}
                    />

                    <FilterButton
                        icon={<Tag className="w-4 h-4" />}
                        label="Catégories"
                        count={categories.length}
                        color="red"
                        onClick={() => setActiveDrawer('categories')}
                        tooltip={getCategoryTooltip()}
                        isActive={categories.length > 0}
                    />

                    <FilterButton
                        icon={<Package className="w-4 h-4" />}
                        label="Produits"
                        count={products.length}
                        color="green"
                        onClick={() => setActiveDrawer('products')}
                        tooltip={getProductTooltip()}
                        isActive={products.length > 0}
                    />

                    <FilterButton
                        icon={<Settings className="w-4 h-4" />}
                        label="Opérateur Logique"
                        count={0}
                        color="yellow"
                        onClick={() => setActiveDrawer('operators')}
                        tooltip="Configurez comment combiner vos filtres (ET/OU)"
                        isActive={false}
                    />
                </div>
            </div>

            <Drawer
                isOpen={activeDrawer === 'pharmacy'}
                onClose={handleClose}
                title="Sélection Pharmacies"
                accentColor="orange"
            >
                <PharmacyFilterPanel onClose={handleClose} />
            </Drawer>

            <Drawer
                isOpen={activeDrawer === 'date'}
                onClose={handleClose}
                title="Période"
                accentColor="blue"
            >
                <DateFilterPanel onClose={handleClose} />
            </Drawer>

            <Drawer
                isOpen={activeDrawer === 'laboratories'}
                onClose={handleClose}
                title="Laboratoires & Marques"
                accentColor="purple"
            >
                <LaboratoriesFilterPanel onClose={handleClose} />
            </Drawer>

            <Drawer
                isOpen={activeDrawer === 'categories'}
                onClose={handleClose}
                title="Catégories"
                accentColor="red"
            >
                <CategoriesFilterPanel onClose={handleClose} />
            </Drawer>

            <Drawer
                isOpen={activeDrawer === 'products'}
                onClose={handleClose}
                title="Produits"
                accentColor="green"
            >
                <ProductsFilterPanel onClose={handleClose} />
            </Drawer>

            <Drawer
                isOpen={activeDrawer === 'operators'}
                onClose={handleClose}
                title="Opérateur Logique"
                accentColor="yellow"
            >
                <LogicalOperatorFilterPanel onClose={handleClose} />
            </Drawer>
        </>
    );
};
