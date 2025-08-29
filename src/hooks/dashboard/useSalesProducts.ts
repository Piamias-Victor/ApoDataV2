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

export const useSalesProducts = (options?: UseSalesProductsOptions): UseSalesProductsReturn => {
  // États
  const [salesData, setSalesData] = useState<SalesProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryTime, setQueryTime] = useState(0);
  const [cached, setCached] = useState(false);
  const [count, setCount] = useState(0);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  
  // Refs pour éviter requêtes duplicatas
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');

  // Filtres depuis le store Zustand - CORRECTION : utilisation du store
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Utiliser les filtres passés en option ou ceux du store
  const effectiveDateRange = options?.dateRange || analysisDateRange;
  const effectiveFilters = options?.filters || {
    products: productsFilter,
    laboratories: laboratoriesFilter,
    categories: categoriesFilter,
    pharmacies: pharmacyFilter
  };

  const isError = error !== null;
  const hasData = salesData.length > 0;

  // Calcul des résumés produits (regroupement SYNTHESE)
  const productSummaries = useMemo((): ProductSalesSummary[] => {
    const syntheses = salesData.filter(row => row.type_ligne === 'SYNTHESE');
    
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
      montant_marge_total: parseNumericValue(row.montant_marge_total)
    }));
  }, [salesData]);

  // Fonction pour récupérer les détails d'un produit
  const getSalesDetails = useCallback((codeEan: string): SalesProductRow[] => {
    return salesData.filter(row => 
      row.code_ean === codeEan && row.type_ligne === 'DETAIL'
    );
  }, [salesData]);

  // Fonction fetch avec useCallback
  const fetchSalesProducts = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    const enabled = options?.enabled ?? true;
    
    console.log('🚀 [Hook] fetchSalesProducts called', { forceRefresh, enabled });
    
    if (!enabled) {
      console.log('❌ [Hook] Hook disabled, stopping');
      return;
    }

    // Validation obligatoire : dates + au moins un filtre
    const hasDateRange = effectiveDateRange.start && effectiveDateRange.end;
    // CORRECTION : Guard clauses pour éviter undefined
    const products = effectiveFilters.products || [];
    const laboratories = effectiveFilters.laboratories || [];
    const categories = effectiveFilters.categories || [];
    const pharmacies = effectiveFilters.pharmacies || [];
    const hasFilters = products.length > 0 || laboratories.length > 0 || categories.length > 0;
    
    console.log('📅 [Hook] Validation:', {
      start: effectiveDateRange.start,
      end: effectiveDateRange.end,
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
        start: effectiveDateRange.start,
        end: effectiveDateRange.end
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
        sampleData: data.salesData?.slice(0, 2)
      });

      if (!data.salesData) {
        throw new Error('Invalid response format: missing salesData');
      }

      setSalesData(data.salesData);
      setCount(data.count || data.salesData.length);
      setDateRange(data.dateRange);
      setQueryTime(data.queryTime);
      setCached(data.cached);
      setError(null);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('⏹️ [Hook] Request aborted');
        return;
      }
      
      console.error('💥 [Hook] Sales products fetch error:', error);
      setError(error.message || 'Erreur lors du chargement des données ventes');
      setSalesData([]);
      setCount(0);
      setDateRange(null);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveDateRange, effectiveFilters, options?.enabled, error]);

  // Fonction refetch publique
  const refetch = useCallback(async (): Promise<void> => {
    await fetchSalesProducts(true);
  }, [fetchSalesProducts]);

  // Effect principal avec dependency array optimisée
  useEffect(() => {
    fetchSalesProducts(false);
  }, [fetchSalesProducts]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    salesData,
    isLoading,
    error,
    isError,
    queryTime,
    cached,
    count,
    dateRange,
    refetch,
    hasData,
    productSummaries,
    getSalesDetails
  };
};