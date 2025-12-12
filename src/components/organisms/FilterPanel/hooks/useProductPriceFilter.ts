import { useState, useEffect } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';

export const useProductPriceFilter = () => {
    const { settings } = useFilterStore();

    const [purchasePriceNetRange, setPurchasePriceNetRange] = useState<[number, number]>([0, 100000]);
    const [purchasePriceGrossRange, setPurchasePriceGrossRange] = useState<[number, number]>([0, 100000]);
    const [sellPriceRange, setSellPriceRange] = useState<[number, number]>([0, 100000]);
    const [discountRange, setDiscountRange] = useState<[number, number]>([0, 100]);
    const [marginRange, setMarginRange] = useState<[number, number]>([0, 100]);

    // Sync with global store on mount/update
    useEffect(() => {
        if (settings) {
            setPurchasePriceNetRange(
                settings.purchasePriceNetRange ? [settings.purchasePriceNetRange.min, settings.purchasePriceNetRange.max] : [0, 100000]
            );
            setPurchasePriceGrossRange(
                settings.purchasePriceGrossRange ? [settings.purchasePriceGrossRange.min, settings.purchasePriceGrossRange.max] : [0, 100000]
            );
            setSellPriceRange(
                settings.sellPriceRange ? [settings.sellPriceRange.min, settings.sellPriceRange.max] : [0, 100000]
            );
            setDiscountRange(
                settings.discountRange ? [settings.discountRange.min, settings.discountRange.max] : [0, 100]
            );
            setMarginRange(
                settings.marginRange ? [settings.marginRange.min, settings.marginRange.max] : [0, 100]
            );
        }
    }, [settings]);

    return {
        purchasePriceNetRange,
        setPurchasePriceNetRange,
        purchasePriceGrossRange,
        setPurchasePriceGrossRange,
        sellPriceRange,
        setSellPriceRange,
        discountRange,
        setDiscountRange,
        marginRange,
        setMarginRange
    };
};
