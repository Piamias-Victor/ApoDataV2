'use client';

import React, { useState } from 'react';
import { useProductAnalysis } from './hooks/useProductAnalysis';
import {
    ArrowUp,
    ArrowDown,
    Loader2,
    Package,
    Search
} from 'lucide-react';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { Pagination } from '@/components/molecules/Pagination/Pagination';
import { RankSelector } from '@/components/molecules/Table/RankSelector';

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
const CustomValueCell = ({ value, evolution, isCurrency = false, suffix = '', decimals = 0, textSize = 'text-sm' }: { value: number | undefined | null, evolution?: number | null, isCurrency?: boolean, suffix?: string, decimals?: number, textSize?: string }) => {
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
            <span className={`font-medium text-gray-900 ${textSize}`}>
                {formattedValue}
            </span>
            {evolution !== undefined && evolution !== null && <EvolutionBadge value={evolution} />}
        </div>
    );
};


export const ProductAnalysisTable: React.FC = () => {

    const itemsPerPage = 10;

    // Using the existing hook which handles server-side state
    const {
        data: result,
        isLoading,
        page,
        setPage,
        search,
        setSearch,
        sortBy,
        sortOrder,
        handleSort
    } = useProductAnalysis({ itemsPerPage });

    // Default rank basis: Sales
    const [rankBasis, setRankBasis] = useState<string>('my_sales_ttc');

    const resultData = result?.data || [];
    const totalItems = result?.total || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Ranks are now calculated server-side in the SQL query

    // Reset page on search change is already handled in the hook or parent component,
    // but just to be safe if useProductAnalysis doesn't do it automatically on external state change
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    // Helper to keep JSX clean
    const getSortProps = (column: string) => ({
        isSortable: true,
        sortDirection: (sortBy === column ? sortOrder : null) || null,
        onSort: () => handleSort(column)
    });

    const rankOptions = [
        { value: 'my_sales_ttc', label: 'CA Vente TTC' },
        { value: 'my_sales_qty', label: 'Vol. Vente' },
        { value: 'my_margin_rate', label: 'Marge %' },
        { value: 'my_margin_ht', label: 'Marge €' },
        { value: 'my_stock_value_ht', label: 'Stock €' },
    ];

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

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* Rank Selector */}
                    <RankSelector
                        value={rankBasis}
                        onChange={setRankBasis}
                        options={rankOptions}
                    />

                    <div className="relative w-full sm:w-auto">
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
                                <thead>
                                    <tr>
                                        <TableHeaderCell width="20%" {...getSortProps('product_name')}>Produit</TableHeaderCell>
                                        <TableHeaderCell width="5%" align="center" {...getSortProps('my_rank')}>Rank</TableHeaderCell>

                                        {/* ACHAT - Purple */}
                                        <TableHeaderCell align="right" variant="purple" width="6%" {...getSortProps('my_purchases_ht')}>Achat HT</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="purple" width="5%" {...getSortProps('my_purchases_qty')}>Achat Qte</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="green" width="5%" {...getSortProps('my_pdm_purchases_pct')}>
                                            <div className="flex flex-col items-end">
                                                <span>PDM Achat</span>
                                                <span className="text-[9px] opacity-70 font-normal normal-case">Montant</span>
                                            </div>
                                        </TableHeaderCell>

                                        {/* VENTE - Blue */}
                                        <TableHeaderCell align="right" variant="blue" width="6%" {...getSortProps('my_sales_ttc')}>Vente TTC</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="blue" width="5%" {...getSortProps('my_sales_qty')}>Vente Qte</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="green" width="5%" {...getSortProps('my_pdm_pct')}>
                                            <div className="flex flex-col items-end">
                                                <span>PDM Qte</span>
                                                <span className="text-[9px] opacity-70 font-normal normal-case">Montant</span>
                                            </div>
                                        </TableHeaderCell>

                                        {/* MARGE - Orange */}
                                        <TableHeaderCell align="right" variant="orange" width="6%" {...getSortProps('my_margin_ht')}>Marge €</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="orange" width="5%" {...getSortProps('my_margin_rate')}>Marge %</TableHeaderCell>

                                        {/* PRIX - Pink */}
                                        <TableHeaderCell align="right" variant="pink" width="6%">PA.HT Moy</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="pink" width="6%">PV.TTC Moy</TableHeaderCell>

                                        {/* STOCK - Red */}
                                        <TableHeaderCell align="right" variant="red" width="6%" {...getSortProps('my_stock_value_ht')}>Stock €</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="red" width="5%" {...getSortProps('my_stock_qty')}>Stock Qte</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="red" width="5%" {...getSortProps('my_days_of_stock')}>J.Stock</TableHeaderCell>
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
                                        resultData.map((row) => {
                                            const displayRank = row.my_rank;
                                            return (
                                            <tr key={row.ean13} className="hover:bg-purple-50/30 transition-colors group">
                                                {/* Product Info */}
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900 line-clamp-2 md:line-clamp-1 text-xs" title={row.product_name}>
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
                                                </TableCell>

                                                {/* Rank */}
                                                <TableCell align="center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold ${displayRank <= 10 ? 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-700 shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
                                                            #{displayRank}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                {/* Achat HT */}
                                                <TableCell align="right" variant="purple">
                                                    <CustomValueCell value={row.my_purchases_ht} evolution={row.my_purchases_evolution} isCurrency textSize="text-xs" />
                                                </TableCell>
                                                {/* Achat Qte */}
                                                <TableCell align="right" variant="purple">
                                                    <CustomValueCell value={row.my_purchases_qty} evolution={row.my_purchases_qty_evolution} textSize="text-xs" />
                                                </TableCell>
                                                {/* PDM Achat */}
                                                <TableCell align="right" variant="green">
                                                    <CustomValueCell value={row.my_pdm_purchases_pct} evolution={null} suffix="%" decimals={1} textSize="text-xs" />
                                                </TableCell>

                                                {/* Vente TTC */}
                                                <TableCell align="right" variant="blue">
                                                    <CustomValueCell value={row.my_sales_ttc} evolution={row.my_sales_evolution} isCurrency textSize="text-xs" />
                                                </TableCell>
                                                {/* Vente Qte */}
                                                <TableCell align="right" variant="blue">
                                                    <CustomValueCell value={row.my_sales_qty} evolution={row.my_sales_qty_evolution} textSize="text-xs" />
                                                </TableCell>
                                                {/* PDM Vente */}
                                                <TableCell align="right" variant="green">
                                                    <CustomValueCell value={row.my_pdm_pct} evolution={row.my_pdm_evolution} suffix="%" decimals={1} textSize="text-xs" />
                                                </TableCell>

                                                {/* Marge € */}
                                                <TableCell align="right" variant="orange">
                                                    <CustomValueCell value={row.my_margin_ht} evolution={row.my_margin_ht_evolution} isCurrency textSize="text-xs" />
                                                </TableCell>
                                                {/* Marge % */}
                                                <TableCell align="right" variant="orange">
                                                    <CustomValueCell value={row.my_margin_rate} evolution={row.my_margin_rate_evolution} suffix="%" decimals={1} textSize="text-xs" />
                                                </TableCell>

                                                {/* Prix Achat Moy */}
                                                <TableCell align="right">
                                                    <div className="font-medium text-gray-700 text-xs">
                                                        {row.avg_purchase_price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                    </div>
                                                </TableCell>
                                                {/* Prix Vente Moy */}
                                                <TableCell align="right">
                                                    <div className="font-medium text-gray-700 text-xs">
                                                        {row.avg_sell_price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                    </div>
                                                </TableCell>

                                                {/* Stock € */}
                                                <TableCell align="right" variant="red">
                                                    <CustomValueCell value={row.my_stock_value_ht} evolution={row.my_stock_value_ht_evolution} isCurrency textSize="text-xs" />
                                                </TableCell>
                                                {/* Stock Qte */}
                                                <TableCell align="right" variant="red">
                                                    <CustomValueCell value={row.my_stock_qty} evolution={row.my_stock_qty_evolution} textSize="text-xs" />
                                                </TableCell>
                                                {/* J.Stock */}
                                                <TableCell align="right" variant="red">
                                                    <span className={`font-bold text-xs ${(row.my_days_of_stock || 0) > 90 ? 'text-red-600' :
                                                        (row.my_days_of_stock || 0) > 60 ? 'text-orange-600' : 'text-gray-800'
                                                        }`}>
                                                        {row.my_days_of_stock?.toFixed(0)}j
                                                    </span>
                                                </TableCell>
                                            </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            className="bg-gray-50/80 backdrop-blur-sm rounded-b-xl"
                        />
                    </>
                )}
            </div>
        </div>
    );
};
