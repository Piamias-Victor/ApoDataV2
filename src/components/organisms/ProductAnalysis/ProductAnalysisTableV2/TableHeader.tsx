import React from 'react';

export const TableHeader: React.FC = () => {
    return (
        <thead className="bg-gray-50/80 backdrop-blur sticky top-0 z-10 border-b border-gray-100">
            <tr>
                <th className="px-2 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs w-[14%]">
                    Produit
                    <div className="flex gap-2 font-normal text-[10px] text-gray-400 normal-case mt-0.5">
                        <span>EAN</span>
                        <span>•</span>
                        <span>Labo</span>
                    </div>
                </th>
                <th className="px-2 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider text-xs w-[4%]">Rang</th>

                {/* Achats */}
                <th className="px-2 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[6%]">Achat HT</th>
                <th className="px-2 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[5%]">Achat Qte</th>
                <th className="px-2 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[6%]">
                    <div className="flex flex-col items-end">
                        <span>PDM Achat</span>
                        <span className="text-[10px] text-gray-400 font-normal normal-case">Montant</span>
                    </div>
                </th>

                {/* Ventes */}
                <th className="px-2 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[6%]">Vente TTC</th>
                <th className="px-2 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[5%]">Vente Qte</th>
                <th className="px-2 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[6%]">
                    <div className="flex flex-col items-end">
                        <span>PDM Vente</span>
                        <span className="text-[10px] text-gray-400 font-normal normal-case">Montant</span>
                    </div>
                </th>

                {/* Marge */}
                <th className="px-2 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[6%]">Marge €</th>
                <th className="px-2 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[5%]">Marge %</th>

                {/* Prix Moyens */}
                <th className="px-2 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[6%]">
                    <div className="flex flex-col items-end">
                        <span>Px Achat</span>
                        <span className="text-[10px] text-gray-400 font-normal normal-case">Moyen</span>
                    </div>
                </th>
                <th className="px-2 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[6%]">
                    <div className="flex flex-col items-end">
                        <span>Px Vente</span>
                        <span className="text-[10px] text-gray-400 font-normal normal-case">Moyen</span>
                    </div>
                </th>

                {/* Stock */}
                <th className="px-2 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[6%]">Stock €</th>
                <th className="px-2 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[5%]">Stock Qte</th>
                <th className="px-2 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[5%]">J.Stock</th>
            </tr>
        </thead>
    );
};
