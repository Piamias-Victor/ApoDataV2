// src/hooks/common/types.ts

// Types de base pour tous les hooks
export interface DateRange {
  readonly start: string;
  readonly end: string;
}

export interface ComparisonDateRange {
  readonly start: string | null;
  readonly end: string | null;
}

// Filtres standardisés pharma
export interface StandardFilters {
  readonly products?: string[];
  readonly laboratories?: string[];
  readonly categories?: string[];
  readonly pharmacies?: string[];
}

// Options communes à tous les hooks
export interface BaseHookOptions {
  readonly enabled?: boolean;
  readonly dateRange?: DateRange;
  readonly comparisonDateRange?: ComparisonDateRange;
  readonly includeComparison?: boolean;
  readonly filters?: StandardFilters;
}

// Retour standardisé pour tous les hooks
export interface BaseHookReturn<T> {
  readonly data: T | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
}

// Réponse API standardisée
export interface ApiResponse<T> {
  readonly data?: T | undefined;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly error?: string | undefined;
}

// Configuration hook spécialisé
export interface HookConfig<TData, TFilters = StandardFilters> {
  readonly endpoint: string;
  readonly transformResponse?: (data: any) => TData;
  readonly defaultFilters?: TFilters;
  readonly cacheTime?: number;
}