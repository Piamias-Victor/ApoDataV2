// src/components/organisms/FilterPanel/hooks/useProductFilter.ts
import { useState, useEffect, useCallback } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';

export interface Product {
    code_13_ref: string;
    name: string;
    brand_lab: string | null;
    universe: string | null;
    bcb_product_id: string;
    all_codes: string[]; // All codes with same bcb_product_id
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

export const useProductFilter = (onClose?: () => void) => {
    const {
        products: storedProducts,
        setProducts: setStoredProducts,
        setTvaRates,
        setReimbursementStatus: setStoredReimbursementStatus,
        setIsGeneric: setStoredIsGeneric,
        settings,
        // Rename store setters to avoid collision with local state setters
        setPurchasePriceNetRange: setStoredPurchasePriceNetRange,
        setPurchasePriceGrossRange: setStoredPurchasePriceGrossRange,
        setSellPriceRange: setStoredSellPriceRange,
        setDiscountRange: setStoredDiscountRange,
        setMarginRange: setStoredMarginRange
    } = useFilterStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    // Store by bcb_product_id to avoid duplicates in pinned list
    const [selectedMap, setSelectedMap] = useState<Map<string, { code: string; name: string; bcb_product_id: number }>>(new Map());

    // Attribute filters local state
    const [selectedTvaRates, setSelectedTvaRates] = useState<number[]>([]);

    // --- Reimbursement Status Local State ---
    const [reimbursementStatus, setReimbursementStatus] = useState<'ALL' | 'REIMBURSED' | 'NOT_REIMBURSED'>(
        settings.reimbursementStatus
    );

    // --- Generic Status Local State ---
    const [isGeneric, setIsGeneric] = useState<boolean | undefined>(settings.isGeneric);

    // --- Price Ranges Local State ---
    const [purchasePriceNetRange, setPurchasePriceNetRange] = useState<[number, number]>(
        settings.purchasePriceNetRange ? [settings.purchasePriceNetRange.min, settings.purchasePriceNetRange.max] : [0, 100000]
    );
    const [purchasePriceGrossRange, setPurchasePriceGrossRange] = useState<[number, number]>(
        settings.purchasePriceGrossRange ? [settings.purchasePriceGrossRange.min, settings.purchasePriceGrossRange.max] : [0, 100000]
    );
    const [sellPriceRange, setSellPriceRange] = useState<[number, number]>(
        settings.sellPriceRange ? [settings.sellPriceRange.min, settings.sellPriceRange.max] : [0, 100000]
    );
    const [discountRange, setDiscountRange] = useState<[number, number]>(
        settings.discountRange ? [settings.discountRange.min, settings.discountRange.max] : [0, 100]
    );
    const [marginRange, setMarginRange] = useState<[number, number]>(
        settings.marginRange ? [settings.marginRange.min, settings.marginRange.max] : [0, 100]
    );

    // Initialize logic
    useEffect(() => {
        const initialMap = new Map<string, { code: string; name: string; bcb_product_id: number }>();
        const groupedByBcbId: Record<string, { name: string; code: string; bcb_product_id: number }> = {};

        storedProducts.forEach(product => {
            const bcbId = product.bcb_product_id?.toString();
            if (bcbId) {
                groupedByBcbId[bcbId] = {
                    name: product.name,
                    code: product.code, // Expecting 'code' from ProductSelection
                    bcb_product_id: parseInt(bcbId)
                };
            }
        });

        Object.entries(groupedByBcbId).forEach(([bcbId, data]) => {
            initialMap.set(bcbId, data);
        });

        setSelectedMap(initialMap);
    }, [storedProducts]);

    useEffect(() => {
        if (settings) {
            setSelectedTvaRates(settings.tvaRates);
            // Re-sync local state if settings change, e.g. from reset
            // Note: usually validation logic is simpler, but this works
        }
    }, [settings]);

    // Fetch products with AbortController
    useEffect(() => {
        const controller = new AbortController();

        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/products/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: searchQuery }),
                    signal: controller.signal // 👈 Add AbortSignal
                });

                if (!response.ok) throw new Error('Failed to fetch products');

                const data: SearchResponse = await response.json();
                setResults(data.products);
            } catch (error) {
                // Ignore AbortError - it's expected when query changes
                if ((error as Error).name === 'AbortError') {
                    return;
                }
                console.error('Error fetching products:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchProducts();
        }, 300);

        // Cleanup: cancel timeout and abort ongoing request
        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [searchQuery]);

    // Handlers
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

    // New function: Search and auto-select products by codes
    const searchAndSelectByCodes = async (codes: string[]) => {
        if (codes.length === 0) return;

        try {
            setIsLoading(true);

            // Search for all codes
            const searchPromises = codes.map(code =>
                fetch('/api/products/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: code, limit: 50 })
                }).then(res => res.json())
            );

            const responses = await Promise.all(searchPromises);

            // Auto-select all found products
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

    const handleToggleTva = useCallback((rate: number) => {
        setSelectedTvaRates(prev =>
            prev.includes(rate) ? prev.filter(r => r !== rate) : [...prev, rate]
        );
    }, []);

    const handleToggleReimbursement = useCallback((status: 'ALL' | 'REIMBURSED' | 'NOT_REIMBURSED') => {
        setReimbursementStatus(status);
    }, []);

    const handleApply = useCallback(() => {
        // Flatten selections
        const allSelectedCodes: ProductSelection[] = [];
        selectedMap.forEach(productGroup => {
            allSelectedCodes.push({
                code: productGroup.code,
                name: productGroup.name,
                bcb_product_id: productGroup.bcb_product_id
            });
        });
        setStoredProducts(allSelectedCodes);

        // Save attribute filters to store
        setTvaRates(selectedTvaRates);
        setStoredReimbursementStatus(reimbursementStatus);
        setStoredIsGeneric(isGeneric);

        // Save Price Ranges to store
        setStoredPurchasePriceNetRange({ min: purchasePriceNetRange[0], max: purchasePriceNetRange[1] });
        setStoredPurchasePriceGrossRange({ min: purchasePriceGrossRange[0], max: purchasePriceGrossRange[1] });
        setStoredSellPriceRange({ min: sellPriceRange[0], max: sellPriceRange[1] });
        setStoredDiscountRange({ min: discountRange[0], max: discountRange[1] });
        setStoredMarginRange({ min: marginRange[0], max: marginRange[1] });

        if (onClose) onClose();
    }, [selectedMap, setStoredProducts, selectedTvaRates, reimbursementStatus, isGeneric, setTvaRates, setStoredReimbursementStatus, setStoredIsGeneric, purchasePriceNetRange, purchasePriceGrossRange, sellPriceRange, discountRange, marginRange, setStoredPurchasePriceNetRange, setStoredPurchasePriceGrossRange, setStoredSellPriceRange, setStoredDiscountRange, setStoredMarginRange, onClose]);

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
        isProductSelected,
        selectedTvaRates,
        handleToggleTva,
        reimbursementStatus,
        handleToggleReimbursement,
        isGeneric,
        setIsGeneric,
        purchasePriceNetRange,
        setPurchasePriceNetRange,
        purchasePriceGrossRange,
        setPurchasePriceGrossRange,
        sellPriceRange,
        setSellPriceRange,
        discountRange,
        setDiscountRange,
        marginRange,
        setMarginRange,
        searchAndSelectByCodes // NEW: Export bulk search function
    };
};
