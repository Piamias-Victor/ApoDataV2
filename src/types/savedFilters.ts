// src/types/savedFilters.ts

/**
 * Structure d'un filtre sauvegardé en base de données
 */
export interface SavedFilter {
  readonly id: string;
  readonly user_id: string;
  readonly pharmacy_id: string;
  readonly name: string;
  readonly product_codes: string[];
  readonly laboratory_names: string[];
  readonly category_names: string[];
  readonly category_types: ('universe' | 'category')[];
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Payload pour créer un nouveau filtre sauvegardé
 */
export interface SaveFilterPayload {
  readonly name: string;
  readonly product_codes: string[];
  readonly laboratory_names: string[];
  readonly category_names: string[];
  readonly category_types: ('universe' | 'category')[];
}

/**
 * Résultat après résolution des codes produits
 * (utilisé lors du chargement d'un filtre)
 */
export interface LoadFilterResult {
  readonly filter: SavedFilter;
  readonly resolvedProductCodes: string[];
  readonly resolvedLaboratories: Array<{
    readonly name: string;
    readonly productCodes: string[];
    readonly productCount: number;
  }>;
  readonly resolvedCategories: Array<{
    readonly name: string;
    readonly type: 'universe' | 'category';
    readonly productCodes: string[];
    readonly productCount: number;
  }>;
}

/**
 * Payload pour renommer un filtre
 */
export interface RenameFilterPayload {
  readonly name: string;
}

/**
 * Preview d'un filtre pour affichage dans l'UI
 */
export interface SavedFilterPreview {
  readonly id: string;
  readonly name: string;
  readonly productsCount: number;
  readonly laboratoriesCount: number;
  readonly categoriesCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * État du hook useSavedFilters
 */
export interface UseSavedFiltersState {
  readonly savedFilters: SavedFilter[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isSaving: boolean;
  readonly isLoadingFilter: boolean;
  readonly isDeletingFilter: boolean;
  readonly isRenamingFilter: boolean;
}

/**
 * Actions du hook useSavedFilters
 */
export interface UseSavedFiltersActions {
  readonly loadFilter: (id: string) => Promise<void>;
  readonly saveCurrentFilters: (name: string) => Promise<void>;
  readonly renameFilter: (id: string, newName: string) => Promise<void>;
  readonly deleteFilter: (id: string) => Promise<void>;
  readonly refreshFilters: () => Promise<void>;
}

/**
 * Type complet retourné par useSavedFilters
 */
export type UseSavedFiltersReturn = UseSavedFiltersState & UseSavedFiltersActions;