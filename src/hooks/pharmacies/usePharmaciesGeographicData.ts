// src/hooks/pharmacies/usePharmaciesGeographicData.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { BaseHookReturn, StandardFilters } from '@/hooks/common/types';

interface RegionData {
  readonly regionCode: string;
  readonly regionName: string;
  readonly ca_total: number;
  readonly quantite_totale: number;
  readonly nb_pharmacies: number;
  readonly ca_moyen_pharmacie: number;
  readonly part_marche_pct: number;
}

interface GeographicDataResponse {
  readonly regions: RegionData[];
  readonly queryTime: number;
  readonly cached: boolean;
  readonly comparison?: {
    readonly regions: RegionData[];
  };
}

interface UsePharmaciesGeographicDataOptions {
  readonly enabled?: boolean;
  readonly includeComparison?: boolean;
  readonly dateRange?: { start: string; end: string };
  readonly comparisonDateRange?: { start: string | null; end: string | null } | undefined;
  readonly filters?: {
    products?: string[];
    laboratories?: string[];
    categories?: string[];
    pharmacies?: string[];
  };
}

interface UsePharmaciesGeographicDataReturn extends BaseHookReturn<GeographicDataResponse> {}

/**
 * Hook usePharmaciesGeographicData - VERSION SIMPLIFIÉE
 * 
 * ✅ Utilise directement products du store (contient logique ET/OU + exclusions)
 */
export function usePharmaciesGeographicData(
  options: UsePharmaciesGeographicDataOptions
): UsePharmaciesGeographicDataReturn {
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // 🔥 Lecture directe de products (contient déjà logique ET/OU + exclusions)
  const products = useFiltersStore((state) => state.products);
  const excludedProducts = useFiltersStore((state) => state.excludedProducts);

  console.log('🎯 [usePharmaciesGeographicData] Using products from store:', {
    total: products.length,
    excluded: excludedProducts.length
  });

  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: products,
    ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
  };

  const result = useStandardFetch<GeographicDataResponse>('/api/pharmacies/geographic', {
    enabled: options.enabled,
    dateRange: options.dateRange || analysisDateRange,
    comparisonDateRange: options.comparisonDateRange,
    includeComparison: options.includeComparison,
    filters: standardFilters
  });

  return result;
}