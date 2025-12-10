// src/types/savedFilters.ts

// ===== TYPES COMMUNS =====

export type FilterType = 'classic' | 'generic';

export interface BaseSavedFilter {
  readonly id: string;
  readonly user_id: string;
  readonly filter_type: FilterType;
  readonly name: string;
  readonly pharmacy_ids: string[];
  readonly excluded_product_codes: string[];
  readonly analysis_date_start: string;
  readonly analysis_date_end: string;
  readonly comparison_date_start: string | null;
  readonly comparison_date_end: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

// ===== TYPES FILTRES CLASSIQUES =====

export interface ClassicSavedFilter extends BaseSavedFilter {
  readonly filter_type: 'classic';
  readonly product_codes: string[];
  readonly laboratory_names: string[];
  readonly category_names: string[];
  readonly category_types: ('universe' | 'category')[];
}

// ===== TYPES FILTRES GÉNÉRIQUES =====
// 🔥 MODIFIÉ - Types compatibles avec les stores

export interface GenericGroup {
  readonly generic_group: string;
  readonly product_codes: string[];
  readonly product_count: number;
  readonly referent_name: string | null; // 🔥 null au lieu de optional
  readonly referent_code: string | null; // 🔥 null au lieu de optional
  readonly referent_lab: string | null; // 🔥 null au lieu de optional
  readonly generic_count: number | null; // 🔥 null au lieu de optional
}

export interface GenericProduct {
  readonly code_13_ref: string;
  readonly name: string;
  readonly laboratory_name?: string;
  readonly bcb_lab?: string;
  readonly bcb_generic_status?: 'GÉNÉRIQUE' | 'RÉFÉRENT'; // 🔥 Type strict
  readonly bcb_generic_group?: string;
}

export interface GenericLaboratory {
  readonly laboratory_name: string;
  readonly product_codes: string[];
  readonly product_count: number;
  readonly generic_count: number | null; // 🔥 null au lieu de optional
  readonly referent_count: number | null; // 🔥 null au lieu de optional
}

export interface PriceRange {
  readonly min: number | null;
  readonly max: number | null;
}

export interface PriceFilters {
  readonly prixFabricant: PriceRange;
  readonly prixNetRemise: PriceRange;
  readonly remise: PriceRange;
}

export type GenericStatus = 'BOTH' | 'GÉNÉRIQUE' | 'RÉFÉRENT';

export interface GenericSavedFilter extends BaseSavedFilter {
  readonly filter_type: 'generic';
  readonly generic_groups: GenericGroup[];
  readonly generic_products: GenericProduct[];
  readonly generic_laboratories: GenericLaboratory[];
  readonly price_filters: PriceFilters;
  readonly tva_rates: number[];
  readonly generic_status: GenericStatus;
  readonly show_global_top: boolean;
}

// ===== TYPE UNION =====

export type SavedFilter = ClassicSavedFilter | GenericSavedFilter;

// ===== PAYLOADS SAUVEGARDE =====

export interface SaveClassicFilterPayload {
  readonly filter_type: 'classic';
  readonly name: string;
  readonly pharmacy_ids: string[];
  readonly product_codes: string[];
  readonly laboratory_names: string[];
  readonly category_names: string[];
  readonly category_types: ('universe' | 'category')[];
  readonly excluded_product_codes: string[];
  readonly analysis_date_start: string;
  readonly analysis_date_end: string;
  readonly comparison_date_start: string | null;
  readonly comparison_date_end: string | null;
}

export interface SaveGenericFilterPayload {
  readonly filter_type: 'generic';
  readonly name: string;
  readonly pharmacy_ids: string[];
  readonly generic_groups: GenericGroup[];
  readonly generic_products: GenericProduct[];
  readonly generic_laboratories: GenericLaboratory[];
  readonly price_filters: PriceFilters;
  readonly tva_rates: number[];
  readonly generic_status: GenericStatus;
  readonly show_global_top: boolean;
  readonly excluded_product_codes: string[];
  readonly analysis_date_start: string;
  readonly analysis_date_end: string;
  readonly comparison_date_start: string | null;
  readonly comparison_date_end: string | null;
}

export type SaveFilterPayload = SaveClassicFilterPayload | SaveGenericFilterPayload;

// ===== RÉSOLUTION CHARGEMENT (CLASSIQUE) =====

export interface SelectedLaboratory {
  readonly name: string;
  readonly productCodes: string[];
  readonly productCount: number;
}

export interface SelectedCategory {
  readonly name: string;
  readonly type: 'universe' | 'category';
  readonly productCodes: string[];
  readonly productCount: number;
}

export interface SelectedPharmacy {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly ca: number;
  readonly area: string;
  readonly employees_count: number;
  readonly id_nat: string;
}

export interface LoadClassicFilterResult {
  readonly filter: ClassicSavedFilter;
  readonly resolvedProductCodes: string[];
  readonly resolvedLaboratories: SelectedLaboratory[];
  readonly resolvedCategories: SelectedCategory[];
  readonly resolvedPharmacies: SelectedPharmacy[];
}

// ===== RÉSOLUTION CHARGEMENT (GÉNÉRIQUE) =====

export interface LoadGenericFilterResult {
  readonly filter: GenericSavedFilter;
  readonly resolvedPharmacies: SelectedPharmacy[];
}

// ===== AUTRES =====

export interface RenameFilterPayload {
  readonly name: string;
}

// ===== HOOK RETURN TYPE =====

export interface UseSavedFiltersReturn {
  readonly savedFilters: SavedFilter[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isSaving: boolean;
  readonly isLoadingFilter: boolean;
  readonly isDeletingFilter: boolean;
  readonly isRenamingFilter: boolean;
  readonly loadFilter: (id: string) => Promise<void>;
  readonly saveCurrentFilters: (name: string, filterType: FilterType) => Promise<void>;
  readonly renameFilter: (id: string, newName: string) => Promise<void>;
  readonly deleteFilter: (id: string) => Promise<void>;
  readonly refreshFilters: () => Promise<void>;
}