// src/components/organisms/FilterPanel/hooks/useExcludedProductFilter.ts
import { useState, useEffect, useCallback } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';
import { Product, ProductSelection, SearchResponse } from './useProductFilter';

export const useExcludedProductFilter = (onClose?: () => void) => {
    const {
        excludedProducts: storedExcludedProducts,
        setExcludedProducts: setStoredExcludedProducts
    } = useFilterStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMap, setSelectedMap] = useState<Map<string, ProductSelection>>(new Map());

    // Initialize from store
    useEffect(() => {
        const initialMap = new Map<string, ProductSelection>();
        storedExcludedProducts.forEach(product => {
            const bcbId = product.bcb_product_id?.toString();
            if (bcbId) {
                initialMap.set(bcbId, {
                    bcb_product_id: parseInt(bcbId),
                    name: product.name,
                    code: product.code
                });
            }
        });
        setSelectedMap(initialMap);
    }, [storedExcludedProducts]);

    // Search logic (same as useProductFilter)
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/products/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: searchQuery, limit: 50 }),
                    signal: controller.signal
                });
                const data: SearchResponse = await response.json();
                setResults(data.products);
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

    const handleToggle = useCallback((product: Product) => {
        setSelectedMap(prev => {
            const newMap = new Map(prev);
            const key = product.bcb_product_id;
            if (newMap.has(key)) {
                newMap.delete(key);
            } else {
                newMap.set(key, {
                    bcb_product_id: parseInt(product.bcb_product_id),
                    name: product.name,
                    code: product.code_13_ref
                });
            }
            return newMap;
        });
    }, []);

    const handleRemoveSelection = useCallback((bcb_product_id: string) => {
        setSelectedMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(bcb_product_id);
            return newMap;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        setSelectedMap(prev => {
            const newMap = new Map(prev);
            results.forEach(product => {
                const key = product.bcb_product_id;
                newMap.set(key, {
                    bcb_product_id: parseInt(product.bcb_product_id),
                    name: product.name,
                    code: product.code_13_ref
                });
            });
            return newMap;
        });
    }, [results]);

    const handleClearAll = useCallback(() => {
        setSelectedMap(new Map());
    }, []);

    const searchAndSelectByCodes = async (codes: string[]) => {
        if (codes.length === 0) return;

        try {
            setIsLoading(true);
            const searchPromises = codes.map(code =>
                fetch('/api/products/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: code, limit: 50 })
                }).then(res => res.json())
            );

            const responses = await Promise.all(searchPromises);

            setSelectedMap(prev => {
                const newMap = new Map(prev);
                responses.forEach((response: SearchResponse) => {
                    response.products.forEach(product => {
                        const bcbId = product.bcb_product_id;
                        if (!newMap.has(bcbId)) {
                            newMap.set(bcbId, {
                                code: product.code_13_ref,
                                name: product.name,
                                bcb_product_id: parseInt(bcbId)
                            });
                        }
                    });
                });
                return newMap;
            });
        } catch (error) {
            console.error('Error searching codes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = useCallback(() => {
        const allSelected: ProductSelection[] = Array.from(selectedMap.values());
        setStoredExcludedProducts(allSelected);
        if (onClose) onClose();
    }, [selectedMap, setStoredExcludedProducts, onClose]);

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
        handleApply,
        searchAndSelectByCodes
    };
};
