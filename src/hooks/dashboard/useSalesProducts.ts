// src/hooks/dashboard/useSalesProducts.ts
import { useMemo, useCallback, useEffect } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';

interface SalesProductRow {
  readonly nom: string;
  readonly code_ean: string;
  readonly bcb_lab: string | null;
  readonly periode: string;
  readonly periode_libelle: string;
  readonly type_ligne: 'DETAIL' | 'SYNTHESE';
  readonly quantity_bought: number;
  readonly quantite_vendue: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
  readonly part_marche_quantite_pct: number;
  readonly part_marche_marge_pct: number;
  readonly montant_ventes_ttc: number;
  readonly montant_marge_total: number;
  readonly quantite_vendue_comparison: number | null;
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
  readonly bcb_lab: string | null;
  readonly quantity_bought: number;
  readonly quantite_vendue: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
  readonly part_marche_quantite_pct: number;
  readonly part_marche_marge_pct: number;
  readonly montant_ventes_ttc: number;
  readonly montant_marge_total: number;
  readonly quantite_vendue_comparison: number | null;
}

interface UseSalesProductsOptions {
  readonly enabled?: boolean | undefined;
  readonly dateRange?: { start: string; end: string } | undefined;
  readonly comparisonDateRange?: { start: string | null; end: string | null } | undefined;
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

/**
 * Hook useSalesProducts - VERSION AVEC EXCLUSIONS
 * 
 * ✅ Calcule les codes finaux avec exclusions via useMemo
 */
export function useSalesProducts(
  options: UseSalesProductsOptions = {}
): UseSalesProductsReturn {
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);
  
  // 🔥 Récupération des données brutes du store
  const products = useFiltersStore((state) => state.products);
  const selectedLaboratories = useFiltersStore((state) => state.selectedLaboratories);
  const selectedCategories = useFiltersStore((state) => state.selectedCategories);
  const excludedProducts = useFiltersStore((state) => state.excludedProducts);

  // 🔥 Calcul des codes finaux avec useMemo (stable)
  const finalProductCodes = useMemo(() => {
    const allCodes = new Set<string>();
    const excludedSet = new Set(excludedProducts);
    
    // Ajouter produits manuels (après exclusion)
    products.forEach(code => {
      if (!excludedSet.has(code)) {
        allCodes.add(code);
      }
    });
    
    // Ajouter codes des labos (après exclusion)
    selectedLaboratories.forEach(lab => {
      lab.productCodes.forEach(code => {
        if (!excludedSet.has(code)) {
          allCodes.add(code);
        }
      });
    });
    
    // Ajouter codes des catégories (après exclusion)
    selectedCategories.forEach(cat => {
      cat.productCodes.forEach(code => {
        if (!excludedSet.has(code)) {
          allCodes.add(code);
        }
      });
    });
    
    const finalCodes = Array.from(allCodes);
    
    console.log('🎯 [useSalesProducts] Final product codes calculated:', {
      total: finalCodes.length,
      products: products.length,
      labs: selectedLaboratories.length,
      cats: selectedCategories.length,
      excluded: excludedProducts.length
    });
    
    return finalCodes;
  }, [products, selectedLaboratories, selectedCategories, excludedProducts]);

  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: finalProductCodes,
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
    comparisonDateRange: options.comparisonDateRange || comparisonDateRange,
    includeComparison: true,
    filters: standardFilters
  });

  // 🔥 Force refetch quand les exclusions changent
  useEffect(() => {
    console.log('🔄 [useSalesProducts] Exclusions changed, triggering refetch');
    refetch();
  }, [excludedProducts.length, refetch]);

  const productSummaries = useMemo((): ProductSalesSummary[] => {
    if (!data?.salesData) return [];
    
    const syntheses = data.salesData.filter(row => row.type_ligne === 'SYNTHESE');
    
    return syntheses.map(row => ({
      nom: row.nom,
      code_ean: row.code_ean,
      bcb_lab: row.bcb_lab,
      quantity_bought: parseNumericValue(row.quantity_bought),
      quantite_vendue: parseNumericValue(row.quantite_vendue),
      prix_achat_moyen: parseNumericValue(row.prix_achat_moyen),
      prix_vente_moyen: parseNumericValue(row.prix_vente_moyen),
      taux_marge_moyen: parseNumericValue(row.taux_marge_moyen),
      part_marche_quantite_pct: parseNumericValue(row.part_marche_quantite_pct),
      part_marche_marge_pct: parseNumericValue(row.part_marche_marge_pct),
      montant_ventes_ttc: parseNumericValue(row.montant_ventes_ttc),
      montant_marge_total: parseNumericValue(row.montant_marge_total),
      quantite_vendue_comparison: row.quantite_vendue_comparison ?? null
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