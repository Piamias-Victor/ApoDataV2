// src/hooks/dashboard/useStockCharts.ts
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';

interface UseStockChartsOptions {
  enabled?: boolean;
  dateRange: { start: string; end: string };
  productCodes?: string[];
  pharmacyId?: string | undefined;
}

interface StockChartsEntry {
  periode: string;
  quantite_stock: number;
  jours_stock: number | null;
  quantite_vendue: number;
}

interface StockChartsResponse {
  data: StockChartsEntry[];
  queryTime: number;
  cached: boolean;
}

interface UseStockChartsReturn {
  data: StockChartsEntry[] | null;
  isLoading: boolean;
  error: string | null;
  isError: boolean;
  refetch: () => Promise<void>;
  hasData: boolean;
  queryTime: number;
  cached: boolean;
}

interface StockChartsRequest {
  dateRange: { start: string; end: string };
  productCodes?: string[];
  pharmacyId?: string | undefined;
}

export function useStockCharts({
  enabled = true,
  dateRange,
  productCodes = [],
  pharmacyId
}: UseStockChartsOptions): UseStockChartsReturn {
  const [data, setData] = useState<StockChartsEntry[] | null>(null);
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
  const fetchStockCharts = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    console.log('🚀 [Hook] fetchStockCharts called', { 
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
    const requestBody: StockChartsRequest = {
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

    console.log('📡 [Hook] Starting stock charts fetch request', {
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
      
      const response = await fetch('/api/stock-charts', {
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

      const result: StockChartsResponse = await response.json();
      const totalTime = Date.now() - startTime;

      console.log('✅ [Hook] Stock charts fetched successfully', {
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
        'periode' in entry &&
        typeof entry.quantite_stock === 'number' &&
        typeof entry.quantite_vendue === 'number'
      );

      console.log('📊 [Hook] Data validation:', {
        totalReceived: result.data.length,
        validEntries: validEntries.length,
        invalidEntries: result.data.length - validEntries.length,
        sampleValidEntry: validEntries[0] || null
      });

      // Stats sur les données reçues
      if (validEntries.length > 0) {
        const totalStock = validEntries.reduce((sum, entry) => sum + entry.quantite_stock, 0);
        const totalSales = validEntries.reduce((sum, entry) => sum + entry.quantite_vendue, 0);
        const avgStockDays = validEntries
          .filter(entry => entry.jours_stock !== null)
          .reduce((sum, entry) => sum + (entry.jours_stock || 0), 0) / 
          validEntries.filter(entry => entry.jours_stock !== null).length;
        
        console.log('📈 [Hook] Data summary:', {
          monthsCount: validEntries.length,
          totalStock,
          totalSales,
          avgStockDays: Math.round(avgStockDays * 100) / 100 || 0
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

      console.error('💥 [Hook] Stock charts fetch error:', fetchError);
      
      const errorMessage = fetchError.message?.includes('période ne peut pas dépasser') 
        ? 'La période sélectionnée dépasse la limite de 365 jours'
        : fetchError.message?.includes('Date range')
        ? 'Veuillez vérifier votre plage de dates'
        : fetchError.message?.includes('Unauthorized')
        ? 'Accès non autorisé - veuillez vous reconnecter'
        : 'Erreur lors du chargement des graphiques de stock';

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
    await fetchStockCharts(true);
  }, [fetchStockCharts]);

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
    fetchStockCharts();
  }, [dependencyString, fetchStockCharts]);

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