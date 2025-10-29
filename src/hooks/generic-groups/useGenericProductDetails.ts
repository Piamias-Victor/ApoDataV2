// src/hooks/generic-groups/useGenericProductDetails.ts
import { useState, useCallback, useRef } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import type { 
  GenericProductDetail, 
  GenericProductDetailsResponse 
} from '@/types/generic-products-details';

interface UseGenericProductDetailsReturn {
  readonly getDetails: (codeEan: string) => GenericProductDetail[];
  readonly fetchDetails: (codeEan: string) => Promise<void>;
  readonly isLoadingDetails: (codeEan: string) => boolean;
  readonly hasDetails: (codeEan: string) => boolean;
  readonly clearCache: () => void;
}

export function useGenericProductDetails(
  dateRange: { start: string; end: string }
): UseGenericProductDetailsReturn {
  
  // Cache local des détails par code_ean
  const detailsCache = useRef<Map<string, GenericProductDetail[]>>(new Map());
  
  // États de chargement par code_ean
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());
  
  // Filtre pharmacy depuis le store
  const pharmacyIds = useFiltersStore(state => state.pharmacy);

  /**
   * Récupère les détails depuis le cache
   */
  const getDetails = useCallback((codeEan: string): GenericProductDetail[] => {
    return detailsCache.current.get(codeEan) || [];
  }, []);

  /**
   * Vérifie si les détails sont en cache
   */
  const hasDetails = useCallback((codeEan: string): boolean => {
    return detailsCache.current.has(codeEan);
  }, []);

  /**
   * Vérifie si un produit est en cours de chargement
   */
  const isLoadingDetails = useCallback((codeEan: string): boolean => {
    return loadingStates.get(codeEan) || false;
  }, [loadingStates]);

  /**
   * Charge les détails depuis l'API et les met en cache
   */
  const fetchDetails = useCallback(async (codeEan: string): Promise<void> => {
    // Ne pas recharger si déjà en cache
    if (detailsCache.current.has(codeEan)) {
      return;
    }

    // Ne pas lancer plusieurs requêtes simultanées pour le même produit
    if (loadingStates.get(codeEan)) {
      return;
    }

    // Marquer comme en chargement
    setLoadingStates(prev => new Map(prev).set(codeEan, true));

    try {
      const response = await fetch('/api/generic-groups/products-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeEan,
          dateRange,
          pharmacyIds: pharmacyIds.length > 0 ? pharmacyIds : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: GenericProductDetailsResponse = await response.json();

      // Mettre en cache
      detailsCache.current.set(codeEan, data.details);

    } catch (error) {
      console.error('❌ [useGenericProductDetails] Fetch error:', error);
      // En cas d'erreur, mettre un tableau vide pour éviter les recharges infinies
      detailsCache.current.set(codeEan, []);
    } finally {
      // Retirer l'état de chargement
      setLoadingStates(prev => {
        const next = new Map(prev);
        next.delete(codeEan);
        return next;
      });
    }
  }, [dateRange, pharmacyIds]);

  /**
   * Vide le cache (utile lors du changement de dateRange)
   */
  const clearCache = useCallback(() => {
    detailsCache.current.clear();
    setLoadingStates(new Map());
  }, []);

  return {
    getDetails,
    fetchDetails,
    isLoadingDetails,
    hasDetails,
    clearCache
  };
}