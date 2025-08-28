// src/hooks/products/useProductsMonthlyDetails.ts
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';

interface MonthlyDetailsRow {
  readonly nom: string;
  readonly code_ean: string;
  readonly mois: string;
  readonly mois_libelle: string;
  readonly type_ligne: 'MENSUEL' | 'SYNTHESE' | 'STOCK_MOYEN';
  readonly quantite_vendue: number;
  readonly quantite_stock: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
}

interface MonthlyDetailsResponse {
  readonly monthlyData: MonthlyDetailsRow[];
  readonly count: number;
  readonly queryTime: number;
  readonly cached: boolean;
}

interface MonthlyDetailsRequest {
  readonly dateRange: {
    readonly start: string;
    readonly end: string;
  };
  readonly productCodes: string[];
  readonly laboratoryCodes: string[];
  readonly categoryCodes: string[];
  readonly pharmacyIds?: string[] | undefined;
}

interface UseProductsMonthlyDetailsOptions {
  readonly enabled?: boolean;
}

interface UseProductsMonthlyDetailsReturn {
  readonly monthlyData: MonthlyDetailsRow[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly count: number;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
  readonly productSummaries: ProductSummary[];
  readonly getMonthlyDetails: (codeEan: string) => MonthlyDetailsRow[];
}

interface ProductSummary {
  readonly nom: string;
  readonly code_ean: string;
  readonly quantite_vendue_total: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
  readonly quantite_stock_moyenne: number;
  readonly quantite_stock_actuel: number;
}

// Fonction utilitaire pour convertir les strings en numbers
const parseNumericValue = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Fonction pour nettoyer les données API
const cleanMonthlyData = (rawData: any[]): MonthlyDetailsRow[] => {
  return rawData.map(row => ({
    nom: String(row.nom || ''),
    code_ean: String(row.code_ean || ''),
    mois: String(row.mois || ''),
    mois_libelle: String(row.mois_libelle || ''),
    type_ligne: row.type_ligne as 'MENSUEL' | 'SYNTHESE' | 'STOCK_MOYEN',
    quantite_vendue: parseNumericValue(row.quantite_vendue),
    quantite_stock: parseNumericValue(row.quantite_stock),
    prix_achat_moyen: parseNumericValue(row.prix_achat_moyen),
    prix_vente_moyen: parseNumericValue(row.prix_vente_moyen),
    taux_marge_moyen: parseNumericValue(row.taux_marge_moyen)
  }));
};

/**
 * Hook useProductsMonthlyDetails - Données mensuelles détaillées produits
 */
export function useProductsMonthlyDetails(
  options: UseProductsMonthlyDetailsOptions = {}
): UseProductsMonthlyDetailsReturn {
  const { enabled = true } = options;
  
  const [monthlyData, setMonthlyData] = useState<MonthlyDetailsRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryTime, setQueryTime] = useState(0);
  const [cached, setCached] = useState(false);
  
  // Refs pour éviter les boucles infinies
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');
  const forceRefreshRef = useRef(false);

  // Récupération des filtres depuis le store Zustand
  const dateRange = useFiltersStore((state) => state.analysisDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Fonction de fetch stable avec useCallback
  const fetchMonthlyDetails = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    console.log('🚀 [Hook] fetchMonthlyDetails called', { forceRefresh, enabled });
    
    if (!enabled) {
      console.log('❌ [Hook] Hook disabled, stopping');
      return;
    }
    
    // Validation des filtres requis
    const hasDateRange = dateRange.start && dateRange.end;
    const hasFilters = productsFilter.length > 0 || laboratoriesFilter.length > 0 || categoriesFilter.length > 0;
    
    console.log('📅 [Hook] Validation:', {
      hasDateRange,
      hasFilters,
      productsCount: productsFilter.length,
      laboratoriesCount: laboratoriesFilter.length,
      categoriesCount: categoriesFilter.length
    });
    
    if (!hasDateRange) {
      console.log('❌ [Hook] Missing date range');
      setMonthlyData([]);
      setError('Veuillez sélectionner une plage de dates dans les filtres');
      setIsLoading(false);
      return;
    }

    if (!hasFilters) {
      console.log('❌ [Hook] No product filters selected');
      setMonthlyData([]);
      setError('Veuillez sélectionner au moins un produit, laboratoire ou catégorie');
      setIsLoading(false);
      return;
    }

    // Préparation de la requête
    const requestBody: MonthlyDetailsRequest = {
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      },
      productCodes: productsFilter,
      laboratoryCodes: laboratoriesFilter,
      categoryCodes: categoriesFilter,
      pharmacyIds: pharmacyFilter.length > 0 ? pharmacyFilter : undefined
    };

    console.log('📤 [Hook] Request body prepared:', requestBody);

    const requestKey = JSON.stringify(requestBody);
    
    // Éviter les requêtes duplicatas SAUF si forceRefresh
    if (!forceRefresh && requestKey === lastRequestRef.current && !error) {
      console.log('🔄 [Hook] Same request, skipping');
      return;
    }

    // Annuler la requête précédente
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
      // Ajouter timestamp pour forcer contournement cache
      const url = forceRefresh 
        ? `/api/products/monthly-details?refresh=${Date.now()}`
        : '/api/products/monthly-details';

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

      const data: MonthlyDetailsResponse = await response.json();
      
      console.log('✅ [Hook] Raw data received:', {
        dataCount: data.monthlyData?.length || 0,
        queryTime: data.queryTime,
        cached: data.cached,
        sampleData: data.monthlyData?.[0]
      });
      
      // Nettoyer et convertir les données
      const cleanedData = cleanMonthlyData(data.monthlyData || []);
      
      setMonthlyData(cleanedData);
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
      setMonthlyData([]);
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
    productsFilter, 
    laboratoriesFilter, 
    categoriesFilter, 
    pharmacyFilter,
    error
  ]);

  // Fonction refetch pour forcer l'actualisation
  const refetch = useCallback(async (): Promise<void> => {
    console.log('🔄 [Hook] Manual refetch triggered');
    forceRefreshRef.current = true;
    await fetchMonthlyDetails(true);
  }, [fetchMonthlyDetails]);

  // Effect pour déclencher le fetch automatiquement
  useEffect(() => {
    console.log('🔄 [Hook] useEffect triggered, enabled:', enabled);
    if (enabled) {
      fetchMonthlyDetails(forceRefreshRef.current);
    }

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        console.log('🧹 [Hook] Cleanup: aborting request');
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, fetchMonthlyDetails]);

  // Calcul des synthèses produits
  const productSummaries = useMemo((): ProductSummary[] => {
    const summariesMap = new Map<string, ProductSummary>();
    
    monthlyData.forEach((row) => {
      if (row.type_ligne === 'SYNTHESE' || row.type_ligne === 'STOCK_MOYEN') {
        const existing = summariesMap.get(row.code_ean);
        
        if (row.type_ligne === 'SYNTHESE') {
          summariesMap.set(row.code_ean, {
            nom: row.nom,
            code_ean: row.code_ean,
            quantite_vendue_total: row.quantite_vendue,
            prix_achat_moyen: row.prix_achat_moyen,
            prix_vente_moyen: row.prix_vente_moyen,
            taux_marge_moyen: row.taux_marge_moyen,
            quantite_stock_moyenne: existing?.quantite_stock_moyenne || 0,
            quantite_stock_actuel: row.quantite_stock
          });
        } else if (row.type_ligne === 'STOCK_MOYEN') {
          const synthese = existing || {
            nom: row.nom,
            code_ean: row.code_ean,
            quantite_vendue_total: 0,
            prix_achat_moyen: 0,
            prix_vente_moyen: 0,
            taux_marge_moyen: 0,
            quantite_stock_moyenne: 0,
            quantite_stock_actuel: 0
          };
          
          summariesMap.set(row.code_ean, {
            ...synthese,
            quantite_stock_moyenne: row.quantite_stock
          });
        }
      }
    });
    
    return Array.from(summariesMap.values());
  }, [monthlyData]);

  // Fonction pour récupérer les détails mensuels d'un produit spécifique
  const getMonthlyDetails = useCallback((codeEan: string): MonthlyDetailsRow[] => {
    return monthlyData.filter(
      row => row.code_ean === codeEan && row.type_ligne === 'MENSUEL'
    ).sort((a, b) => {
      // Tri par ordre chronologique croissant
      return a.mois.localeCompare(b.mois);
    });
  }, [monthlyData]);

  return {
    monthlyData,
    isLoading,
    error,
    isError: !!error,
    queryTime,
    cached,
    count: monthlyData.length,
    refetch,
    hasData: monthlyData.length > 0,
    productSummaries,
    getMonthlyDetails
  };
}