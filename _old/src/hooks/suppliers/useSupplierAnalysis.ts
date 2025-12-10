// src/hooks/suppliers/useSupplierAnalysis.ts
import { useState, useEffect, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';

export interface SupplierMetrics {
  readonly supplier_category: string;
  readonly nb_commandes: number;
  readonly quantity_bought: number;
  readonly ca_achats: number;
  readonly nb_produits_distincts: number;
}

export interface SupplierAnalysisTotal {
  readonly nb_commandes: number;
  readonly quantity_bought: number;
  readonly ca_achats: number;
  readonly nb_produits_distincts: number;
}

interface UseSupplierAnalysisOptions {
  readonly enabled: boolean;
  readonly dateRange: { start: string; end: string };
  readonly productCodes?: string[];
}

interface UseSupplierAnalysisReturn {
  readonly data: SupplierMetrics[];
  readonly total: SupplierAnalysisTotal | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
}

export function useSupplierAnalysis(
  options: UseSupplierAnalysisOptions
): UseSupplierAnalysisReturn {
  const [data, setData] = useState<SupplierMetrics[]>([]);
  const [total, setTotal] = useState<SupplierAnalysisTotal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pharmacyIds = useFiltersStore(state => state.pharmacy);
  const { enabled, dateRange, productCodes = [] } = options;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/suppliers/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange,
          pharmacyIds,
          productCodes
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result = await response.json();
      setData(result.suppliers);
      setTotal(result.total);
    } catch (err) {
      console.error('Supplier analysis error:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, dateRange, pharmacyIds, productCodes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    total,
    isLoading,
    error,
    refetch
  };
}