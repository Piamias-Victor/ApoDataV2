import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ComparisonType = 'PRODUCT' | 'LABORATORY' | 'CATEGORY';

export interface ComparisonEntity {
    id: string; // Internal UUID
    label: string;
    type: ComparisonType;
    sourceIds: string[]; // Aggregated IDs (e.g. ['prod_123', 'prod_456'])
    color: string;
}

interface ComparisonState {
    entities: ComparisonEntity[];
    addEntity: (entity: Omit<ComparisonEntity, 'id'>) => void;
    removeEntity: (id: string) => void;
    clearEntities: () => void;
    updateEntity: (id: string, updates: Partial<ComparisonEntity>) => void;
}

export const useComparisonStore = create<ComparisonState>()(
    persist(
        (set) => ({
            entities: [],
            addEntity: (entity) => set((state) => ({
                entities: [...state.entities, { ...entity, id: crypto.randomUUID() }]
            })),
            removeEntity: (id) => set((state) => ({
                entities: state.entities.filter((e) => e.id !== id)
            })),
            clearEntities: () => set({ entities: [] }),
            updateEntity: (id, updates) => set((state) => ({
                entities: state.entities.map((e) => e.id === id ? { ...e, ...updates } : e)
            })),
        }),
        {
            name: 'apodata-comparison-store-v1',
        }
    )
);
