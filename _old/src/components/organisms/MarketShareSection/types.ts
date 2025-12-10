// src/components/organisms/MarketShareSection/types.ts

/**
 * Types pour MarketShareSection - Visualisation parts de marché hiérarchiques
 */

export interface MarketShareSectionProps {
  readonly dateRange: { start: string; end: string };
  readonly filters?: {
    readonly products?: string[];
    readonly laboratories?: string[];
    readonly categories?: string[];
    readonly pharmacies?: string[];
  };
  readonly onRefresh?: () => void;
  readonly className?: string;
}

export type HierarchyLevel = 'universe' | 'category' | 'family';

export interface HierarchySegment {
  readonly segment_name: string;
  readonly ca_selection: number;
  readonly part_marche_ca_pct: number;
  readonly marge_selection: number;
  readonly part_marche_marge_pct: number;
  readonly ca_total_segment: number;
  readonly marge_total_segment: number;
  readonly top_brand_labs: {
    readonly brand_lab: string;
    readonly ca_brand_lab: number;
    readonly marge_brand_lab: number;
  }[];
}

export interface MarketShareHierarchyResponse {
  readonly segments: HierarchySegment[];
  readonly hierarchyLevel: string;
  readonly pagination: {
    readonly currentPage: number;
    readonly totalPages: number;
    readonly totalSegments: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

export interface MarketShareHierarchyRequest {
  readonly dateRange: { start: string; end: string; };
  readonly productCodes?: string[];
  readonly laboratoryCodes?: string[];
  readonly categoryCodes?: string[];
  readonly pharmacyIds?: string[];
  readonly hierarchyLevel: HierarchyLevel;
  readonly page?: number;
  readonly limit?: number;
}

export interface UseMarketShareHierarchyOptions {
  readonly enabled?: boolean;
  readonly dateRange: { start: string; end: string };
  readonly hierarchyLevel: HierarchyLevel;
  readonly page?: number;
  readonly limit?: number;
  readonly filters?: {
    readonly products?: string[];
    readonly laboratories?: string[];
    readonly categories?: string[];
    readonly pharmacies?: string[];
  };
}

export interface MarketSharePagination {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalSegments: number;
  readonly canPreviousPage: boolean;
  readonly canNextPage: boolean;
}

// Constantes pour les labels d'affichage
export const HIERARCHY_LABELS: Record<HierarchyLevel, string> = {
  universe: 'Univers',
  category: 'Catégories', 
  family: 'Familles'
} as const;