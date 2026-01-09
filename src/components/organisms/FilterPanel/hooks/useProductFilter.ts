import { useCallback } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';
import { useProductSearchFilter, ProductSelection } from './useProductSearchFilter';
import { useProductTypeFilter } from './useProductTypeFilter';
import { useProductPriceFilter } from './useProductPriceFilter';

// Re-export types for compatibility
export type { Product, ProductSelection } from './useProductSearchFilter';

export const useProductFilter = (onClose?: () => void) => {
    // 1. Global Store Setters
    const {
        setProducts: setStoredProducts,
        setTvaRates: setStoredTvaRates,
        setReimbursementStatus: setStoredReimbursementStatus,
        setIsGeneric: setStoredIsGeneric,
        setProductType: setStoredProductType,
        setPurchasePriceNetRange: setStoredPurchasePriceNetRange,
        setPurchasePriceGrossRange: setStoredPurchasePriceGrossRange,
        setSellPriceRange: setStoredSellPriceRange,
        setDiscountRange: setStoredDiscountRange,
        setMarginRange: setStoredMarginRange
    } = useFilterStore();

    // 2. Sub-Hooks
    const searchFilter = useProductSearchFilter();
    const typeFilter = useProductTypeFilter();
    const priceFilter = useProductPriceFilter();

    // 3. Main Apply Handler
    const handleApply = useCallback(() => {
        // A. Save Product Selections
        const allSelectedCodes: ProductSelection[] = [];
        searchFilter.selectedMap.forEach(productGroup => {
            allSelectedCodes.push({
                code: productGroup.code,
                name: productGroup.name,
                bcb_product_id: productGroup.bcb_product_id
            });
        });
        setStoredProducts(allSelectedCodes);

        // B. Save Attribute Filters
        setStoredTvaRates(typeFilter.selectedTvaRates);
        setStoredReimbursementStatus(typeFilter.reimbursementStatus);
        setStoredIsGeneric(typeFilter.isGeneric);
        setStoredProductType(typeFilter.productType);

        // C. Save Price Ranges
        setStoredPurchasePriceNetRange({
            min: priceFilter.purchasePriceNetRange[0],
            max: priceFilter.purchasePriceNetRange[1]
        });
        setStoredPurchasePriceGrossRange({
            min: priceFilter.purchasePriceGrossRange[0],
            max: priceFilter.purchasePriceGrossRange[1]
        });
        setStoredSellPriceRange({
            min: priceFilter.sellPriceRange[0],
            max: priceFilter.sellPriceRange[1]
        });
        setStoredDiscountRange({
            min: priceFilter.discountRange[0],
            max: priceFilter.discountRange[1]
        });
        setStoredMarginRange({
            min: priceFilter.marginRange[0],
            max: priceFilter.marginRange[1]
        });

        if (onClose) onClose();
    }, [
        searchFilter.selectedMap,
        typeFilter,
        priceFilter,
        setStoredProducts,
        setStoredTvaRates,
        setStoredReimbursementStatus,
        setStoredIsGeneric,
        setStoredProductType,
        setStoredPurchasePriceNetRange,
        setStoredPurchasePriceGrossRange,
        setStoredSellPriceRange,
        setStoredDiscountRange,
        setStoredMarginRange,
        onClose
    ]);

    // Return aggregated interface
    return {
        // Search
        ...searchFilter,

        // Types
        ...typeFilter,

        // Prices
        ...priceFilter,

        // Actions
        handleApply
    };
};
