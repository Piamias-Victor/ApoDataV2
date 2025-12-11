import { useState, useEffect, useCallback } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';
import { CategoryResult } from './useCategoryFilter';
import { SelectedCategory } from '@/types/filters';

export const useExcludedCategoryFilter = (onClose?: () => void) => {
    const {
        excludedCategories: storedExcludedCategories,
        setExcludedCategories: setStoredExcludedCategories
    } = useFilterStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<CategoryResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMap, setSelectedMap] = useState<Map<string, SelectedCategory>>(new Map());

    // Initialize from store
    useEffect(() => {
        const initialMap = new Map<string, SelectedCategory>();
        storedExcludedCategories.forEach(cat => {
            const key = `${cat.type}:${cat.name}`;
            initialMap.set(key, cat);
        });
        setSelectedMap(initialMap);
    }, [storedExcludedCategories]);

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
                const response = await fetch('/api/categories/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: searchQuery, limit: 50 }),
                    signal: controller.signal
                });
                const data = await response.json();
                setResults(data.categories || []);
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

    const handleToggle = useCallback((cat: CategoryResult) => {
        setSelectedMap(prev => {
            const newMap = new Map(prev);
            const key = `${cat.category_type}:${cat.category_name}`;
            if (newMap.has(key)) {
                newMap.delete(key);
            } else {
                newMap.set(key, {
                    id: key,
                    name: cat.category_name,
                    type: cat.category_type
                });
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
            results.forEach(cat => {
                const key = `${cat.category_type}:${cat.category_name}`;
                newMap.set(key, {
                    id: key,
                    name: cat.category_name,
                    type: cat.category_type
                });
            });
            return newMap;
        });
    }, [results]);

    const handleClearAll = useCallback(() => {
        setSelectedMap(new Map());
    }, []);

    const handleApply = useCallback(() => {
        const allSelected: SelectedCategory[] = Array.from(selectedMap.values());
        setStoredExcludedCategories(allSelected);
        if (onClose) onClose();
    }, [selectedMap, setStoredExcludedCategories, onClose]);

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
