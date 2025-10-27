// src/hooks/dashboard/useSalesProducts.ts
import { useMemo, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';

interface SalesProductRow {
  readonly nom: string;
  readonly code_ean: string;
  readonly periode: string;
  readonly periode_libelle: string;
  readonly type_ligne: 'DETAIL' | 'SYNTHESE';
  readonly quantite_vendue: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
  readonly part_marche_quantite_pct: number;
  readonly part_marche_marge_pct: number;
  readonly montant_ventes_ttc: number;
  readonly montant_marge_total: number;
  readonly quantite_vendue_comparison: number | null; // AJOUT pour comparaison
}

interface SalesProductsResponse {
  readonly salesData: SalesProductRow[];
  readonly count: number;
  readonly dateRange: { start: string; end: string };
  readonly queryTime: number;
  readonly cached: boolean;
}

export interface ProductSalesSummary {
  readonly nom: string;
  readonly code_ean: string;
  readonly quantite_vendue: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
  readonly part_marche_quantite_pct: number;
  readonly part_marche_marge_pct: number;
  readonly montant_ventes_ttc: number;
  readonly montant_marge_total: number;
  readonly quantite_vendue_comparison: number | null; // AJOUT pour comparaison
}

interface UseSalesProductsOptions {
  readonly enabled?: boolean | undefined;
  readonly dateRange?: { start: string; end: string } | undefined;
  readonly comparisonDateRange?: { start: string | null; end: string | null } | undefined; // AJOUT
  readonly filters?: {
    products?: string[];
    laboratories?: string[];
    categories?: string[];
    pharmacies?: string[];
  } | undefined;
}

interface UseSalesProductsReturn {
  readonly salesData: SalesProductRow[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly count: number;
  readonly dateRange: { start: string; end: string } | null;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
  readonly productSummaries: ProductSalesSummary[];
  readonly getSalesDetails: (codeEan: string) => SalesProductRow[];
}

const parseNumericValue = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export function useSalesProducts(
  options: UseSalesProductsOptions = {}
): UseSalesProductsReturn {
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange); // AJOUT
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

  const {
    data,
    isLoading,
    error,
    isError,
    queryTime,
    cached,
    refetch,
    hasData
  } = useStandardFetch<SalesProductsResponse>('/api/sales-products', {
    enabled: options.enabled,
    dateRange: options.dateRange || analysisDateRange,
    comparisonDateRange: options.comparisonDateRange || comparisonDateRange, // AJOUT
    includeComparison: true, // AJOUT
    filters: standardFilters
  });

  const productSummaries = useMemo((): ProductSalesSummary[] => {
    if (!data?.salesData) return [];
    
    const syntheses = data.salesData.filter(row => row.type_ligne === 'SYNTHESE');
    
    return syntheses.map(row => ({
      nom: row.nom,
      code_ean: row.code_ean,
      quantite_vendue: parseNumericValue(row.quantite_vendue),
      prix_achat_moyen: parseNumericValue(row.prix_achat_moyen),
      prix_vente_moyen: parseNumericValue(row.prix_vente_moyen),
      taux_marge_moyen: parseNumericValue(row.taux_marge_moyen),
      part_marche_quantite_pct: parseNumericValue(row.part_marche_quantite_pct),
      part_marche_marge_pct: parseNumericValue(row.part_marche_marge_pct),
      montant_ventes_ttc: parseNumericValue(row.montant_ventes_ttc),
      montant_marge_total: parseNumericValue(row.montant_marge_total),
      quantite_vendue_comparison: row.quantite_vendue_comparison ?? null // AJOUT
    }));
  }, [data?.salesData]);

  const getSalesDetails = useCallback((codeEan: string): SalesProductRow[] => {
    if (!data?.salesData) return [];
    return data.salesData.filter(row => 
      row.code_ean === codeEan && row.type_ligne === 'DETAIL'
    );
  }, [data?.salesData]);

  return {
    salesData: data?.salesData || [],
    isLoading,
    error,
    isError,
    queryTime,
    cached,
    refetch,
    hasData,
    count: data?.count || 0,
    dateRange: data?.dateRange || null,
    productSummaries,
    getSalesDetails
  };
}