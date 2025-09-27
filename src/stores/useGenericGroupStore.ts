// src/stores/useGenericGroupStore.ts
import { create } from 'zustand';

export interface GenericGroup {
  readonly generic_group: string;
  readonly product_count: number;
  readonly referent_name: string | null;
  readonly referent_code: string | null;
  readonly referent_lab: string | null;
  readonly generic_count: number;
  readonly product_codes: string[];
}

interface GenericGroupState {
  selectedGroup: GenericGroup | null;
  productCodes: string[];
  isLoading: boolean;
}

interface GenericGroupActions {
  setSelectedGroup: (group: GenericGroup | null) => void;
  clearSelectedGroup: () => void;
  setLoading: (loading: boolean) => void;
  getProductCodes: () => string[];
}

const initialState: GenericGroupState = {
  selectedGroup: null,
  productCodes: [],
  isLoading: false,
};

export const useGenericGroupStore = create<GenericGroupState & GenericGroupActions>()((set, get) => ({
  ...initialState,

  setSelectedGroup: (group: GenericGroup | null) => {
    console.log('📦 [GenericGroupStore] Setting selected group:', group?.generic_group);
    console.log('📦 [GenericGroupStore] Product codes count:', group?.product_codes?.length || 0);
    
    set({ 
      selectedGroup: group,
      productCodes: group?.product_codes || []
    });
  },

  clearSelectedGroup: () => {
    console.log('🗑️ [GenericGroupStore] Clearing selected group');
    set({ 
      selectedGroup: null,
      productCodes: []
    });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  getProductCodes: () => {
    return get().productCodes;
  },
}));