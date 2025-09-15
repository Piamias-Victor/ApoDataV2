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

// src/hooks/pharmacies/usePharmaciesGeographicData.ts
interface UsePharmaciesGeographicDataOptions {
  readonly enabled?: boolean;
  readonly includeComparison?: boolean;
  readonly dateRange?: { start: string; end: string };
  readonly comparisonDateRange?: { start: string | null; end: string | null } | undefined; // Fix: ajout de | undefined
  readonly filters?: {
    products?: string[];
    laboratories?: string[];
    categories?: string[];
    pharmacies?: string[];
  };
}

interface UsePharmaciesGeographicDataReturn extends BaseHookReturn<GeographicDataResponse> {}

export function usePharmaciesGeographicData(
  options: UsePharmaciesGeographicDataOptions
): UsePharmaciesGeographicDataReturn {
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: productsFilter,
    laboratoryCodes: laboratoriesFilter,
    categoryCodes: categoriesFilter,
    ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
  };

  return useStandardFetch<GeographicDataResponse>('/api/pharmacies/geographic', {
    enabled: options.enabled,
    dateRange: options.dateRange || analysisDateRange,
    comparisonDateRange: options.comparisonDateRange,
    includeComparison: options.includeComparison,
    filters: standardFilters
  });
}