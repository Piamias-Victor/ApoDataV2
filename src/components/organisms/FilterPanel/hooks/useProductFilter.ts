// src/components/organisms/FilterPanel/hooks/useProductFilter.ts
import { useState, useEffect, useCallback } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';

interface Product {
    code_13_ref: string;
    name: string;
    brand_lab: string | null;
    universe: string | null;
    bcb_product_id: string;
    all_codes: string[]; // All codes with same bcb_product_id
}

interface SearchResponse {
    products: Product[];
    count: number;
}

export const useProductFilter = (onClose?: () => void) => {
    const { products: storedProducts, setProducts: setStoredProducts, setTvaRates } = useFilterStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isTvaLoading, setIsTvaLoading] = useState(false);
    // Store by bcb_product_id to avoid duplicates in pinned list
    const [selectedMap, setSelectedMap] = useState<Map<string, { bcb_product_id: string; name: string; all_codes: string[] }>>(new Map());
    // TVA filter state
    const [selectedTvaRates, setSelectedTvaRates] = useState<number[]>([]);

    // Initialize with stored products (group by bcb_product_id)
    useEffect(() => {
        const initialMap = new Map<string, { bcb_product_id: string; name: string; all_codes: string[] }>();

        // Group stored products by bcb_product_id
        const groupedByBcbId: Record<string, { name: string; codes: string[] }> = {};

        storedProducts.forEach(product => {
            const bcbId = product.bcb_product_id?.toString() || product.code;

            if (!groupedByBcbId[bcbId]) {
                groupedByBcbId[bcbId] = {
                    name: product.name,
                    codes: []
                };
            }
            groupedByBcbId[bcbId].codes.push(product.code);
        });

        // Convert to Map
        Object.entries(groupedByBcbId).forEach(([bcbId, data]) => {
            initialMap.set(bcbId, {
                bcb_product_id: bcbId,
                name: data.name,
                all_codes: data.codes
            });
        });

        setSelectedMap(initialMap);
    }, [storedProducts]);

    // Fetch products on mount (default 50) and on search
    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/products/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: searchQuery })
                });

                if (!response.ok) throw new Error('Failed to fetch products');

                const data: SearchResponse = await response.json();
                setResults(data.products);
            } catch (error) {
                console.error('Error fetching products:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchProducts();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // When selecting a product, add ALL codes with the same bcb_product_id
    // Store by bcb_product_id to avoid duplicates
    const handleToggle = useCallback((product: Product) => {
        console.log('[Product Toggle] Toggling product:', product.bcb_product_id, product.name);

        setSelectedMap(prev => {
            const newMap = new Map(prev);
            const key = product.bcb_product_id;

            // Check if this bcb_product_id is already selected
            if (newMap.has(key)) {
                console.log('[Product Toggle] Removing product:', key);
                // Remove this product group
                newMap.delete(key);
            } else {
                console.log('[Product Toggle] Adding product:', key, 'with', product.all_codes.length, 'codes');
                // Add this product group with all its codes
                newMap.set(key, {
                    bcb_product_id: product.bcb_product_id,
                    name: product.name,
                    all_codes: product.all_codes
                });
            }

            console.log('[Product Toggle] New selectedMap size:', newMap.size);
            return newMap;
        });
    }, []); // Empty deps - we use prev state

    const handleRemoveSelection = useCallback((bcb_product_id: string) => {
        setSelectedMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(bcb_product_id);
            return newMap;
        });
    }, []);

    // Select all displayed products (with all their codes)
    const handleSelectAll = useCallback(() => {
        setSelectedMap(prev => {
            const newMap = new Map(prev);
            results.forEach(product => {
                newMap.set(product.bcb_product_id, {
                    bcb_product_id: product.bcb_product_id,
                    name: product.name,
                    all_codes: product.all_codes
                });
            });
            return newMap;
        });
    }, [results]);

    const handleApply = useCallback(() => {
        // Flatten all codes from all selected product groups
        const allSelectedCodes: { code: string; name: string; bcb_product_id?: number }[] = [];
        selectedMap.forEach(productGroup => {
            productGroup.all_codes.forEach(code => {
                allSelectedCodes.push({
                    code,
                    name: productGroup.name,
                    bcb_product_id: parseInt(productGroup.bcb_product_id)
                });
            });
        });
        setStoredProducts(allSelectedCodes);

        // Save TVA rates to store
        if (selectedTvaRates.length > 0) {
            setTvaRates(selectedTvaRates);
        }

        if (onClose) onClose();
    }, [selectedMap, setStoredProducts, selectedTvaRates, setTvaRates, onClose]);

    const handleClearAll = useCallback(() => {
        setSelectedMap(new Map());
    }, []);

    // Check if a product is selected by its bcb_product_id
    const isProductSelected = useCallback((bcb_product_id: string) => {
        return selectedMap.has(bcb_product_id);
    }, [selectedMap]);

    // TVA Filter handlers - Auto-apply on toggle
    const handleToggleTva = useCallback(async (rate: number) => {
        console.log('[TVA Filter] Toggle TVA rate:', rate);
        console.log('[TVA Filter] Current selectedTvaRates:', selectedTvaRates);

        const newRates = selectedTvaRates.includes(rate)
            ? selectedTvaRates.filter(r => r !== rate)
            : [...selectedTvaRates, rate];

        console.log('[TVA Filter] New selectedTvaRates:', newRates);
        setSelectedTvaRates(newRates);

        // If adding a rate, fetch and add products immediately
        if (!selectedTvaRates.includes(rate)) {
            console.log('[TVA Filter] Fetching products for TVA:', rate);
            setIsTvaLoading(true);
            try {
                const response = await fetch('/api/products/by-tva', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tvaRates: [rate] })
                });

                if (!response.ok) {
                    console.error('[TVA Filter] API error:', response.status, response.statusText);
                    throw new Error('Failed to fetch products by TVA');
                }

                const data: SearchResponse = await response.json();
                console.log('[TVA Filter] Received products:', data.products.length);

                // Add products to selection (cumulative)
                setSelectedMap(prev => {
                    const newMap = new Map(prev);
                    console.log('[TVA Filter] Current selectedMap size:', prev.size);

                    data.products.forEach(product => {
                        if (!newMap.has(product.bcb_product_id)) {
                            console.log('[TVA Filter] Adding product:', product.bcb_product_id, product.name);
                            newMap.set(product.bcb_product_id, {
                                bcb_product_id: product.bcb_product_id,
                                name: product.name,
                                all_codes: product.all_codes
                            });
                        } else {
                            console.log('[TVA Filter] Product already exists:', product.bcb_product_id);
                        }
                    });

                    console.log('[TVA Filter] New selectedMap size:', newMap.size);
                    return newMap;
                });

                // Update store with selected TVA rates
                setTvaRates(newRates);
                console.log('[TVA Filter] Updated store with TVA rates:', newRates);

            } catch (error) {
                console.error('[TVA Filter] Error fetching products by TVA:', error);
            } finally {
                setIsTvaLoading(false);
            }
        } else {
            console.log('[TVA Filter] Removing TVA rate, just updating store');
            // If removing a rate, just update the store
            setTvaRates(newRates);
        }
    }, [selectedTvaRates, setTvaRates]);

    return {
        searchQuery,
        setSearchQuery,
        results,
        isLoading,
        selectedMap,
        handleToggle,
        handleRemoveSelection,
        handleApply,
        handleClearAll,
        handleSelectAll,
        isProductSelected,
        // TVA filter
        selectedTvaRates,
        handleToggleTva,
        isTvaLoading
    };
};
