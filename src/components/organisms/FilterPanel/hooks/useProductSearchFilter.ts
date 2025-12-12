import { useState, useEffect, useCallback } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';

export interface Product {
    code_13_ref: string;
    name: string;
    brand_lab: string | null;
    universe: string | null;
    bcb_product_id: string;
    all_codes: string[];
}

export interface ProductSelection {
    code: string;
    name: string;
    bcb_product_id: number;
}

export interface SearchResponse {
    products: Product[];
    total: number;
}

export const useProductSearchFilter = () => {
    const { products: storedProducts } = useFilterStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMap, setSelectedMap] = useState<Map<string, ProductSelection>>(new Map());

    // Initialize map from global store
    useEffect(() => {
        const initialMap = new Map<string, ProductSelection>();
        const groupedByBcbId: Record<string, { name: string; code: string; bcb_product_id: number }> = {};

        storedProducts.forEach(product => {
            const bcbId = product.bcb_product_id?.toString();
            if (bcbId) {
                groupedByBcbId[bcbId] = {
                    name: product.name,
                    code: product.code,
                    bcb_product_id: parseInt(bcbId)
                };
            }
        });

        Object.entries(groupedByBcbId).forEach(([bcbId, data]) => {
            initialMap.set(bcbId, data);
        });

        setSelectedMap(initialMap);
    }, [storedProducts]);

    // Search Logic
    useEffect(() => {
        const controller = new AbortController();

        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/products/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: searchQuery }),
                    signal: controller.signal
                });

                if (!response.ok) throw new Error('Failed to fetch products');

                const data: SearchResponse = await response.json();
                setResults(data.products);
            } catch (error) {
                if ((error as Error).name === 'AbortError') return;
                console.error('Error fetching products:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchProducts();
        }, 300);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [searchQuery]);

    // Actions
    const handleToggle = (product: Product) => {
        const bcbId = product.bcb_product_id;
        setSelectedMap(prev => {
            const newMap = new Map(prev);
            if (newMap.has(bcbId)) {
                newMap.delete(bcbId);
            } else {
                newMap.set(bcbId, {
                    code: product.code_13_ref,
                    name: product.name,
                    bcb_product_id: parseInt(bcbId)
                });
            }
            return newMap;
        });
    };

    const handleRemoveSelection = (bcb_product_id: string) => {
        setSelectedMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(bcb_product_id);
            return newMap;
        });
    };

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

    const isProductSelected = useCallback((bcb_product_id: string) => {
        return selectedMap.has(bcb_product_id);
    }, [selectedMap]);

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
        isProductSelected,
        searchAndSelectByCodes
    };
};
