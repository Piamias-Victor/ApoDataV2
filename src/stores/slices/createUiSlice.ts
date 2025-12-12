import { StateCreator } from 'zustand';
import { FilterState, FilterActions } from '@/types/filters';

export interface UiSlice {
    isFilterOpen: boolean;
    activeDrawer: string | null;
}

export const createUiSlice: StateCreator<FilterState & FilterActions, [], [], UiSlice> = (() => ({
    isFilterOpen: false,
    activeDrawer: null,
}));
