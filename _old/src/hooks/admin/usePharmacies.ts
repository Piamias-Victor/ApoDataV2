// src/hooks/admin/usePharmacies.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/shared/useDebounce';
import type { PharmaciesResponse, PharmacyFilters } from '@/types/pharmacy';

interface UsePharmaciesReturn {
  readonly data: PharmaciesResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly filters: PharmacyFilters;
  readonly setSearch: (search: string) => void;
  readonly setPage: (page: number) => void;
  readonly refetch: () => void;
}

/**
 * Hook pour gérer la récupération des pharmacies côté admin
 */
export function usePharmacies(): UsePharmaciesReturn {
  const [data, setData] = useState<PharmaciesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PharmacyFilters>({
    search: '',
    page: 1,
    limit: 20
  });
  
  // Debounce de la recherche pour éviter trop de requêtes
  const debouncedSearch = useDebounce(filters.search || '', 300);
  
  const fetchPharmacies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('page', filters.page?.toString() || '1');
      params.append('limit', filters.limit?.toString() || '20');
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      
      const response = await fetch(`/api/admin/pharmacies?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Accès refusé - Droits admin requis');
        }
        throw new Error('Erreur lors de la récupération des pharmacies');
      }
      
      const result = await response.json();
      setData(result);
      
    } catch (err) {
      console.error('Error fetching pharmacies:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, debouncedSearch]);
  
  // Fetch initial et lors des changements de filtres
  useEffect(() => {
    fetchPharmacies();
  }, [fetchPharmacies]);
  
  // Handlers pour mise à jour des filtres
  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 })); // Reset page on search
  }, []);
  
  const setPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);
  
  return {
    data,
    loading,
    error,
    filters,
    setSearch,
    setPage,
    refetch: fetchPharmacies
  };
}