// src/components/organisms/FilterBar/FilterBar.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/atoms/Badge/Badge';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { ProductsDrawer } from '@/components/organisms/ProductsDrawer/ProductsDrawer';
import { LaboratoriesDrawer } from '@/components/organisms/LaboratoriesDrawer/LaboratoriesDrawer';
import { CategoriesDrawer } from '@/components/organisms/CategoriesDrawer/CategoriesDrawer';
import { PharmacyDrawer } from '@/components/organisms/PharmacyDrawer/PharmacyDrawer';
import { DateDrawer } from '@/components/organisms/DateDrawer/DateDrawer';

import { Package, TestTube, Tag, Building, Calendar } from 'lucide-react';
import { usePathname } from 'next/navigation';

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
  readonly hiddenRoutes?: string[]; // Routes où ce bouton doit être caché
}

interface FilterBarProps {
  readonly className?: string;
}

/**
 * FilterBar Component - CORRIGÉ pour éviter les boucles infinies
 * 
 * Corrections :
 * - Initialisation et subscription séparées
 * - Debounce sur les mises à jour store
 * - Guards pour éviter les updates redondantes
 * - Une seule souscription avec cleanup
 * - Filtrage par route (cacher certains boutons selon la page)
 */
export const FilterBar: React.FC<FilterBarProps> = ({ className = '' }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const [filterCounts, setFilterCounts] = useState<FilterCounts>({
    products: 0,
    laboratories: 0,
    categories: 0,
    pharmacy: 0,
    date: 0,
  });

  // Ref pour éviter les mises à jour redondantes
  const lastCountsRef = useRef<FilterCounts>({
    products: 0,
    laboratories: 0,
    categories: 0,
    pharmacy: 0,
    date: 0,
  });

  // UNIQUE useEffect pour initialisation + subscription avec debounce
  useEffect(() => {
    console.log('🔧 [FilterBar] Initializing store subscription');

    // Fonction pour calculer les counts depuis le store
    const calculateCounts = (state: any): FilterCounts => {
      const analysisCount = state.analysisDateRange.start && state.analysisDateRange.end ? 1 : 0;
      const comparisonCount = state.comparisonDateRange.start && state.comparisonDateRange.end ? 1 : 0;
      
      return {
        products: state.products.length,
        laboratories: state.laboratories.length,
        categories: state.categories.length,
        pharmacy: state.pharmacy.length,
        date: analysisCount + comparisonCount,
      };
    };

    // Initialisation immédiate
    const store = useFiltersStore.getState();
    const initialCounts = calculateCounts(store);
    
    console.log('📊 [FilterBar] Initial counts:', initialCounts);
    setFilterCounts(initialCounts);
    lastCountsRef.current = initialCounts;

    // Subscription avec debounce pour éviter les appels multiples
    let timeoutId: NodeJS.Timeout | null = null;
    
    const unsubscribe = useFiltersStore.subscribe((state) => {
      // Clear timeout précédent
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Debounce de 50ms
      timeoutId = setTimeout(() => {
        const newCounts = calculateCounts(state);
        
        // Guard : vérifier si les counts ont vraiment changé
        const hasChanged = Object.keys(newCounts).some(key => 
          newCounts[key as keyof FilterCounts] !== lastCountsRef.current[key as keyof FilterCounts]
        );

        if (hasChanged) {
          console.log('📊 [FilterBar] Counts updated:', newCounts);
          setFilterCounts(newCounts);
          lastCountsRef.current = newCounts;
        }
      }, 50);
    });

    // Cleanup function
    return () => {
      console.log('🧹 [FilterBar] Cleaning up subscription');
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      unsubscribe();
    };
  }, []); // Pas de dépendances pour éviter les re-souscriptions

  const filterButtons: FilterButton[] = [
    { 
      id: 'products', 
      label: 'Produits', 
      icon: <Package className="w-full h-full" />, 
      adminOnly: false,
      hiddenRoutes: ['/comparaisons'] 
    },
    { 
      id: 'laboratories', 
      label: 'Laboratoires', 
      icon: <TestTube className="w-full h-full" />, 
      adminOnly: false,
      hiddenRoutes: ['/comparaisons'] 
    },
    { 
      id: 'categories', 
      label: 'Catégories', 
      icon: <Tag className="w-full h-full" />, 
      adminOnly: false,
      hiddenRoutes: ['/comparaisons'] 
    },
    { 
      id: 'pharmacy', 
      label: 'Pharmacies', 
      icon: <Building className="w-full h-full" />, 
      adminOnly: true 
    },
    { 
      id: 'date', 
      label: 'Date', 
      icon: <Calendar className="w-full h-full" />, 
      adminOnly: false 
    },
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

  const handleClearAllFilters = (): void => {
    console.log('🗑️ [FilterBar] Clearing all filters');
    const clearAllFilters = useFiltersStore.getState().clearAllFilters;
    clearAllFilters();
    
    // Reset local counts immédiatement (sera synchronisé par la subscription)
    const resetCounts = {
      products: 0,
      laboratories: 0,
      categories: 0,
      pharmacy: 0,
      date: 2, // Analysis dates restent (obligatoires)
    };
    
    setFilterCounts(resetCounts);
    lastCountsRef.current = resetCounts;
    setActiveDrawer(null);
  };

  // updateFilterCount avec guard contre les mises à jour redondantes
  const updateFilterCount = useCallback((filterType: keyof FilterCounts, count: number) => {
    console.log(`🔄 [FilterBar] Manual count update: ${filterType} = ${count}`);
    
    setFilterCounts(prev => {
      // Guard : éviter les mises à jour redondantes
      if (prev[filterType] === count) {
        return prev;
      }
      
      const newCounts = {
        ...prev,
        [filterType]: count
      };
      
      lastCountsRef.current = newCounts;
      return newCounts;
    });
  }, []);

  // Filtrer les boutons selon le rôle utilisateur ET la route actuelle
  const visibleButtons = filterButtons.filter(button => {
    // Filtrage par rôle admin
    if (button.adminOnly && session?.user?.role !== 'admin') {
      return false;
    }
    
    // Filtrage par route (nouveau)
    if (button.hiddenRoutes?.includes(pathname)) {
      return false;
    }
    
    return true;
  });

  // Check if any filters are active
  const hasActiveFilters = Object.values(filterCounts).some(count => count > 0);

  return (
    <>
      {/* Filter Bar */}
      <motion.div
        className={`
          fixed top-16 left-0 right-0 z-40
          bg-white/60 backdrop-blur-lg border-b border-gray-200/50
          shadow-sm transition-all duration-300 ease-in-out
          ${className}
        `}
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="container-apodata">
          <div className="flex items-center justify-between py-3">
            
            {/* Boutons filtres */}
            <div className="flex items-center space-x-3">
              {visibleButtons.map(button => (
                <motion.button
                  key={button.id}
                  onClick={() => handleFilterClick(button.id)}
                  className={`
                    relative group flex items-center space-x-2 px-4 py-2.5 
                    rounded-xl border transition-all duration-300 ease-in-out
                    ${activeDrawer === button.id
                      ? 'bg-blue-100 border-blue-300 text-blue-700 shadow-sm'
                      : 'bg-white/70 border-gray-200/70 text-gray-600 hover:bg-white hover:border-gray-300 hover:text-gray-700'
                    }
                    backdrop-blur-sm hover:shadow-sm
                  `}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <div className="w-4 h-4 flex-shrink-0">
                    {button.icon}
                  </div>
                  <span className="font-medium text-sm">
                    {button.label}
                  </span>
                  
                  {/* Badge compte */}
                  <AnimatePresence>
                    {filterCounts[button.id as keyof FilterCounts] > 0 && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                      >
                        <Badge 
                          variant="primary"
                          size="sm"
                          className="ml-1 min-w-[20px] h-5 text-xs flex items-center justify-center"
                        >
                          {filterCounts[button.id as keyof FilterCounts]}
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Badge total filtres */}
              <AnimatePresence>
                {hasActiveFilters && (
                  <motion.div
                    className="text-sm text-gray-500"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    {Object.values(filterCounts).reduce((sum, count) => sum + count, 0)} filtres actifs
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bouton effacer tout */}
              <AnimatePresence>
                {hasActiveFilters && (
                  <motion.button
                    onClick={handleClearAllFilters}
                    className="
                      inline-flex items-center px-3 py-2 rounded-lg
                      text-sm font-medium text-red-600 bg-red-50
                      hover:bg-red-100 hover:text-red-700
                      border border-red-200 hover:border-red-300
                      transition-all duration-200 ease-in-out
                      backdrop-blur-sm
                    "
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    Effacer tout
                  </motion.button>
                )}
              </AnimatePresence>
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
            onCountChange={updateFilterCount.bind(null, 'pharmacy')}
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