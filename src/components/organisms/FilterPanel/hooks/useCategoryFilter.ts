import { useState, useEffect } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';
import { SelectedCategory } from '@/types/filters';

export interface CategoryResult {
    readonly category_name: string;
    readonly category_type: 'bcb_segment_l0' | 'bcb_segment_l1' | 'bcb_segment_l2' | 'bcb_segment_l3' | 'bcb_segment_l4' | 'bcb_segment_l5' | 'bcb_family';
    readonly product_count: number;
    readonly product_codes: string[];
}

interface SearchResponse {
    readonly categories: CategoryResult[];
    readonly count: number;
    readonly queryTime: number;
}

export const useCategoryFilter = (onClose?: () => void) => {
    // Global Store
    const { categories: storedCategories, setCategories: setStoredCategories } = useFilterStore();

    // Local State
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<CategoryResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Temporary selection state
    // We use a Map keyed by "type:name" to ensure uniqueness across hierarchy levels
    const [selectedMap, setSelectedMap] = useState<Map<string, SelectedCategory>>(new Map());

    // Helper to create unique key
    const getCategoryKey = (type: string, name: string) => `${type}:${name}`;

    // Initialize selectedMap from store
    useEffect(() => {
        const initialMap = new Map<string, SelectedCategory>();
        storedCategories.forEach(cat => {
            initialMap.set(getCategoryKey(cat.type, cat.name), cat);
        });
        setSelectedMap(initialMap);
    }, [storedCategories]);

    // Search Effect - Triggered on Mount (empty query) AND on query change
    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/categories/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: searchQuery.trim(),
                    }),
                });

                if (!response.ok) throw new Error('Erreur réseau');

                const data: SearchResponse = await response.json();
                setResults(data.categories);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setError('Erreur lors de la recherche');
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchCategories, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Handlers
    const handleToggle = (cat: CategoryResult) => {
        const key = getCategoryKey(cat.category_type, cat.category_name);

        setSelectedMap(prev => {
            const next = new Map(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.set(key, {
                    name: cat.category_name,
                    type: cat.category_type,
                    productCodes: cat.product_codes
                });
            }
            return next;
        });
    };

    const handleRemoveSelection = (key: string) => {
        setSelectedMap(prev => {
            const next = new Map(prev);
            next.delete(key);
            return next;
        });
    };

    const handleApply = () => {
        setStoredCategories(Array.from(selectedMap.values()));
        if (onClose) onClose();
    };

    const handleClearAll = () => {
        setSelectedMap(new Map());
    };

    return {
        searchQuery, setSearchQuery,
        results,
        isLoading,
        selectedMap,
        handleToggle,
        handleRemoveSelection,
        handleApply,
        handleClearAll,
        getCategoryKey
    };
};
