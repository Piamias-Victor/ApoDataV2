'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/atoms/Badge/Badge';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { ProductsDrawer } from '@/components/organisms/ProductsDrawer/ProductsDrawer';
import { LaboratoriesDrawer } from '@/components/organisms/LaboratoriesDrawer/LaboratoriesDrawer';
import { CategoriesDrawer } from '@/components/organisms/CategoriesDrawer/CategoriesDrawer';
import { PharmacyDrawer } from '@/components/organisms/PharmacyDrawer/PharmacyDrawer';
import { DateDrawer } from '@/components/organisms/DateDrawer/DateDrawer';
import { 
  Package, 
  TestTube, 
  Tag, 
  Building, 
  Calendar,
  X,
  Filter,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { GenericFilterDrawer } from '../GenericFilterDrawer/GenericFilterDrawer';

type DrawerType = 'products' | 'laboratories' | 'categories' | 'pharmacy' | 'date' | 'filter' | null;

interface FilterChipProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
  readonly onRemove?: (() => void) | undefined;
  readonly color: 'blue' | 'green' | 'purple' | 'pink' | 'orange';
  readonly tooltip?: string;
}

const FilterChip: React.FC<FilterChipProps> = ({ 
  icon, 
  label, 
  value, 
  onRemove,
  color,
  tooltip
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    pink: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={{ duration: 0.2 }}
      className="relative group"
    >
      <div className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        border transition-all duration-200
        ${colorClasses[color]}
      `}>
        <span className="w-4 h-4 flex-shrink-0">
          {icon}
        </span>
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs font-semibold">{value}</span>
        
        {onRemove && (
          <button
            onClick={onRemove}
            className="
              ml-1 -mr-1 p-0.5 rounded-full
              hover:bg-white/50 transition-colors
            "
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {tooltip && (
        <div className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          opacity-0 group-hover:opacity-100 pointer-events-none
          transition-opacity duration-200 z-50
        ">
          <div className="
            bg-gray-900 text-white text-xs rounded-lg
            px-3 py-2 max-w-xs whitespace-pre-wrap
          ">
            {tooltip}
            <div className="
              absolute top-full left-1/2 -translate-x-1/2 -mt-1
              border-4 border-transparent border-t-gray-900
            " />
          </div>
        </div>
      )}
    </motion.div>
  );
};

interface FilterButton {
  readonly id: DrawerType;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly adminOnly: boolean;
  readonly hiddenRoutes?: string[];
  readonly visibleOnlyRoutes?: string[];
}

export const FilterBar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const [showActiveFilters] = useState(true);
  
  const {
    selectedProducts,
    selectedLaboratories,
    selectedCategories,
    selectedPharmacies,
    analysisDateRange,
    clearProductFilters,
    clearLaboratoryFilters,
    clearCategoryFilters,
    clearPharmacyFilters,
    clearAllFilters,
    isPharmacyLocked
  } = useFiltersStore();

  // Formater les dates
  const formatDateRange = useMemo(() => {
    if (!analysisDateRange?.start || !analysisDateRange?.end) return null;
    
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}`;
    };

    return `${formatDate(analysisDateRange.start)} - ${formatDate(analysisDateRange.end)}`;
  }, [analysisDateRange]);

  // Formater les laboratoires
  const labInfo = useMemo(() => {
    if (!selectedLaboratories || selectedLaboratories.length === 0) return null;
    
    if (selectedLaboratories.length === 1) {
      const lab = selectedLaboratories[0];
      return {
        value: lab?.name || 'Laboratoire',
        tooltip: `${lab?.productCount || 0} produits`
      };
    }
    
    return {
      value: `${selectedLaboratories.length} sélectionnés`,
      tooltip: selectedLaboratories
        .map(lab => `• ${lab?.name || 'Inconnu'} (${lab?.productCount || 0} produits)`)
        .join('\n')
    };
  }, [selectedLaboratories]);

  // Formater les produits
  const productInfo = useMemo(() => {
    if (!selectedProducts || selectedProducts.length === 0) return null;
    
    if (selectedProducts.length === 1) {
      const product = selectedProducts[0];
      return {
        value: product?.name || 'Produit',
        tooltip: product?.code || ''
      };
    }
    
    const displayCount = 3;
    const displayed = selectedProducts.slice(0, displayCount);
    const remaining = selectedProducts.length - displayCount;
    
    return {
      value: `${selectedProducts.length} produits`,
      tooltip: [
        ...displayed.map(p => `• ${p?.name || 'Produit'}`),
        remaining > 0 ? `... et ${remaining} autres` : ''
      ].filter(Boolean).join('\n')
    };
  }, [selectedProducts]);

  // Formater les catégories
  const categoryInfo = useMemo(() => {
    if (!selectedCategories || selectedCategories.length === 0) return null;
    
    if (selectedCategories.length === 1) {
      const category = selectedCategories[0];
      return {
        value: category?.name || 'Catégorie',
        tooltip: `${category?.productCount || 0} produits`
      };
    }
    
    return {
      value: `${selectedCategories.length} catégories`,
      tooltip: selectedCategories
        .map(cat => `• ${cat?.name || 'Catégorie'} (${cat?.productCount || 0} produits)`)
        .join('\n')
    };
  }, [selectedCategories]);

  // Formater les pharmacies
  const pharmacyInfo = useMemo(() => {
    if (!selectedPharmacies || selectedPharmacies.length === 0) return null;
    
    if (selectedPharmacies.length === 1) {
      const pharmacy = selectedPharmacies[0];
      return {
        value: pharmacy?.name || 'Pharmacie',
        tooltip: pharmacy ? `${pharmacy.address || ''}\nCA: ${pharmacy.ca?.toLocaleString() || 0}€` : ''
      };
    }
    
    return {
      value: `${selectedPharmacies.length} pharmacies`,
      tooltip: selectedPharmacies
        .map(p => `• ${p?.name || 'Pharmacie'}`)
        .join('\n')
    };
  }, [selectedPharmacies]);

  const hasActiveFilters = !!(
    (selectedProducts && selectedProducts.length > 0) ||
    (selectedLaboratories && selectedLaboratories.length > 0) ||
    (selectedCategories && selectedCategories.length > 0) ||
    (selectedPharmacies && selectedPharmacies.length > 0)
  );

  const filterButtons: FilterButton[] = [
    { 
      id: 'products', 
      label: 'Produits', 
      icon: <Package className="w-full h-full" />, 
      adminOnly: false,
      hiddenRoutes: ['/comparaisons', '/generique'] 
    },
    { 
      id: 'laboratories', 
      label: 'Laboratoires', 
      icon: <TestTube className="w-full h-full" />, 
      adminOnly: false,
      hiddenRoutes: ['/comparaisons', '/generique'] 
    },
    { 
      id: 'categories', 
      label: 'Catégories', 
      icon: <Tag className="w-full h-full" />, 
      adminOnly: false,
      hiddenRoutes: ['/comparaisons', '/generique'] 
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
    { 
      id: 'filter', 
      label: 'Filtre', 
      icon: <Filter className="w-full h-full" />, 
      adminOnly: false,
      visibleOnlyRoutes: ['/generique']
    },
  ];

  const visibleButtons = filterButtons.filter(button => {
    if (button.adminOnly && session?.user?.role !== 'admin') {
      return false;
    }
    if (button.hiddenRoutes?.includes(pathname)) {
      return false;
    }
    if (button.visibleOnlyRoutes && !button.visibleOnlyRoutes.includes(pathname)) {
      return false;
    }
    return true;
  });

  const handleFilterClick = (filterId: DrawerType): void => {
    setActiveDrawer(activeDrawer === filterId ? null : filterId);
  };

  const handleDrawerClose = (): void => {
    setActiveDrawer(null);
  };

  // Calculer les counts pour les badges
  const filterCounts = {
    products: selectedProducts?.length || 0,
    laboratories: selectedLaboratories?.length || 0,
    categories: selectedCategories?.length || 0,
    pharmacy: selectedPharmacies?.length || 0,
    date: (analysisDateRange?.start && analysisDateRange?.end) ? 1 : 0,
    filter: 0
  };

  return (
    <>
      {/* Barre principale avec boutons */}
      <motion.div
        className="
          fixed top-16 left-0 right-0 z-40
          bg-white/60 backdrop-blur-lg border-b border-gray-200/50
          shadow-sm transition-all duration-300
        "
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="container-apodata">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              {visibleButtons.map(button => (
                <motion.button
                  key={button.id}
                  onClick={() => handleFilterClick(button.id)}
                  className={`
                    relative flex items-center space-x-2 px-4 py-2.5 
                    rounded-xl border transition-all duration-300
                    ${activeDrawer === button.id
                      ? 'bg-blue-100 border-blue-300 text-blue-700 shadow-sm'
                      : 'bg-white/70 border-gray-200/70 text-gray-600 hover:bg-white hover:border-gray-300'
                    }
                  `}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-4 h-4">{button.icon}</div>
                  <span className="font-medium text-sm">{button.label}</span>
                  
                  <AnimatePresence>
                    {filterCounts[button.id as keyof typeof filterCounts] > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Badge variant="primary" size="sm">
                          {filterCounts[button.id as keyof typeof filterCounts]}
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>

            {/* Toggle pour afficher/masquer les filtres actifs */}

          </div>

          {/* Ligne des filtres actifs */}
          <AnimatePresence>
            {showActiveFilters && (hasActiveFilters || formatDateRange) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 pb-3 px-1">
                  <span className="text-xs font-medium text-gray-500 mr-2">Actifs:</span>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {formatDateRange && (
                      <FilterChip
                        icon={<Calendar className="w-3.5 h-3.5" />}
                        label="Période"
                        value={formatDateRange}
                        color="blue"
                      />
                    )}

                    {pharmacyInfo && (
                      <FilterChip
                        key="pharmacy"
                        icon={<Building className="w-3.5 h-3.5" />}
                        label="Pharmacie"
                        value={pharmacyInfo.value}
                        tooltip={pharmacyInfo.tooltip}
                        onRemove={!isPharmacyLocked ? clearPharmacyFilters : undefined}
                        color="green"
                      />
                    )}

                    {labInfo && (
                      <FilterChip
                        key="lab"
                        icon={<TestTube className="w-3.5 h-3.5" />}
                        label="Labo"
                        value={labInfo.value}
                        tooltip={labInfo.tooltip}
                        onRemove={clearLaboratoryFilters}
                        color="purple"
                      />
                    )}

                    {productInfo && (
                      <FilterChip
                        key="product"
                        icon={<Package className="w-3.5 h-3.5" />}
                        label="Produit"
                        value={productInfo.value}
                        tooltip={productInfo.tooltip}
                        onRemove={clearProductFilters}
                        color="pink"
                      />
                    )}

                    {categoryInfo && (
                      <FilterChip
                        key="category"
                        icon={<Tag className="w-3.5 h-3.5" />}
                        label="Catégorie"
                        value={categoryInfo.value}
                        tooltip={categoryInfo.tooltip}
                        onRemove={clearCategoryFilters}
                        color="orange"
                      />
                    )}
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {Object.values(filterCounts).reduce((a, b) => a + b, 0)} filtres
                    </span>
                    <button
                      onClick={clearAllFilters}
                      className="
                        text-xs text-red-600 hover:text-red-700
                        px-2 py-1 rounded hover:bg-red-50
                        transition-colors
                      "
                    >
                      Tout effacer
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Drawers */}
      <AnimatePresence mode="wait">
        {activeDrawer === 'products' && (
          <ProductsDrawer
            isOpen={true}
            onClose={handleDrawerClose}
            onCountChange={() => {}}
          />
        )}
        
        {activeDrawer === 'laboratories' && (
          <LaboratoriesDrawer
            isOpen={true}
            onClose={handleDrawerClose}
            onCountChange={() => {}}
          />
        )}
        
        {activeDrawer === 'categories' && (
          <CategoriesDrawer
            isOpen={true}
            onClose={handleDrawerClose}
            onCountChange={() => {}}
          />
        )}
        
        {activeDrawer === 'pharmacy' && session?.user?.role === 'admin' && (
          <PharmacyDrawer
            isOpen={true}
            onClose={handleDrawerClose}
            onCountChange={() => {}}
          />
        )}
        
        {activeDrawer === 'date' && (
          <DateDrawer
            isOpen={true}
            onClose={handleDrawerClose}
            onCountChange={() => {}}
          />
        )}
        
        {activeDrawer === 'filter' && (
          <GenericFilterDrawer
            isOpen={true}
            onClose={handleDrawerClose}
            onCountChange={() => {}}
          />
        )}
      </AnimatePresence>
    </>
  );
};