// src/hooks/dashboard/useRupturesProducts.ts
import { useMemo, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';

interface RuptureProductRow {
  readonly nom: string;
  readonly code_ean: string;
  readonly periode: string;
  readonly periode_libelle: string;
  readonly type_ligne: 'DETAIL' | 'SYNTHESE';
  readonly quantite_vendue: number;
  readonly quantite_commandee: number;
  readonly quantite_receptionnee: number;
  readonly quantite_stock: number;
  readonly delta_quantite: number;
  readonly taux_reception: number;
  readonly prix_achat_moyen: number;
  readonly montant_delta: number;
}

interface RupturesProductsResponse {
  readonly rupturesData: RuptureProductRow[];
  readonly count: number;
  readonly dateRange: { start: string; end: string };
  readonly queryTime: number;
  readonly cached: boolean;
}

export interface RuptureProductSummary {
  readonly nom: string;
  readonly code_ean: string;
  readonly quantite_vendue: number;
  readonly quantite_commandee: number;
  readonly quantite_receptionnee: number;
  readonly quantite_stock: number;
  readonly delta_quantite: number;
  readonly taux_reception: number;
  readonly prix_achat_moyen: number;
  readonly montant_delta: number;
}

interface UseRupturesProductsReturn {
  readonly rupturesData: RuptureProductRow[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly count: number;
  readonly dateRange: { start: string; end: string } | null;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
  readonly productSummaries: RuptureProductSummary[];
  readonly getRuptureDetails: (codeEan: string) => RuptureProductRow[];
}

const parseNumericValue = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export function useRupturesProducts(): UseRupturesProductsReturn {
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

  const {
    data,
    isLoading,
    error,
    isError,
    queryTime,
    cached,
    refetch,
    hasData
  } = useStandardFetch<RupturesProductsResponse>('/api/ruptures/products-analysis', {
    enabled: true,
    dateRange: analysisDateRange,
    filters: standardFilters
  });

  const productSummaries = useMemo((): RuptureProductSummary[] => {
    if (!data?.rupturesData) return [];
    
    const syntheses = data.rupturesData.filter(row => row.type_ligne === 'SYNTHESE');
    
    return syntheses.map(row => ({
      nom: row.nom,
      code_ean: row.code_ean,
      quantite_vendue: parseNumericValue(row.quantite_vendue),
      quantite_commandee: parseNumericValue(row.quantite_commandee),
      quantite_receptionnee: parseNumericValue(row.quantite_receptionnee),
      quantite_stock: parseNumericValue(row.quantite_stock),
      delta_quantite: parseNumericValue(row.delta_quantite),
      taux_reception: parseNumericValue(row.taux_reception),
      prix_achat_moyen: parseNumericValue(row.prix_achat_moyen),
      montant_delta: parseNumericValue(row.montant_delta)
    }));
  }, [data?.rupturesData]);

  const getRuptureDetails = useCallback((codeEan: string): RuptureProductRow[] => {
    if (!data?.rupturesData) return [];
    return data.rupturesData.filter(row => 
      row.code_ean === codeEan && row.type_ligne === 'DETAIL'
    );
  }, [data?.rupturesData]);

  return {
    rupturesData: data?.rupturesData || [],
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
    getRuptureDetails
  };
}