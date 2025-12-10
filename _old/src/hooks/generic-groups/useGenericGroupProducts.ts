// src/hooks/generic-groups/useGenericGroupProducts.ts
import { useState, useEffect, useCallback } from 'react';
import { useGenericGroupStore } from '@/stores/useGenericGroupStore';
import { useFiltersStore } from '@/stores/useFiltersStore';

interface ProductMetrics {
  readonly product_name: string;
  readonly code_ean: string;
  readonly avg_sell_price_ttc: number;
  readonly avg_buy_price_ht: number;
  readonly tva_rate: number;
  readonly avg_sell_price_ht: number;
  readonly margin_rate_percent: number;
  readonly unit_margin_ht: number;
  readonly total_margin_ht: number;
  readonly current_stock: number;
  readonly quantity_sold: number;
  readonly ca_ttc: number;
  readonly quantity_bought: number;
  readonly purchase_amount: number;
}

interface ProductsListResponse {
  readonly products: ProductMetrics[];
  readonly count: number;
  readonly queryTime: number;
  readonly cached: boolean;
}

export function useGenericGroupProducts() {
  const [data, setData] = useState<ProductsListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const productCodes = useGenericGroupStore(state => state.productCodes);
  const selectedGroups = useGenericGroupStore(state => state.selectedGroups);
  const analysisDateRange = useFiltersStore(state => state.analysisDateRange);
  const pharmacyFilter = useFiltersStore(state => state.pharmacy);

  const fetchProducts = useCallback(async () => {
    if (selectedGroups.length === 0 || productCodes.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/products/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRange: analysisDateRange,
          productCodes: productCodes,
          laboratoryCodes: [],
          categoryCodes: [],
          ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Erreur chargement produits groupe générique:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroups.length, productCodes, analysisDateRange, pharmacyFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refetch = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    queryTime: data?.queryTime || 0,
    cached: data?.cached || false,
    refetch,
    hasData: !!data && data.products.length > 0,
    products: data?.products || [],
    count: data?.count || 0
  };
}