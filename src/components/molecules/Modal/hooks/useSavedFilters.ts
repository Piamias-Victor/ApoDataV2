// src/components/molecules/Modal/hooks/useSavedFilters.ts
import { useState, useEffect, useCallback } from 'react';

export interface SavedFilter {
    id: number;
    name: string;
    description: string | null;
    filter_data: any;
    created_at: string;
}

/**
 * Hook to manage saved filters (fetch, delete)
 */
export const useSavedFilters = () => {
    const [filters, setFilters] = useState<SavedFilter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchFilters = useCallback(async () => {
        try {
            setIsLoading(true);
            setError('');
            const response = await fetch('/api/filters/list');
            if (!response.ok) throw new Error('Erreur de chargement');
            const data = await response.json();
            setFilters(data.filters || []);
        } catch (err) {
            setError('Erreur lors du chargement des filtres');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteFilter = useCallback(async (id: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce filtre ?')) return false;

        try {
            const response = await fetch(`/api/filters/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Erreur de suppression');
            await fetchFilters(); // Refresh list
            return true;
        } catch (err) {
            alert('Erreur lors de la suppression');
            console.error(err);
            return false;
        }
    }, [fetchFilters]);

    useEffect(() => {
        fetchFilters();
    }, [fetchFilters]);

    return {
        filters,
        isLoading,
        error,
        fetchFilters,
        deleteFilter
    };
};
