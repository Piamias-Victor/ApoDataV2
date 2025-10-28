// src/stores/useGenericGroupStore.ts
import { create } from 'zustand';
import type { GenericGroup } from '@/hooks/generic-groups/useGenericGroupSearch';
import type { GenericProduct, GenericLaboratory } from '@/hooks/generic-filters/useGenericFilterSearch';

interface PriceRange {
  min: number | null;
  max: number | null;
}

interface PriceFilters {
  prixFabricant: PriceRange;
  prixNetRemise: PriceRange;
  remise: PriceRange;
}

interface GenericGroupState {
  // Sources de sélection
  selectedGroups: GenericGroup[];
  selectedProducts: GenericProduct[];
  selectedLaboratories: GenericLaboratory[];
  
  // Filtres de prix
  priceFilters: PriceFilters;
  setPriceFilters: (filters: Partial<PriceFilters>) => Promise<void>;
  clearPriceFilters: () => void;
  hasPriceFilters: () => boolean;
  
  // Résultat calculé
  productCodes: string[];
  
  // Mode global
  showGlobalTop: boolean;
  setShowGlobalTop: (show: boolean) => void;
  
  // Gestion des groupes génériques
  addGroup: (group: GenericGroup) => void;
  removeGroup: (groupName: string) => void;
  isGroupSelected: (groupName: string) => boolean;
  
  // Gestion des produits individuels
  addProduct: (product: GenericProduct) => void;
  removeProduct: (code: string) => void;
  isProductSelected: (code: string) => boolean;
  
  // Gestion des laboratoires
  addLaboratory: (laboratory: GenericLaboratory) => void;
  removeLaboratory: (labName: string) => void;
  isLaboratorySelected: (labName: string) => boolean;
  
  // Gestion bulk (depuis drawer)
  addProducts: (products: GenericProduct[]) => void;
  addLaboratories: (laboratories: GenericLaboratory[]) => void;
  
  // Clear
  clearSelection: () => void;
  
  // Helper
  recalculateProductCodes: () => void;
}

const defaultPriceFilters: PriceFilters = {
  prixFabricant: { min: null, max: null },
  prixNetRemise: { min: null, max: null },
  remise: { min: null, max: null }
};

export const useGenericGroupStore = create<GenericGroupState>((set, get) => ({
  selectedGroups: [],
  selectedProducts: [],
  selectedLaboratories: [],
  productCodes: [],
  showGlobalTop: false,
  priceFilters: defaultPriceFilters,

  // ===== MODE GLOBAL =====
  setShowGlobalTop: (show) => {
    console.log('🌍 [GenericGroupStore] Setting global mode:', show);
    set({ showGlobalTop: show });
  },

  // ===== FILTRES DE PRIX =====
  setPriceFilters: async (filters) => {
    const { priceFilters } = get();
    const newPriceFilters = { ...priceFilters, ...filters };
    
    console.log('💰 [GenericGroupStore] Setting price filters:', newPriceFilters);
    
    set({ priceFilters: newPriceFilters });
    
    console.log('🔄 [GenericGroupStore] Calling recalculateProductCodes...');
    await get().recalculateProductCodes();
    console.log('✅ [GenericGroupStore] Price filters applied and codes recalculated');
  },

  clearPriceFilters: () => {
    console.log('🗑️ [GenericGroupStore] Clearing price filters');
    set({ priceFilters: defaultPriceFilters });
    get().recalculateProductCodes();
  },

  hasPriceFilters: () => {
    const { priceFilters } = get();
    return (
      priceFilters.prixFabricant.min !== null ||
      priceFilters.prixFabricant.max !== null ||
      priceFilters.prixNetRemise.min !== null ||
      priceFilters.prixNetRemise.max !== null ||
      priceFilters.remise.min !== null ||
      priceFilters.remise.max !== null
    );
  },

  // Recalculer tous les product codes
  recalculateProductCodes: async () => {
    console.log('🔄 [GenericGroupStore] === START RECALCULATE ===');
    
    const { selectedGroups, selectedProducts, selectedLaboratories, priceFilters, hasPriceFilters } = get();
    
    const hasSelections = selectedGroups.length > 0 || selectedProducts.length > 0 || selectedLaboratories.length > 0;
    
    console.log('📊 [GenericGroupStore] Current state:', {
      hasSelections,
      hasPriceFilters: hasPriceFilters(),
      groups: selectedGroups.length,
      products: selectedProducts.length,
      laboratories: selectedLaboratories.length
    });
    
    // Cas 1 : Aucune sélection ET aucun filtre prix → vide
    if (!hasSelections && !hasPriceFilters()) {
      console.log('ℹ️ [GenericGroupStore] No selections and no price filters → empty');
      set({ productCodes: [] });
      console.log('✅ [GenericGroupStore] === END RECALCULATE ===');
      return;
    }
    
    // Cas 2 : Filtres prix SEULS (sans sélections) → rechercher TOUS les génériques/référents
    if (!hasSelections && hasPriceFilters()) {
      console.log('💰 [GenericGroupStore] PRICE FILTERS ONLY MODE');
      console.log('💰 [GenericGroupStore] Fetching ALL generic/referent products from DB...');
      
      try {
        const startTime = Date.now();
        
        // Appel API spécial pour filtres prix seuls
        const response = await fetch('/api/generic-filters/price-ranges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productCodes: null, // null = chercher dans toute la base
            priceFilters
          })
        });

        const duration = Date.now() - startTime;

        if (response.ok) {
          const data = await response.json();
          const filteredCodes = data.productCodes;
          
          console.log('✅ [GenericGroupStore] PRICE FILTERS ONLY SUCCESS:', {
            duration: `${duration}ms`,
            totalFound: filteredCodes.length
          });
          
          set({ productCodes: filteredCodes });
          console.log('✅ [GenericGroupStore] === END RECALCULATE ===');
          return;
        } else {
          console.error('❌ [GenericGroupStore] API ERROR:', {
            status: response.status,
            statusText: response.statusText
          });
          set({ productCodes: [] });
          console.log('✅ [GenericGroupStore] === END RECALCULATE ===');
          return;
        }
      } catch (error) {
        console.error('❌ [GenericGroupStore] API FETCH ERROR:', error);
        set({ productCodes: [] });
        console.log('✅ [GenericGroupStore] === END RECALCULATE ===');
        return;
      }
    }
    
    // Cas 3 : Sélections avec ou sans filtres prix
    console.log('📦 [GenericGroupStore] Collecting base codes from selections...');
    
    // Étape 1 : Collecter tous les codes de base
    const baseCodes = new Set<string>();
    
    selectedGroups.forEach(group => {
      group.product_codes.forEach(code => baseCodes.add(code));
    });
    
    selectedProducts.forEach(product => {
      baseCodes.add(product.code_13_ref);
    });
    
    selectedLaboratories.forEach(lab => {
      lab.product_codes.forEach(code => baseCodes.add(code));
    });

    console.log('📦 [GenericGroupStore] Base codes collected:', baseCodes.size);

    let finalCodes = Array.from(baseCodes);

    // Étape 2 : Appliquer les filtres de prix si présents (intersection)
    if (hasPriceFilters() && finalCodes.length > 0) {
      console.log('💰 [GenericGroupStore] Price filters detected, filtering base codes via API...');
      console.log('💰 [GenericGroupStore] Filters:', priceFilters);
      console.log('💰 [GenericGroupStore] Codes to filter:', finalCodes.length);
      
      try {
        const startTime = Date.now();
        
        const response = await fetch('/api/generic-filters/price-ranges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productCodes: finalCodes,
            priceFilters
          })
        });

        const duration = Date.now() - startTime;

        if (response.ok) {
          const data = await response.json();
          finalCodes = data.productCodes;
          
          console.log('✅ [GenericGroupStore] API SUCCESS:', {
            duration: `${duration}ms`,
            before: baseCodes.size,
            after: finalCodes.length,
            filtered: baseCodes.size - finalCodes.length,
            percentage: `${((finalCodes.length / baseCodes.size) * 100).toFixed(1)}%`
          });
        } else {
          console.error('❌ [GenericGroupStore] API ERROR:', {
            status: response.status,
            statusText: response.statusText
          });
        }
      } catch (error) {
        console.error('❌ [GenericGroupStore] API FETCH ERROR:', error);
      }
    } else if (hasPriceFilters() && finalCodes.length === 0) {
      console.log('⚠️ [GenericGroupStore] Price filters active but no base codes to filter');
    } else {
      console.log('ℹ️ [GenericGroupStore] No price filters, using base codes as-is');
    }
    
    console.log('🔄 [GenericGroupStore] Final result:', {
      groups: selectedGroups.length,
      products: selectedProducts.length,
      laboratories: selectedLaboratories.length,
      totalCodes: finalCodes.length,
      priceFiltersActive: hasPriceFilters()
    });
    
    set({ productCodes: finalCodes });
    
    console.log('✅ [GenericGroupStore] === END RECALCULATE ===');
  },

  // ===== GROUPES GÉNÉRIQUES =====
  addGroup: (group) => {
    const { selectedGroups, isGroupSelected } = get();
    
    if (isGroupSelected(group.generic_group)) {
      console.log('⚠️ [GenericGroupStore] Group already selected:', group.generic_group);
      return;
    }

    const newGroups = [...selectedGroups, group];

    console.log('➕ [GenericGroupStore] Added group:', {
      groupName: group.generic_group,
      productCount: group.product_codes.length,
      totalGroups: newGroups.length
    });

    set({ selectedGroups: newGroups });
    get().recalculateProductCodes();
  },

  removeGroup: (groupName) => {
    const { selectedGroups } = get();
    const newGroups = selectedGroups.filter(g => g.generic_group !== groupName);

    console.log('➖ [GenericGroupStore] Removed group:', {
      groupName,
      remainingGroups: newGroups.length
    });

    set({ selectedGroups: newGroups });
    get().recalculateProductCodes();
  },

  isGroupSelected: (groupName) => {
    return get().selectedGroups.some(g => g.generic_group === groupName);
  },

  // ===== PRODUITS INDIVIDUELS =====
  addProduct: (product) => {
    const { selectedProducts, isProductSelected } = get();
    
    if (isProductSelected(product.code_13_ref)) {
      console.log('⚠️ [GenericGroupStore] Product already selected:', product.code_13_ref);
      return;
    }

    const newProducts = [...selectedProducts, product];

    console.log('➕ [GenericGroupStore] Added product:', {
      code: product.code_13_ref,
      name: product.name,
      totalProducts: newProducts.length
    });

    set({ selectedProducts: newProducts });
    get().recalculateProductCodes();
  },

  removeProduct: (code) => {
    const { selectedProducts } = get();
    const newProducts = selectedProducts.filter(p => p.code_13_ref !== code);

    console.log('➖ [GenericGroupStore] Removed product:', {
      code,
      remainingProducts: newProducts.length
    });

    set({ selectedProducts: newProducts });
    get().recalculateProductCodes();
  },

  isProductSelected: (code) => {
    return get().selectedProducts.some(p => p.code_13_ref === code);
  },

  // ===== LABORATOIRES =====
  addLaboratory: (laboratory) => {
    const { selectedLaboratories, isLaboratorySelected } = get();
    
    if (isLaboratorySelected(laboratory.laboratory_name)) {
      console.log('⚠️ [GenericGroupStore] Laboratory already selected:', laboratory.laboratory_name);
      return;
    }

    const newLaboratories = [...selectedLaboratories, laboratory];

    console.log('➕ [GenericGroupStore] Added laboratory:', {
      name: laboratory.laboratory_name,
      productCount: laboratory.product_codes.length,
      totalLaboratories: newLaboratories.length
    });

    set({ selectedLaboratories: newLaboratories });
    get().recalculateProductCodes();
  },

  removeLaboratory: (labName) => {
    const { selectedLaboratories } = get();
    const newLaboratories = selectedLaboratories.filter(l => l.laboratory_name !== labName);

    console.log('➖ [GenericGroupStore] Removed laboratory:', {
      labName,
      remainingLaboratories: newLaboratories.length
    });

    set({ selectedLaboratories: newLaboratories });
    get().recalculateProductCodes();
  },

  isLaboratorySelected: (labName) => {
    return get().selectedLaboratories.some(l => l.laboratory_name === labName);
  },

  // ===== BULK OPERATIONS (depuis drawer) =====
  addProducts: (products) => {
    const { selectedProducts } = get();
    const existingCodes = new Set(selectedProducts.map(p => p.code_13_ref));
    
    const newProducts = products.filter(p => !existingCodes.has(p.code_13_ref));
    
    if (newProducts.length === 0) {
      console.log('⚠️ [GenericGroupStore] All products already selected');
      return;
    }

    const updatedProducts = [...selectedProducts, ...newProducts];

    console.log('➕ [GenericGroupStore] Added products (bulk):', {
      newCount: newProducts.length,
      totalProducts: updatedProducts.length
    });

    set({ selectedProducts: updatedProducts });
    get().recalculateProductCodes();
  },

  addLaboratories: (laboratories) => {
    const { selectedLaboratories } = get();
    const existingNames = new Set(selectedLaboratories.map(l => l.laboratory_name));
    
    const newLaboratories = laboratories.filter(l => !existingNames.has(l.laboratory_name));
    
    if (newLaboratories.length === 0) {
      console.log('⚠️ [GenericGroupStore] All laboratories already selected');
      return;
    }

    const updatedLaboratories = [...selectedLaboratories, ...newLaboratories];

    console.log('➕ [GenericGroupStore] Added laboratories (bulk):', {
      newCount: newLaboratories.length,
      totalLaboratories: updatedLaboratories.length
    });

    set({ selectedLaboratories: updatedLaboratories });
    get().recalculateProductCodes();
  },

  // ===== CLEAR =====
  clearSelection: () => {
    console.log('🗑️ [GenericGroupStore] Clearing all selections');
    set({ 
      selectedGroups: [],
      selectedProducts: [],
      selectedLaboratories: [],
      productCodes: [],
      showGlobalTop: false,
      priceFilters: defaultPriceFilters
    });
  }
}));