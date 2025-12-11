import { useState, useEffect, useCallback } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';
import { Laboratory } from './useLaboratoryFilter';
import { SelectedLaboratory } from '@/types/filters';

export const useExcludedLaboratoryFilter = (onClose?: () => void) => {
    const {
        excludedLaboratories: storedExcludedLaboratories,
        setExcludedLaboratories: setStoredExcludedLaboratories
    } = useFilterStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Laboratory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMap, setSelectedMap] = useState<Map<string, SelectedLaboratory>>(new Map());

    // Initialize from store
    useEffect(() => {
        const initialMap = new Map<string, SelectedLaboratory>();
        storedExcludedLaboratories.forEach(lab => {
            initialMap.set(lab.id, lab);
        });
        setSelectedMap(initialMap);
    }, [storedExcludedLaboratories]);

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
                const response = await fetch('/api/laboratories/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: searchQuery,
                        limit: 50,
                        mode: 'laboratory',
                        labOrBrandMode: 'laboratory'
                    }),
                    signal: controller.signal
                });
                const data = await response.json();
                setResults(data.laboratories || []);
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

    const handleToggle = useCallback((lab: Laboratory) => {
        setSelectedMap(prev => {
            const newMap = new Map(prev);
            const key = lab.laboratory_name; // Use laboratory_name as unique key
            if (newMap.has(key)) {
                newMap.delete(key);
            } else {
                newMap.set(key, { id: key, name: lab.laboratory_name });
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
            results.forEach(lab => {
                const key = lab.laboratory_name;
                newMap.set(key, { id: key, name: lab.laboratory_name });
            });
            return newMap;
        });
    }, [results]);

    const handleClearAll = useCallback(() => {
        setSelectedMap(new Map());
    }, []);

    const handleApply = useCallback(() => {
        const allSelected: SelectedLaboratory[] = Array.from(selectedMap.values());
        setStoredExcludedLaboratories(allSelected);
        if (onClose) onClose();
    }, [selectedMap, setStoredExcludedLaboratories, onClose]);

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
