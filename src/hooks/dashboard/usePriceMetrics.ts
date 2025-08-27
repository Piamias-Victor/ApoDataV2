// src/hooks/dashboard/usePriceMetrics.ts
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';

interface UsePriceMetricsOptions {
  enabled?: boolean;
  dateRange: { start: string; end: string };
  productCodes?: string[];
  pharmacyId?: string | undefined;
}

interface PriceMetricsEntry {
  mois: string;
  quantite_vendue_mois: number;
  prix_vente_ttc_moyen: number;
  prix_achat_ht_moyen: number;
  taux_marge_moyen_pourcentage: number;
}

interface PriceMetricsResponse {
  data: PriceMetricsEntry[];
  queryTime: number;
  cached: boolean;
}

interface UsePriceMetricsReturn {
  data: PriceMetricsEntry[] | null;
  isLoading: boolean;
  error: string | null;
  isError: boolean;
  refetch: () => Promise<void>;
  hasData: boolean;
  queryTime: number;
  cached: boolean;
}

interface PriceMetricsRequest {
  dateRange: { start: string; end: string };
  productCodes?: string[];
  pharmacyId?: string | undefined;
}

export function usePriceMetrics({
  enabled = true,
  dateRange,
  productCodes = [],
  pharmacyId
}: UsePriceMetricsOptions): UsePriceMetricsReturn {
  const [data, setData] = useState<PriceMetricsEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryTime, setQueryTime] = useState(0);
  const [cached, setCached] = useState(false);

  // Refs pour éviter les boucles infinies
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');

  // Validation des entrées avec useMemo
  const validationError = useMemo(() => {
    if (!enabled) return null;

    if (!dateRange.start || !dateRange.end) {
      return 'Veuillez sélectionner une plage de dates';
    }

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Format de date invalide';
    }

    if (startDate > endDate) {
      return 'La date de début doit être antérieure à la date de fin';
    }

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      return 'La période ne peut pas dépasser 365 jours';
    }

    return null;
  }, [enabled, dateRange.start, dateRange.end]);

  // Fonction de fetch stable avec useCallback
  const fetchPriceMetrics = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    console.log('🚀 [Hook] fetchPriceMetrics called', { 
      forceRefresh, 
      enabled,
      dateRange,
      productCodesLength: productCodes.length,
      pharmacyId 
    });
    
    if (!enabled) {
      console.log('❌ [Hook] Hook disabled, stopping');
      return;
    }

    if (validationError) {
      console.log('❌ [Hook] Validation error:', validationError);
      setData(null);
      setError(validationError);
      setIsLoading(false);
      return;
    }

    // Construction de l'objet requête
    const requestBody: PriceMetricsRequest = {
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      }
    };

    // Ajout conditionnel des filtres
    if (productCodes && productCodes.length > 0) {
      requestBody.productCodes = productCodes;
    }

    if (pharmacyId && pharmacyId.trim()) {
      requestBody.pharmacyId = pharmacyId.trim();
    }

    const requestKey = JSON.stringify(requestBody) + (forceRefresh ? '_force' : '');
    
    // Éviter les requêtes duplicatas
    if (requestKey === lastRequestRef.current && !forceRefresh) {
      console.log('🔄 [Hook] Request identical, skipping');
      return;
    }

    // Annuler requête précédente si en cours
    if (abortControllerRef.current) {
      console.log('⛔ [Hook] Aborting previous request');
      abortControllerRef.current.abort();
    }

    console.log('📡 [Hook] Starting price metrics fetch request', {
      dateRange: requestBody.dateRange,
      hasProductCodes: !!requestBody.productCodes,
      productCodesCount: requestBody.productCodes?.length || 0,
      hasPharmacyId: !!requestBody.pharmacyId,
      forceRefresh
    });

    abortControllerRef.current = new AbortController();
    lastRequestRef.current = requestKey;
    
    setIsLoading(true);
    setError(null);

    try {
      const startTime = Date.now();
      
      const response = await fetch('/api/price-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(forceRefresh && { 'Cache-Control': 'no-cache' })
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: PriceMetricsResponse = await response.json();
      const totalTime = Date.now() - startTime;

      console.log('✅ [Hook] Price metrics fetched successfully', {
        dataLength: result.data.length,
        firstEntry: result.data[0] || null,
        lastEntry: result.data[result.data.length - 1] || null,
        queryTime: result.queryTime,
        totalTime,
        cached: result.cached
      });

      // Validation supplémentaire des données reçues
      const validEntries = result.data.filter(entry => 
        entry && 
        typeof entry === 'object' && 
        'mois' in entry &&
        typeof entry.quantite_vendue_mois === 'number' &&
        typeof entry.prix_vente_ttc_moyen === 'number'
      );

      console.log('📊 [Hook] Data validation:', {
        totalReceived: result.data.length,
        validEntries: validEntries.length,
        invalidEntries: result.data.length - validEntries.length,
        sampleValidEntry: validEntries[0] || null
      });

      // Stats sur les données reçues
      if (validEntries.length > 0) {
        const totalQuantity = validEntries.reduce((sum, entry) => sum + entry.quantite_vendue_mois, 0);
        const avgPrice = validEntries.reduce((sum, entry) => sum + entry.prix_vente_ttc_moyen, 0) / validEntries.length;
        
        console.log('📈 [Hook] Data summary:', {
          monthsCount: validEntries.length,
          totalQuantity,
          avgSellingPrice: Math.round(avgPrice * 100) / 100,
          avgMarginRate: validEntries.reduce((sum, entry) => sum + entry.taux_marge_moyen_pourcentage, 0) / validEntries.length
        });
      }

      setData(result.data);
      setQueryTime(result.queryTime);
      setCached(result.cached);
      setError(null);

    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        console.log('⛔ [Hook] Request aborted');
        return;
      }

      console.error('💥 [Hook] Price metrics fetch error:', fetchError);
      
      const errorMessage = fetchError.message?.includes('période ne peut pas dépasser') 
        ? 'La période sélectionnée dépasse la limite de 365 jours'
        : fetchError.message?.includes('Date range')
        ? 'Veuillez vérifier votre plage de dates'
        : fetchError.message?.includes('Unauthorized')
        ? 'Accès non autorisé - veuillez vous reconnecter'
        : 'Erreur lors du chargement des métriques de prix';

      setData(null);
      setError(errorMessage);
      setQueryTime(0);
      setCached(false);

    } finally {
      setIsLoading(false);
    }
  }, [enabled, validationError, dateRange, productCodes, pharmacyId]);

  // Fonction refetch pour force refresh
  const refetch = useCallback(async () => {
    console.log('🔄 [Hook] Manual refetch triggered');
    await fetchPriceMetrics(true);
  }, [fetchPriceMetrics]);

  // État dérivé pour hasData
  const hasData = useMemo(() => {
    return data !== null && data.length > 0;
  }, [data]);

  // État dérivé pour isError
  const isError = useMemo(() => {
    return error !== null;
  }, [error]);

  // Auto-fetch quand les dépendances changent
  const dependencyString = JSON.stringify({
    enabled,
    dateRange,
    productCodes,
    pharmacyId
  });

  useEffect(() => {
    fetchPriceMetrics();
  }, [dependencyString, fetchPriceMetrics]);

  return {
    data,
    isLoading,
    error,
    isError,
    refetch,
    hasData,
    queryTime,
    cached
  };
}