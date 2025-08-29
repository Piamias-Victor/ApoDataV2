// src/hooks/dashboard/useSalesProducts.ts
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';

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
}

interface SalesProductsResponse {
  readonly salesData: SalesProductRow[];
  readonly count: number;
  readonly dateRange: { start: string; end: string };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface SalesProductsRequest {
  readonly dateRange: { start: string; end: string; };
  readonly productCodes: string[];
  readonly laboratoryCodes: string[];
  readonly categoryCodes: string[];
  readonly pharmacyIds?: string[] | undefined;
}

interface UseSalesProductsOptions {
  readonly enabled?: boolean;
  readonly dateRange: { start: string; end: string };
  readonly filters?: {
    products?: string[];
    laboratories?: string[];
    categories?: string[];
    pharmacies?: string[];
  };
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

interface ProductSalesSummary {
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
}

const parseNumericValue = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const cleanSalesData = (rawData: any[]): SalesProductRow[] => {
  return rawData.map(row => ({
    nom: String(row.nom || ''),
    code_ean: String(row.code_ean || ''),
    periode: String(row.periode || ''),
    periode_libelle: String(row.periode_libelle || ''),
    type_ligne: row.type_ligne as 'DETAIL' | 'SYNTHESE',
    quantite_vendue: parseNumericValue(row.quantite_vendue),
    prix_achat_moyen: parseNumericValue(row.prix_achat_moyen),
    prix_vente_moyen: parseNumericValue(row.prix_vente_moyen),
    taux_marge_moyen: parseNumericValue(row.taux_marge_moyen),
    part_marche_quantite_pct: parseNumericValue(row.part_marche_quantite_pct),
    part_marche_marge_pct: parseNumericValue(row.part_marche_marge_pct),
    montant_ventes_ttc: parseNumericValue(row.montant_ventes_ttc),
    montant_marge_total: parseNumericValue(row.montant_marge_total)
  }));
};

/**
 * Hook useSalesProducts - Données ventes détaillées par produit sur période utilisateur
 */
export function useSalesProducts(
  options: UseSalesProductsOptions
): UseSalesProductsReturn {
  const { enabled = true, dateRange, filters = {} } = options;
  
  const [salesData, setSalesData] = useState<SalesProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryTime, setQueryTime] = useState(0);
  const [cached, setCached] = useState(false);
  const [responseDateRange, setResponseDateRange] = useState<{ start: string; end: string } | null>(null);
  
  // Refs pour éviter boucles
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');
  const forceRefreshRef = useRef(false);

  // Extraction filtres
  const { products = [], laboratories = [], categories = [], pharmacies = [] } = filters;

  // Fonction fetch stable
  const fetchSalesProducts = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    console.log('🚀 [Hook] fetchSalesProducts called', { forceRefresh, enabled });
    
    if (!enabled) {
      console.log('❌ [Hook] Hook disabled, stopping');
      return;
    }
    
    // Validation filtres - dates ET produits obligatoires
    const hasDateRange = dateRange.start && dateRange.end;
    const hasFilters = products.length > 0 || laboratories.length > 0 || categories.length > 0;
    
    console.log('📅 [Hook] Validation:', {
      start: dateRange.start,
      end: dateRange.end,
      hasDateRange,
      hasFilters,
      productsCount: products.length,
      laboratoriesCount: laboratories.length,
      categoriesCount: categories.length
    });

    if (!hasDateRange) {
      console.log('❌ [Hook] Missing date range');
      setSalesData([]);
      setError('Veuillez sélectionner une plage de dates dans les filtres');
      setIsLoading(false);
      return;
    }

    if (!hasFilters) {
      console.log('❌ [Hook] No product filters selected');
      setSalesData([]);
      setError('Veuillez sélectionner au moins un produit, laboratoire ou catégorie');
      setIsLoading(false);
      return;
    }

    // Préparation requête
    const requestBody: SalesProductsRequest = {
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      },
      productCodes: products,
      laboratoryCodes: laboratories,
      categoryCodes: categories,
      pharmacyIds: pharmacies.length > 0 ? pharmacies : undefined
    };

    console.log('📤 [Hook] Request body prepared:', requestBody);

    const requestKey = JSON.stringify(requestBody);
    
    // Éviter requêtes duplicatas
    if (!forceRefresh && requestKey === lastRequestRef.current && !error) {
      console.log('🔄 [Hook] Same request, skipping');
      return;
    }

    // Annuler requête précédente
    if (abortControllerRef.current) {
      console.log('⏹️ [Hook] Aborting previous request');
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    lastRequestRef.current = requestKey;

    console.log('⏳ [Hook] Starting API call...');
    setIsLoading(true);
    setError(null);

    try {
      const url = forceRefresh 
        ? `/api/sales-products?refresh=${Date.now()}`
        : '/api/sales-products';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      console.log('📡 [Hook] Response received:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: SalesProductsResponse = await response.json();
      
      console.log('✅ [Hook] Raw data received:', {
        dataCount: data.salesData?.length || 0,
        dateRange: data.dateRange,
        queryTime: data.queryTime,
        cached: data.cached,
        sampleData: data.salesData?.[0]
      });
      
      // Nettoyer données
      const cleanedData = cleanSalesData(data.salesData || []);
      
      setSalesData(cleanedData);
      setResponseDateRange(data.dateRange);
      setQueryTime(data.queryTime);
      setCached(data.cached);
      setError(null);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('⏹️ [Hook] Request was aborted');
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.log('💥 [Hook] Error:', errorMessage);
      setError(errorMessage);
      setSalesData([]);
      setResponseDateRange(null);
      setCached(false);
      setQueryTime(0);
    } finally {
      console.log('🏁 [Hook] Request completed');
      setIsLoading(false);
      forceRefreshRef.current = false;
    }
  }, [
    enabled,
    dateRange.start,
    dateRange.end,
    products, 
    laboratories, 
    categories, 
    pharmacies,
    error
  ]);

  // Refetch fonction
  const refetch = useCallback(async (): Promise<void> => {
    console.log('🔄 [Hook] Manual refetch triggered');
    forceRefreshRef.current = true;
    await fetchSalesProducts(true);
  }, [fetchSalesProducts]);

  // Effect pour déclencher fetch
  useEffect(() => {
    console.log('🔄 [Hook] useEffect triggered, enabled:', enabled);
    if (enabled) {
      fetchSalesProducts(forceRefreshRef.current);
    }

    return () => {
      if (abortControllerRef.current) {
        console.log('🧹 [Hook] Cleanup: aborting request');
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, fetchSalesProducts]);

  // Calcul synthèses produits
  const productSummaries = useMemo((): ProductSalesSummary[] => {
    const summariesMap = new Map<string, ProductSalesSummary>();
    
    salesData.forEach((row) => {
      if (row.type_ligne === 'SYNTHESE') {
        summariesMap.set(row.code_ean, {
          nom: row.nom,
          code_ean: row.code_ean,
          quantite_vendue: row.quantite_vendue,
          prix_achat_moyen: row.prix_achat_moyen,
          prix_vente_moyen: row.prix_vente_moyen,
          taux_marge_moyen: row.taux_marge_moyen,
          part_marche_quantite_pct: row.part_marche_quantite_pct,
          part_marche_marge_pct: row.part_marche_marge_pct,
          montant_ventes_ttc: row.montant_ventes_ttc,
          montant_marge_total: row.montant_marge_total
        });
      }
    });
    
    return Array.from(summariesMap.values());
  }, [salesData]);

  // Fonction pour détails par produit
  const getSalesDetails = useCallback((codeEan: string): SalesProductRow[] => {
    return salesData.filter(
      row => row.code_ean === codeEan && row.type_ligne === 'DETAIL'
    ).sort((a, b) => {
      return a.periode.localeCompare(b.periode);
    });
  }, [salesData]);

  return {
    salesData,
    isLoading,
    error,
    isError: !!error,
    queryTime,
    cached,
    count: salesData.length,
    dateRange: responseDateRange,
    refetch,
    hasData: salesData.length > 0,
    productSummaries,
    getSalesDetails
  };
}