// src/hooks/generic-groups/useGenericKpiMetrics.ts
import { useGenericGroupStore } from '@/stores/useGenericGroupStore';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { BaseHookReturn } from '@/hooks/common/types';

interface KpiMetricsResponse {
  readonly ca_ttc: number;
  readonly montant_achat_ht: number;
  readonly montant_marge: number;
  readonly pourcentage_marge: number;
  readonly valeur_stock_ht: number;
  readonly quantite_stock: number;
  readonly quantite_vendue: number;
  readonly quantite_achetee: number;
  readonly jours_de_stock: number | null;
  readonly nb_references_produits: number;
  readonly nb_pharmacies: number;
  readonly comparison?: {
    readonly ca_ttc: number;
    readonly montant_achat_ht: number;
    readonly montant_marge: number;
    readonly quantite_vendue: number;
    readonly quantite_achetee: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseGenericKpiMetricsOptions {
  readonly enabled?: boolean;
  readonly includeComparison?: boolean;
  readonly dateRange: { start: string; end: string };
  readonly comparisonDateRange?: { start: string | null; end: string | null } | undefined;
}

interface UseGenericKpiMetricsReturn extends BaseHookReturn<KpiMetricsResponse> {
  readonly isGlobalMode: boolean;
}

/**
 * Hook useGenericKpiMetrics - VERSION AVEC FILTRE PHARMACIE ET DETECTION FILTRES ACTIFS
 * 
 * Pattern standardisé :
 * - Récupération automatique du filtre pharmacie depuis useFiltersStore
 * - Détection des filtres actifs (TVA, prix, statut générique)
 * - Transmission via filters.pharmacyIds si pharmacyFilter présent
 * - Mode global : /api/kpis/generic-global (tous génériques + référents) SEULEMENT si aucun filtre actif
 * - Si productCodes=[] ET filtres actifs : Pas d'appel API (affichage message "aucun résultat")
 */
export function useGenericKpiMetrics(
  options: UseGenericKpiMetricsOptions
): UseGenericKpiMetricsReturn {
  const productCodes = useGenericGroupStore((state) => state.productCodes);
  const selectedGroups = useGenericGroupStore((state) => state.selectedGroups);
  
  // Récupération du filtre pharmacie depuis le store (pattern standard)
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);
  
  // 🔥 Vérifier si des filtres sont actifs
  const hasActiveFilters = useGenericGroupStore((state) => {
    const hasSelections = state.selectedGroups.length > 0 || 
                         state.selectedProducts.length > 0 || 
                         state.selectedLaboratories.length > 0;
    const hasFilters = state.hasPriceFilters() || 
                      state.tvaRates.length > 0 || 
                      state.genericStatus !== 'BOTH';
    return hasSelections || hasFilters;
  });
  
  // 🔥 Mode global SI aucun code ET aucun filtre actif
  const isGlobalMode = productCodes.length === 0 && !hasActiveFilters;
  
  // 🔥 NOUVEAU - Ne pas appeler l'API si productCodes=[] avec filtres actifs
  const shouldFetch = !(productCodes.length === 0 && hasActiveFilters);
  
  console.log('🎯 [useGenericKpiMetrics] Configuration:', {
    isGlobalMode,
    hasActiveFilters,
    shouldFetch,
    groupsCount: selectedGroups.length,
    groupNames: selectedGroups.map(g => g.generic_group),
    productCodesCount: productCodes.length,
    pharmacyFilterCount: pharmacyFilter.length,
    pharmacyIds: pharmacyFilter.slice(0, 3),
    productCodes: productCodes.slice(0, 5)
  });

  // Utiliser l'API globale si pas de codes ET pas de filtres, sinon l'API classique
  const apiEndpoint = isGlobalMode ? '/api/kpis/generic-global' : '/api/kpis';
  
  // Construction des filtres selon le mode
  const filters = isGlobalMode 
    ? {
        // Mode global : uniquement pharmacyIds si présent
        ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
      }
    : {
        // Mode sélection/filtré : productCodes + pharmacyIds si présent
        productCodes: productCodes,
        ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
      };

  console.log('📋 [useGenericKpiMetrics] Filters:', {
    endpoint: apiEndpoint,
    filters,
    hasPharmacyFilter: pharmacyFilter.length > 0
  });
  
  const fetchResult = useStandardFetch<KpiMetricsResponse>(apiEndpoint, {
    enabled: options.enabled && shouldFetch, // 🔥 MODIFIÉ - Ajout shouldFetch
    dateRange: options.dateRange,
    comparisonDateRange: options.comparisonDateRange,
    includeComparison: options.includeComparison,
    filters
  });

  return {
    ...fetchResult,
    isGlobalMode
  };
}