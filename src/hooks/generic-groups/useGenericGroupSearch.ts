// src/hooks/generic-groups/useGenericGroupSearch.ts
import { useState, useEffect, useCallback } from 'react';
import { useGenericGroupStore } from '@/stores/useGenericGroupStore';

export type SearchMode = 'group' | 'molecule' | 'code';

export interface GenericGroup {
  readonly generic_group: string;
  readonly product_count: number;
  readonly referent_name: string | null;
  readonly referent_code: string | null;
  readonly referent_lab: string | null;
  readonly generic_count: number;
  readonly product_codes: string[];
}

interface SearchResponse {
  readonly groups: GenericGroup[];
  readonly count: number;
  readonly queryTime: number;
  readonly mode: SearchMode;
}

interface UseGenericGroupSearchReturn {
  readonly groups: GenericGroup[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
  readonly searchMode: SearchMode;
  readonly setSearchMode: (mode: SearchMode) => void;
  readonly selectedGroup: GenericGroup | null;
  readonly selectGroup: (group: GenericGroup) => void;
  readonly clearSelection: () => void;
  readonly productCodes: string[];
}

export function useGenericGroupSearch(): UseGenericGroupSearchReturn {
  const [groups, setGroups] = useState<GenericGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('group');
  
  // Récupération depuis le store
  const selectedGroup = useGenericGroupStore(state => state.selectedGroup);
  const productCodes = useGenericGroupStore(state => state.productCodes);
  const setSelectedGroup = useGenericGroupStore(state => state.setSelectedGroup);
  const clearSelectedGroup = useGenericGroupStore(state => state.clearSelectedGroup);

  const performSearch = useCallback(async (query: string, mode: SearchMode) => {
    if (!query || query.trim().length < 2) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generic-groups/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: query.trim(),
          mode 
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      setGroups(data.groups);

    } catch (err) {
      console.error('Erreur recherche groupes génériques:', err);
      setError('Erreur lors de la recherche');
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery, searchMode);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchMode, performSearch]);

  const selectGroup = useCallback((group: GenericGroup) => {
    setSelectedGroup(group);
  }, [setSelectedGroup]);

  const clearSelection = useCallback(() => {
    clearSelectedGroup();
  }, [clearSelectedGroup]);

  return {
    groups,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    selectedGroup,
    selectGroup,
    clearSelection,
    productCodes,
  };
}