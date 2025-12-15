'use client';

import React from 'react';
import { useProductAnalysis } from './hooks/useProductAnalysis';
import {
    ArrowUp,
    ArrowDown,
    Loader2,
    Package,
    Search,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

// --- Internal Helper Components to match Dashboard Design ---

// Evolution Badge (Replicated from LaboratoryDetailedTable.tsx)
const EvolutionBadge = ({ value }: { value: number | undefined | null }) => {
    if (value === undefined || value === null || isNaN(value)) return <span className="text-gray-300 text-[10px]">-</span>;
    const isPositive = value > 0;
    const isNegative = value < 0;
    const color = isPositive ? 'text-green-600 bg-green-50' : isNegative ? 'text-red-600 bg-red-50' : 'text-gray-400 bg-gray-50';
    const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : null;

    return (
        <div className={`flex items-center w-fit px-1.5 py-0.5 rounded text-[10px] font-medium ${color} mt-1`}>
            {Icon && <Icon className="w-3 h-3 mr-0.5" />}
            {Math.abs(value).toFixed(1)}%
        </div>
    );
};

// Custom Value Cell (Replicated from LaboratoryDetailedTable.tsx)
const CustomValueCell = ({ value, evolution, isCurrency = false, suffix = '', decimals = 0 }: { value: number | undefined | null, evolution?: number | null, isCurrency?: boolean, suffix?: string, decimals?: number }) => {
    if (value === undefined || value === null) return <span className="text-gray-300">-</span>;

    // Format value
    let formattedValue;
    if (isCurrency) {
        formattedValue = Math.round(value).toLocaleString('fr-FR') + ' €';
    } else {
        formattedValue = value.toLocaleString('fr-FR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }) + suffix;
    }

    return (
        <div className="flex flex-col items-end">
            <span className="font-medium text-gray-900 text-sm">
                {formattedValue}
            </span>
            {evolution !== undefined && evolution !== null && <EvolutionBadge value={evolution} />}
        </div>
    );
};


export const ProductAnalysisTable: React.FC = () => {

    // Using the existing hook which handles server-side state
    const { data: result, isLoading, page, setPage, search, setSearch } = useProductAnalysis();

    const resultData = result?.data || [];
    const totalItems = result?.total || 0;
    const itemsPerPage = 20;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Reset page on search change is already handled in the hook or parent component, 
    // but just to be safe if useProductAnalysis doesn't do it automatically on external state change
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    return (
        <div className="mt-8 space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-purple-600" />
                        Analyse par Produit
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Détail des performances par produit (Achats, Ventes, Marge, Stock)
                    </p>
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un produit ou EAN..."
                        className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm w-full md:w-80 transition-all"
                        value={search}
                        onChange={handleSearch}
                    />
                    {isLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                        </div>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden ring-1 ring-black/5 min-h-[400px]">
                {(isLoading && !result) ? (
                    <div className="p-8 space-y-4">
                        {[...Array(itemsPerPage)].map((_, i) => (
                            <div key={i} className="h-16 w-full bg-gray-50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50/80 backdrop-blur sticky top-0 z-10 border-b border-gray-100">
                                    <tr>
                                        {/* PRODUIT / EAN / LABO */}
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs w-[20%]">Produit</th>

                                        <th className="px-4 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider text-xs w-[4%]">Rang</th>

                                        {/* ACHAT */}
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[6%]">Achat HT</th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[5%]">Achat Qte</th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[5%]">
                                            <div className="flex flex-col items-end">
                                                <span>PDM Achat</span>
                                                <span className="text-[10px] text-gray-400 font-normal normal-case">Montant</span>
                                            </div>
                                        </th>

                                        {/* VENTE */}
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[6%]">Vente TTC</th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[5%]">Vente Qte</th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[5%]">
                                            <div className="flex flex-col items-end">
                                                <span>PDM Qte</span>
                                                <span className="text-[10px] text-gray-400 font-normal normal-case">Montant</span>
                                            </div>
                                        </th>

                                        {/* MARGE */}
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[6%]">Marge €</th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[5%]">Marge %</th>

                                        {/* PRIX */}
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[6%]">
                                            <div className="flex flex-col items-end">
                                                <span>Px Achat</span>
                                                <span className="text-[10px] text-gray-400 font-normal normal-case">Moyen</span>
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[6%]">
                                            <div className="flex flex-col items-end">
                                                <span>Px Vente</span>
                                                <span className="text-[10px] text-gray-400 font-normal normal-case">Moyen</span>
                                            </div>
                                        </th>

                                        {/* STOCK */}
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[6%]">Stock €</th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[5%]">Stock Qte</th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs w-[5%]">J.Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/50">
                                    {resultData.length === 0 ? (
                                        <tr>
                                            <td colSpan={15} className="p-12 text-center text-gray-500">
                                                Aucun produit trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        resultData.map((row) => (
                                            <tr key={row.ean13} className="hover:bg-purple-50/30 transition-colors group">
                                                {/* Product Info */}
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900 line-clamp-2 md:line-clamp-1" title={row.product_name}>
                                                            {row.product_name}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                                                                {row.ean13}
                                                            </span>
                                                            <span className="text-[10px] text-blue-600 truncate max-w-[150px]">
                                                                {row.laboratory_name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Rank */}
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${row.my_rank <= 10 ? 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-700 shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
                                                            #{row.my_rank}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Achat HT */}
                                                <td className="px-4 py-3 text-right bg-purple-50/5 group-hover:bg-purple-50/10">
                                                    <CustomValueCell value={row.my_purchases_ht} evolution={row.my_purchases_evolution} isCurrency />
                                                </td>
                                                {/* Achat Qte */}
                                                <td className="px-4 py-3 text-right">
                                                    <CustomValueCell value={row.my_purchases_qty} evolution={row.my_purchases_qty_evolution} />
                                                </td>
                                                {/* PDM Achat */}
                                                <td className="px-4 py-3 text-right bg-purple-50/5 group-hover:bg-purple-50/10">
                                                    <CustomValueCell value={row.my_pdm_purchases_pct} evolution={null} suffix="%" decimals={1} />
                                                </td>

                                                {/* Vente TTC */}
                                                <td className="px-4 py-3 text-right bg-blue-50/5 group-hover:bg-blue-50/10">
                                                    <CustomValueCell value={row.my_sales_ttc} evolution={row.my_sales_evolution} isCurrency />
                                                </td>
                                                {/* Vente Qte */}
                                                <td className="px-4 py-3 text-right">
                                                    <CustomValueCell value={row.my_sales_qty} evolution={row.my_sales_qty_evolution} />
                                                </td>
                                                {/* PDM Vente (Assuming PDM Qte meant PDM Sales based on request 'PDM QTE (montant)') - Keeping PDM Sales */}
                                                <td className="px-4 py-3 text-right bg-blue-50/5 group-hover:bg-blue-50/10">
                                                    <CustomValueCell value={row.my_pdm_pct} evolution={row.my_pdm_evolution} suffix="%" decimals={1} />
                                                </td>

                                                {/* Marge € */}
                                                <td className="px-4 py-3 text-right bg-orange-50/5 group-hover:bg-orange-50/10">
                                                    <CustomValueCell value={row.my_margin_ht} evolution={row.my_margin_ht_evolution} isCurrency />
                                                </td>
                                                {/* Marge % */}
                                                <td className="px-4 py-3 text-right">
                                                    <CustomValueCell value={row.my_margin_rate} evolution={row.my_margin_rate_evolution} suffix="%" decimals={1} />
                                                </td>

                                                {/* Prix Achat Moy */}
                                                <td className="px-4 py-3 text-right">
                                                    <div className="font-medium text-gray-700 text-sm">
                                                        {row.avg_purchase_price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                    </div>
                                                </td>
                                                {/* Prix Vente Moy */}
                                                <td className="px-4 py-3 text-right">
                                                    <div className="font-medium text-gray-700 text-sm">
                                                        {row.avg_sell_price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                    </div>
                                                </td>

                                                {/* Stock € */}
                                                <td className="px-4 py-3 text-right bg-gray-50/30 group-hover:bg-gray-50/50">
                                                    <CustomValueCell value={row.my_stock_value_ht} evolution={row.my_stock_value_ht_evolution} isCurrency />
                                                </td>
                                                {/* Stock Qte */}
                                                <td className="px-4 py-3 text-right">
                                                    <CustomValueCell value={row.my_stock_qty} evolution={row.my_stock_qty_evolution} />
                                                </td>
                                                {/* J.Stock */}
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`font-bold ${(row.my_days_of_stock || 0) > 90 ? 'text-red-600' :
                                                        (row.my_days_of_stock || 0) > 60 ? 'text-orange-600' : 'text-gray-800'
                                                        }`}>
                                                        {row.my_days_of_stock?.toFixed(0)}j
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/80 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-500">
                                Affichage de <span className="font-medium">{totalItems > 0 ? (page - 1) * itemsPerPage + 1 : 0}</span> à <span className="font-medium">{Math.min(page * itemsPerPage, totalItems)}</span> sur <span className="font-medium">{totalItems}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || totalPages === 0}
                                    className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                                >
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

