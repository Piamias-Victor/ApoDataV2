// src/components/organisms/FilterBar/FilterBar.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/atoms/Badge/Badge';
import { ProductsDrawer } from '@/components/organisms/ProductsDrawer/ProductsDrawer';
import { LaboratoriesDrawer } from '@/components/organisms/LaboratoriesDrawer/LaboratoriesDrawer';
import { CategoriesDrawer } from '@/components/organisms/CategoriesDrawer/CategoriesDrawer';
import { PharmacyDrawer } from '@/components/organisms/PharmacyDrawer/PharmacyDrawer';
import { DateDrawer } from '@/components/organisms/DateDrawer/DateDrawer';

import { Package, TestTube, Tag, Building, Calendar } from 'lucide-react';

type DrawerType = 'products' | 'laboratories' | 'categories' | 'pharmacy' | 'date' | null;

interface FilterCounts {
  products: number;
  laboratories: number;
  categories: number;
  pharmacy: number;
  date: number;
}

interface FilterButton {
  readonly id: DrawerType;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly adminOnly: boolean;
}

interface FilterBarProps {
  readonly className?: string;
}

/**
 * FilterBar Component - Barre de filtres sticky avec drawers
 * 
 * Position sticky sous le header avec animations synchronisées
 * Un seul drawer ouvert à la fois, badges de comptage
 */
export const FilterBar: React.FC<FilterBarProps> = ({ className = '' }) => {
  const { data: session } = useSession();
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const [filterCounts, setFilterCounts] = useState<FilterCounts>({
    products: 0,
    laboratories: 0,
    categories: 0,
    pharmacy: 0,
    date: 0,
  });

  const filterButtons: FilterButton[] = [
    { id: 'products', label: 'Produits', icon: <Package className="w-full h-full" />, adminOnly: false },
    { id: 'laboratories', label: 'Laboratoires', icon: <TestTube className="w-full h-full" />, adminOnly: false },
    { id: 'categories', label: 'Catégories', icon: <Tag className="w-full h-full" />, adminOnly: false },
    { id: 'pharmacy', label: 'Pharmacie', icon: <Building className="w-full h-full" />, adminOnly: true },
    { id: 'date', label: 'Date', icon: <Calendar className="w-full h-full" />, adminOnly: false },
  ];

  const handleFilterClick = (filterId: DrawerType): void => {
    if (activeDrawer === filterId) {
      setActiveDrawer(null);
    } else {
      setActiveDrawer(filterId);
    }
  };

  const handleDrawerClose = (): void => {
    setActiveDrawer(null);
  };

  const updateFilterCount = (filterType: keyof FilterCounts, count: number): void => {
    setFilterCounts(prev => ({
      ...prev,
      [filterType]: count
    }));
  };

  // Filtrer les boutons selon le rôle utilisateur
  const visibleButtons = filterButtons.filter(button => 
    !button.adminOnly || session?.user?.role === 'admin'
  );

  return (
    <>
      {/* Filter Bar */}
      <motion.div
        className={`
          fixed top-16 left-0 right-0 z-40
          bg-white/60 backdrop-blur-lg border-b border-gray-200/50
          shadow-sm transition-all duration-300
          ${className}
        `}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
      >
        <div className="container-apodata">
          <div className="flex items-center justify-between py-3">
            
            {/* Titre */}
            <div className="flex items-center space-x-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Filtres
              </h2>
            </div>

            {/* Boutons de filtres */}
            <div className="flex items-center space-x-2">
              {visibleButtons.map((button) => (
                <motion.button
                  key={button.id}
                  onClick={() => handleFilterClick(button.id)}
                  className={`
                    relative inline-flex items-center space-x-2 px-4 py-2 rounded-lg
                    text-sm font-medium transition-all duration-200 ease-in-out
                    ${activeDrawer === button.id
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-sm'
                    }
                    border border-gray-200/50 hover:border-gray-300
                    backdrop-blur-sm
                  `}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                  <span className="w-4 h-4 flex-shrink-0">
                    {button.icon}
                  </span>
                  <span>{button.label}</span>
                  
                  {filterCounts[button.id as keyof FilterCounts] > 0 && (
                    <Badge 
                      variant="primary" 
                      size="xs"
                      className="ml-1"
                    >
                      {filterCounts[button.id as keyof FilterCounts]}
                    </Badge>
                  )}
                </motion.button>
              ))}
            </div>

          </div>
        </div>
      </motion.div>

      {/* Drawers */}
      <AnimatePresence mode="wait">
        {activeDrawer === 'products' && (
          <ProductsDrawer
            isOpen={true}
            onClose={handleDrawerClose}
            onCountChange={(count: number) => updateFilterCount('products', count)}
          />
        )}
        
        {activeDrawer === 'laboratories' && (
          <LaboratoriesDrawer
            isOpen={true}
            onClose={handleDrawerClose}
            onCountChange={(count: number) => updateFilterCount('laboratories', count)}
          />
        )}
        
        {activeDrawer === 'categories' && (
          <CategoriesDrawer
            isOpen={true}
            onClose={handleDrawerClose}
            onCountChange={(count: number) => updateFilterCount('categories', count)}
          />
        )}
        
        {activeDrawer === 'pharmacy' && session?.user?.role === 'admin' && (
          <PharmacyDrawer
            isOpen={true}
            onClose={handleDrawerClose}
            onCountChange={(count: number) => updateFilterCount('pharmacy', count)}
          />
        )}
        
        {activeDrawer === 'date' && (
          <DateDrawer
            isOpen={true}
            onClose={handleDrawerClose}
            onCountChange={(count: number) => updateFilterCount('date', count)}
          />
        )}
      </AnimatePresence>
    </>
  );
};