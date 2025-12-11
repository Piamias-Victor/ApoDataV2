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
    const { products: storedProducts, setProducts: setStoredProducts } = useFilterStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    // Store by bcb_product_id to avoid duplicates in pinned list
    const [selectedMap, setSelectedMap] = useState<Map<string, { bcb_product_id: string; name: string; all_codes: string[] }>>(new Map());

    // Initialize with stored products (group by bcb_product_id)
    useEffect(() => {
        const initialMap = new Map<string, { bcb_product_id: string; name: string; all_codes: string[] }>();
        // Group stored products by bcb_product_id (we'll need to fetch this info)
        storedProducts.forEach(product => {
            // For now, just add individual codes (will be improved)
            initialMap.set(product.code, {
                bcb_product_id: product.code,
                name: product.name,
                all_codes: [product.code]
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
        setSelectedMap(prev => {
            const newMap = new Map(prev);
            const key = product.bcb_product_id;

            // Check if this bcb_product_id is already selected
            if (newMap.has(key)) {
                // Remove this product group
                newMap.delete(key);
            } else {
                // Add this product group with all its codes
                newMap.set(key, {
                    bcb_product_id: product.bcb_product_id,
                    name: product.name,
                    all_codes: product.all_codes
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
        const allSelectedCodes: { code: string; name: string }[] = [];
        selectedMap.forEach(productGroup => {
            productGroup.all_codes.forEach(code => {
                allSelectedCodes.push({ code, name: productGroup.name });
            });
        });
        setStoredProducts(allSelectedCodes);
        if (onClose) onClose();
    }, [selectedMap, setStoredProducts, onClose]);

    const handleClearAll = useCallback(() => {
        setSelectedMap(new Map());
    }, []);

    // Check if a product is selected by its bcb_product_id
    const isProductSelected = useCallback((bcb_product_id: string) => {
        return selectedMap.has(bcb_product_id);
    }, [selectedMap]);

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
        isProductSelected
    };
};
