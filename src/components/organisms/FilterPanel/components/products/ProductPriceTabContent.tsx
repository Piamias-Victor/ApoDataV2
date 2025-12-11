import React from 'react';
import { Euro, Percent } from 'lucide-react';
import { RangeSlider } from '@/components/atoms/Slider/RangeSlider';

interface ProductPriceTabContentProps {
    purchasePriceNetRange: [number, number];
    onPurchasePriceNetRangeChange: (range: [number, number]) => void;

    purchasePriceGrossRange: [number, number];
    onPurchasePriceGrossRangeChange: (range: [number, number]) => void;

    sellPriceRange: [number, number];
    onSellPriceRangeChange: (range: [number, number]) => void;

    discountRange: [number, number];
    onDiscountRangeChange: (range: [number, number]) => void;

    marginRange: [number, number];
    onMarginRangeChange: (range: [number, number]) => void;
}

export const ProductPriceTabContent: React.FC<ProductPriceTabContentProps> = ({
    purchasePriceNetRange, onPurchasePriceNetRangeChange,
    purchasePriceGrossRange, onPurchasePriceGrossRangeChange,
    sellPriceRange, onSellPriceRangeChange,
    discountRange, onDiscountRangeChange,
    marginRange, onMarginRangeChange
}) => {
    return (
        <div className="p-6 space-y-8">
            {/* Purchase Price Net */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2.5">
                    <Euro className="w-3.5 h-3.5" />
                    Prix d&apos;achat HT Net
                </label>
                <RangeSlider
                    min={0}
                    max={100000}
                    step={10}
                    value={purchasePriceNetRange}
                    onChange={onPurchasePriceNetRangeChange}
                    color="green"
                />
            </div>

            {/* Purchase Price Gross */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2.5">
                    <Euro className="w-3.5 h-3.5" />
                    Prix d&apos;achat HT Brut
                </label>
                <RangeSlider
                    min={0}
                    max={100000}
                    step={10}
                    value={purchasePriceGrossRange}
                    onChange={onPurchasePriceGrossRangeChange}
                    color="green"
                />
            </div>

            {/* Sell Price TTC */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2.5">
                    <Euro className="w-3.5 h-3.5" />
                    Prix de vente TTC
                </label>
                <RangeSlider
                    min={0}
                    max={100000}
                    step={10}
                    value={sellPriceRange}
                    onChange={onSellPriceRangeChange}
                    color="green"
                />
            </div>

            {/* Discount % */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2.5">
                    <Percent className="w-3.5 h-3.5" />
                    % de remise
                </label>
                <RangeSlider
                    min={0}
                    max={100}
                    step={1}
                    value={discountRange}
                    onChange={onDiscountRangeChange}
                    color="green"
                    unit="%"
                />
            </div>

            {/* Margin % */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2.5">
                    <Percent className="w-3.5 h-3.5" />
                    % de marge
                </label>
                <RangeSlider
                    min={0}
                    max={100}
                    step={1}
                    value={marginRange}
                    onChange={onMarginRangeChange}
                    color="green"
                    unit="%"
                />
            </div>
        </div>
    );
};
