import React, { useState, useMemo } from 'react';
import { ValueCell } from '@/components/molecules/Table/ValueCell';

interface PriceSimulatorProps {
    initialPurchasePrice: number;
    initialSellPrice: number;
    initialVatRate: number;
}

export const PriceSimulator: React.FC<PriceSimulatorProps> = ({
    initialPurchasePrice,
    initialSellPrice,
    initialVatRate
}) => {
    const [purchasePrice, setPurchasePrice] = useState<number>(initialPurchasePrice);
    const [sellPrice, setSellPrice] = useState<number>(initialSellPrice);
    const [vatRate, setVatRate] = useState<number>(initialVatRate || 5.5);

    const { marginHt, marginRate, sellHt } = useMemo(() => {
        // Calculate Sell Price HT from TTC input
        const sHt = sellPrice / (1 + vatRate / 100);
        const mHt = sHt - purchasePrice;
        const mRate = sHt !== 0 ? (mHt / sHt) * 100 : 0;
        return { marginHt: mHt, marginRate: mRate, sellHt: sHt };
    }, [purchasePrice, sellPrice, vatRate]);

    return (
        <div className="flex items-center gap-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200 animate-in fade-in slide-in-from-top-1 duration-200 w-full">

            {/* INPUTS GROUP */}
            <div className="flex items-center gap-4">
                {/* Purchase Input */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-wider text-purple-700 uppercase">Achat HT</label>
                    <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-600">
                        <input
                            type="number"
                            value={purchasePrice}
                            onChange={(e) => setPurchasePrice(Math.max(0, Number(e.target.value)))}
                            className="block w-24 border-0 bg-transparent py-1.5 pl-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 font-semibold"
                            step="0.01"
                        />
                        <span className="flex select-none items-center pr-3 text-gray-500 sm:text-xs">€</span>
                    </div>
                </div>

                {/* VAT Selector */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">TVA</label>
                    <div className="relative">
                        <select
                            value={vatRate}
                            onChange={(e) => setVatRate(Number(e.target.value))}
                            className="block w-20 appearance-none rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 font-medium cursor-pointer"
                        >
                            <option value={2.1}>2.1%</option>
                            <option value={5.5}>5.5%</option>
                            <option value={10}>10%</option>
                            <option value={20}>20%</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                        </div>
                    </div>
                </div>

                {/* Sell Input (TTC) */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-wider text-blue-700 uppercase">Vente TTC</label>
                    <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-600">
                        <input
                            type="number"
                            value={sellPrice}
                            onChange={(e) => setSellPrice(Math.max(0, Number(e.target.value)))}
                            className="block w-24 border-0 bg-transparent py-1.5 pl-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 font-semibold"
                            step="0.01"
                        />
                        <span className="flex select-none items-center pr-3 text-gray-500 sm:text-xs">€</span>
                    </div>
                </div>
            </div>

            {/* SEPARATOR */}
            <div className="h-10 w-px bg-gray-200 mx-2"></div>

            {/* RESULTS GROUP */}
            <div className="flex items-center gap-8">
                {/* Intermediate Sell HT (Info only) */}
                <div className="flex flex-col items-start opacity-75">
                    <span className="text-[10px] font-medium text-gray-500 uppercase">Vente HT</span>
                    <ValueCell value={sellHt} isCurrency decimals={2} className="text-base font-semibold text-gray-700" />
                </div>

                {/* Margin HT */}
                <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black tracking-wider text-gray-900 uppercase">Marge HT</span>
                    <ValueCell value={marginHt} isCurrency decimals={2} className="text-xl font-bold text-gray-900" />
                </div>

                {/* Margin Rate */}
                <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black tracking-wider text-orange-600 uppercase">Taux Marge</span>
                    <ValueCell
                        value={marginRate}
                        suffix="%"
                        decimals={2}
                        textSize="text-xl"
                        className={`font-black ${marginRate > 25 ? "text-green-600" : "text-amber-600"}`}
                    />
                </div>
            </div>
        </div>
    );
};
