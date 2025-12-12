import { useState, useEffect, useCallback } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';
import { SelectedPharmacy } from '@/types/filters';

export const useExcludedPharmacyFilter = (onClose?: () => void) => {
    const {
        excludedPharmacies: storedExcludedPharmacies,
        setExcludedPharmacies: setStoredExcludedPharmacies
    } = useFilterStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SelectedPharmacy[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMap, setSelectedMap] = useState<Map<string, SelectedPharmacy>>(new Map());

    // Initialize from store
    useEffect(() => {
        const initialMap = new Map<string, SelectedPharmacy>();
        storedExcludedPharmacies.forEach(p => {
            initialMap.set(p.id, p);
        });
        setSelectedMap(initialMap);
    }, [storedExcludedPharmacies]);

    // Search logic
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/pharmacies/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: searchQuery,
                        limit: 50
                    }),
                    signal: controller.signal
                });
                const data = await response.json();
                setResults(data.pharmacies || []);
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error('Search error:', error);
                }
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [searchQuery]);

    const handleToggle = useCallback((pharmacy: SelectedPharmacy) => {
        setSelectedMap(prev => {
            const newMap = new Map(prev);
            const key = pharmacy.id;
            if (newMap.has(key)) {
                newMap.delete(key);
            } else {
                newMap.set(key, pharmacy);
            }
            return newMap;
        });
    }, []);

    const handleRemoveSelection = useCallback((id: string) => {
        setSelectedMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        setSelectedMap(prev => {
            const newMap = new Map(prev);
            results.forEach(p => {
                newMap.set(p.id, p);
            });
            return newMap;
        });
    }, [results]);

    const handleClearAll = useCallback(() => {
        setSelectedMap(new Map());
    }, []);

    const handleApply = useCallback(() => {
        const allSelected: SelectedPharmacy[] = Array.from(selectedMap.values());
        setStoredExcludedPharmacies(allSelected);
        if (onClose) onClose();
    }, [selectedMap, setStoredExcludedPharmacies, onClose]);

    return {
        searchQuery,
        setSearchQuery,
        results,
        isLoading,
        selectedMap,
        handleToggle,
        handleRemoveSelection,
        handleSelectAll,
        handleClearAll,
        handleApply
    };
};
