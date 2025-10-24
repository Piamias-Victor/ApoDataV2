// src/stores/useGenericGroupStore.ts
import { create } from 'zustand';
import type { GenericGroup } from '@/hooks/generic-groups/useGenericGroupSearch';
import type { GenericProduct, GenericLaboratory } from '@/hooks/generic-filters/useGenericFilterSearch';

interface GenericGroupState {
  // Sources de sélection
  selectedGroups: GenericGroup[];
  selectedProducts: GenericProduct[];
  selectedLaboratories: GenericLaboratory[];
  
  // Résultat calculé
  productCodes: string[];
  
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

export const useGenericGroupStore = create<GenericGroupState>((set, get) => ({
  selectedGroups: [],
  selectedProducts: [],
  selectedLaboratories: [],
  productCodes: [],

  // Recalculer tous les product codes
  recalculateProductCodes: () => {
    const { selectedGroups, selectedProducts, selectedLaboratories } = get();
    
    const allCodes = new Set<string>();
    
    // Codes des groupes génériques
    selectedGroups.forEach(group => {
      group.product_codes.forEach(code => allCodes.add(code));
    });
    
    // Codes des produits individuels
    selectedProducts.forEach(product => {
      allCodes.add(product.code_13_ref);
    });
    
    // Codes des laboratoires
    selectedLaboratories.forEach(lab => {
      lab.product_codes.forEach(code => allCodes.add(code));
    });
    
    const uniqueProductCodes = Array.from(allCodes);
    
    console.log('🔄 [GenericGroupStore] Recalculated product codes:', {
      groups: selectedGroups.length,
      products: selectedProducts.length,
      laboratories: selectedLaboratories.length,
      totalCodes: uniqueProductCodes.length
    });
    
    set({ productCodes: uniqueProductCodes });
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
    
    // Filtrer les produits non déjà sélectionnés
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
    
    // Filtrer les laboratoires non déjà sélectionnés
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
      productCodes: []
    });
  }
}));