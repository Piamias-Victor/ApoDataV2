// src/hooks/price/usePriceEvolution.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';

interface PriceEvolutionMetrics {
  readonly evolution_prix_vente_pct: number;
  readonly evolution_prix_achat_pct: number;
  readonly evolution_marge_pct: number;
  readonly ecart_prix_vs_marche_pct: number;
  readonly nb_produits_analyses: number;
}

interface PriceEvolutionResponse {
  readonly metrics: PriceEvolutionMetrics;
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UsePriceEvolutionOptions {
  readonly enabled?: boolean;
}

interface UsePriceEvolutionReturn {
  readonly metrics: PriceEvolutionMetrics | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
}

/**
 * Hook usePriceEvolution - VERSION SIMPLIFIÉE
 * 
 * ✅ Utilise directement products du store (contient logique ET/OU + exclusions)
 */
export function usePriceEvolution(
  options: UsePriceEvolutionOptions = {}
): UsePriceEvolutionReturn {
  
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // 🔥 Lecture directe de products (contient déjà logique ET/OU + exclusions)
  const products = useFiltersStore((state) => state.products);
  const excludedProducts = useFiltersStore((state) => state.excludedProducts);

  console.log('🎯 [usePriceEvolution] Using products from store:', {
    total: products.length,
    excluded: excludedProducts.length
  });

  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: products,
    ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
  };

  const result = useStandardFetch<PriceEvolutionResponse>('/api/price-evolution', {
    enabled: options.enabled,
    dateRange: analysisDateRange,
    filters: standardFilters
  });

  return {
    metrics: result.data?.metrics || null,
    isLoading: result.isLoading,
    error: result.error,
    isError: result.isError,
    queryTime: result.data?.queryTime || 0,
    cached: result.data?.cached || false,
    refetch: result.refetch,
    hasData: !!result.data?.metrics
  };
}