// src/stores/useGenericGroupStore.ts
import { create } from 'zustand';
import type { GenericGroup } from '@/hooks/generic-groups/useGenericGroupSearch';

interface GenericGroupState {
  selectedGroups: GenericGroup[];
  productCodes: string[];
  addGroup: (group: GenericGroup) => void;
  removeGroup: (groupName: string) => void;
  clearSelection: () => void;
  isGroupSelected: (groupName: string) => boolean;
}

export const useGenericGroupStore = create<GenericGroupState>((set, get) => ({
  selectedGroups: [],
  productCodes: [],

  addGroup: (group) => {
    const { selectedGroups } = get();
    if (selectedGroups.some(g => g.generic_group === group.generic_group)) return;

    const newGroups = [...selectedGroups, group];
    const allProductCodes = newGroups.flatMap(g => g.product_codes);
    const uniqueProductCodes = Array.from(new Set(allProductCodes));

    set({ 
      selectedGroups: newGroups,
      productCodes: uniqueProductCodes
    });
  },

  removeGroup: (groupName) => {
    const { selectedGroups } = get();
    const newGroups = selectedGroups.filter(g => g.generic_group !== groupName);
    const allProductCodes = newGroups.flatMap(g => g.product_codes);
    const uniqueProductCodes = Array.from(new Set(allProductCodes));

    set({ 
      selectedGroups: newGroups,
      productCodes: uniqueProductCodes
    });
  },

  clearSelection: () => {
    set({ selectedGroups: [], productCodes: [] });
  },

  isGroupSelected: (groupName) => {
    return get().selectedGroups.some(g => g.generic_group === groupName);
  }
}));