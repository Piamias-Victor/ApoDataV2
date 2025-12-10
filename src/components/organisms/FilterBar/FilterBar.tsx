// src/components/organisms/FilterBar/FilterBar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Building, Calendar } from 'lucide-react';
import { Drawer } from '@/components/molecules/Drawer/Drawer';
import { PharmacyFilterPanel } from '@/components/organisms/FilterPanel/PharmacyFilterPanel';
import { DateFilterPanel } from '@/components/organisms/FilterPanel/DateFilterPanel';
import { useFilterStore } from '@/stores/useFilterStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const FilterBar: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeDrawer, setActiveDrawer] = useState<'pharmacy' | 'date' | 'product' | null>(null);
    const { pharmacies, dateRange } = useFilterStore();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleClose = () => setActiveDrawer(null);

    const formatDateButton = () => {
        if (!dateRange.start) return 'Période';
        try {
            return `${format(new Date(dateRange.start), 'MMM yyyy', { locale: fr })} - ${format(new Date(dateRange.end || new Date()), 'MMM yyyy', { locale: fr })}`;
        } catch { return 'Période'; }
    };

    return (
        <>
            <div className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-gray-200 py-3 shadow-sm' : 'bg-transparent py-4'}`}>
                <div className="container mx-auto px-4 flex items-center gap-3 overflow-x-auto no-scrollbar">

                    {/* Pharmacies Filter */}
                    <button
                        onClick={() => setActiveDrawer('pharmacy')}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all border
                            ${pharmacies.length > 0
                                ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'
                            }
                         `}
                    >
                        <Building className="w-4 h-4" />
                        <span>Pharmacies</span>
                        {pharmacies.length > 0 && (
                            <span className="ml-1 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-xs font-bold">
                                {pharmacies.length}
                            </span>
                        )}
                    </button>

                    {/* Date Filter */}
                    <button
                        onClick={() => setActiveDrawer('date')}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all border
                            ${dateRange.start
                                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'
                            }
                         `}
                    >
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateButton()}</span>
                    </button>

                    {/* Separator */}
                    <div className="w-px h-6 bg-gray-200 mx-1" />

                </div>
            </div>

            {/* Drawers */}
            <Drawer
                isOpen={activeDrawer === 'pharmacy'}
                onClose={handleClose}
                title="Pharmacies"
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
        </>
    );
};
