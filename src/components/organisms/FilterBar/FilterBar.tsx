// src/components/organisms/FilterBar/FilterBar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, TestTube, Tag } from 'lucide-react';
import { Drawer } from '@/components/molecules/Drawer/Drawer';
import { PharmacyFilterPanel } from '../FilterPanel/PharmacyFilterPanel';
import { DateFilterPanel } from '../FilterPanel/DateFilterPanel';
import { LaboratoriesFilterPanel } from '../FilterPanel/LaboratoriesFilterPanel';
import { CategoriesFilterPanel } from '../FilterPanel/CategoriesFilterPanel';
import { useFilterStore } from '@/stores/useFilterStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const FilterBar: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeDrawer, setActiveDrawer] = useState<'pharmacy' | 'date' | 'laboratories' | 'categories' | null>(null);
    const { pharmacies, dateRange, laboratories, categories } = useFilterStore();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleClose = () => setActiveDrawer(null);

    const formatDateRange = (dateRange: { start: string | null; end: string | null }) => {
        if (!dateRange.start) return 'Période';
        try {
            const start = format(new Date(dateRange.start), 'MMM yyyy', { locale: fr });
            const end = dateRange.end ? format(new Date(dateRange.end), 'MMM yyyy', { locale: fr }) : 'Aujourd\'hui';
            return `${start} - ${end}`;
        } catch { return 'Période'; }
    };

    return (
        <>
            <div
                className={`
                    sticky top-4 z-40 transition-all duration-300 mx-auto max-w-fit
                    ${isScrolled ? 'translate-y-0' : 'translate-y-0'}
                `}
            >
                <div className="flex items-center gap-3 px-2 py-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 ring-1 ring-black/5">

                    {/* Pharmacy Filter */}
                    <button
                        onClick={() => setActiveDrawer('pharmacy')}
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                    >
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600">
                                {pharmacies.length > 0 ? pharmacies.length : 'All'}
                            </div>
                        </div>
                        <div className="flex flex-col items-start leading-tight">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pharmacies</span>
                            <span className="text-sm font-bold text-gray-900">
                                {pharmacies.length > 0
                                    ? (pharmacies.length === 1 ? pharmacies[0].name : 'Auswahl diff.')
                                    : 'Toutes les pharmacies'}
                            </span>
                        </div>
                    </button>

                    {/* Separator */}
                    <div className="w-px h-8 bg-gray-200 mx-1" />

                    {/* Date Filter */}
                    <button
                        onClick={() => setActiveDrawer('date')}
                        className={`
                             flex items-center gap-2 px-4 py-2 rounded-xl border transition-all
                             bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-gray-600
                         `}
                    >
                        <Calendar className="w-4 h-4" />
                        <span className="font-bold text-gray-900">{formatDateRange(dateRange)}</span>
                    </button>

                    {/* Laboratories Filter */}
                    <button
                        onClick={() => setActiveDrawer('laboratories')}
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
                    >
                        <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                            <TestTube className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Laboratoires</span>
                            <span className="font-bold text-gray-900">
                                {laboratories.length > 0 ? `${laboratories.length} sélectionné(s)` : 'Tous'}
                            </span>
                        </div>
                    </button>

                    {/* Categories Filter (NEW) */}
                    <button
                        onClick={() => setActiveDrawer('categories')}
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-all group"
                    >
                        <div className="p-1.5 bg-green-50 text-green-600 rounded-lg group-hover:scale-110 transition-transform">
                            <Tag className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Catégories</span>
                            <span className="font-bold text-gray-900">
                                {categories.length > 0 ? `${categories.length} sélectionnée(s)` : 'Toutes'}
                            </span>
                        </div>
                    </button>

                    {/* Separator */}
                    <div className="w-px h-8 bg-gray-200 mx-1" />

                    {/* More Filters (Placeholder) */}
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                        <span className="text-xs font-semibold">Plus +</span>
                    </button>
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
        </>
    );
};
