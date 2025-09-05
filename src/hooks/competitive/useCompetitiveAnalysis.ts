// src/hooks/competitive/useCompetitiveAnalysis.ts
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';

interface CompetitiveMetrics {
 readonly product_name: string;
 readonly code_ean: string;
 readonly prix_vente_min_global: number;
 readonly prix_vente_max_global: number;
 readonly prix_vente_moyen_global: number;
 readonly nb_pharmacies_vendant: number;
 readonly prix_vente_moyen_selection: number;
 readonly prix_achat_moyen_ht: number;
 readonly quantite_vendue_selection: number;
 readonly taux_marge_moyen_selection: number;
 readonly ecart_prix_vs_marche_pct: number;
}

interface CompetitiveAnalysisResponse {
 readonly products: CompetitiveMetrics[];
 readonly count: number;
 readonly queryTime: number;
 readonly cached: boolean;
}

interface UseCompetitiveAnalysisOptions {
 readonly enabled?: boolean;
}

interface UseCompetitiveAnalysisReturn {
 readonly products: CompetitiveMetrics[];
 readonly isLoading: boolean;
 readonly error: string | null;
 readonly isError: boolean;
 readonly queryTime: number;
 readonly cached: boolean;
 readonly count: number;
 readonly refetch: () => Promise<void>;
 readonly hasData: boolean;
}

/**
* Hook useCompetitiveAnalysis - VERSION STANDARDISÉE
* 
* Logique sécurisée :
* - Admin SANS pharmacie → mes prix = marché global
* - Admin AVEC pharmacie(s) → marché exclu sélection
* - User → marché exclu ma pharmacie
*/
export function useCompetitiveAnalysis(
 options: UseCompetitiveAnalysisOptions = {}
): UseCompetitiveAnalysisReturn {
 
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

 const result = useStandardFetch<CompetitiveAnalysisResponse>('/api/competitive-analysis', {
   enabled: options.enabled,
   dateRange: analysisDateRange,
   filters: standardFilters
 });

 return {
   products: result.data?.products || [],
   isLoading: result.isLoading,
   error: result.error,
   isError: result.isError,
   queryTime: result.data?.queryTime || 0,
   cached: result.data?.cached || false,
   count: result.data?.count || 0,
   refetch: result.refetch,
   hasData: (result.data?.products?.length || 0) > 0
 };
}