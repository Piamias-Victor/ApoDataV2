'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useLaboratoryAnalysis } from './hooks/useLaboratoryAnalysis';
import {
    Loader2,
    FlaskConical,
    Search,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { ValueCell } from '@/components/molecules/Table/ValueCell';

export const LaboratoryDetailedTable: React.FC = () => {

    // State
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data: rawData, isLoading, isFetching } = useLaboratoryAnalysis();

    // Default empty array
    const safeData = useMemo(() => rawData || [], [rawData]);

    // Filter Logic
    const filteredData = useMemo(() => {
        let res = safeData;
        if (search) {
            res = res.filter(row =>
                row.laboratory_name.toLowerCase().includes(search.toLowerCase())
            );
        }
        return [...res].sort((a, b) => a.my_rank - b.my_rank);
    }, [safeData, search]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

    // Reset page on search change
    useEffect(() => {
        setPage(1);
    }, [search]);

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
                        <FlaskConical className="w-6 h-6 text-purple-600" />
                        Analyse par Laboratoire
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Détail des performances par laboratoire (Achats, Ventes, Marge, Stock)
                    </p>
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un laboratoire..."
                        className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm w-full md:w-64 transition-all"
                        value={search}
                        onChange={handleSearch}
                    />
                    {isFetching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                        </div>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden ring-1 ring-black/5 min-h-[400px]">
                {(isLoading && !rawData) ? (
                    <div className="p-8 space-y-4">
                        {[...Array(pageSize)].map((_, i) => (
                            <div key={i} className="h-16 w-full bg-gray-50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50/80 backdrop-blur sticky top-0 z-10 border-b border-gray-100">
                                    <tr>
                                        {/* LABO */}
                                        <TableHeaderCell width="14%">Laboratoire</TableHeaderCell>
                                        <TableHeaderCell width="4%" align="center">Rang</TableHeaderCell>

                                        {/* ACHAT - Purple */}
                                        <TableHeaderCell align="right" variant="purple" width="6%">Achat HT</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="purple" width="5%">Achat Qte</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="green" width="5%">
                                            <div className="flex flex-col items-end">
                                                <span>PDM Achat</span>
                                                <span className="text-[9px] opacity-70 font-normal normal-case">Montant</span>
                                            </div>
                                        </TableHeaderCell>

                                        {/* VENTE - Blue */}
                                        <TableHeaderCell align="right" variant="blue" width="6%">Vente TTC</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="blue" width="5%">Vente Qte</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="green" width="5%">
                                            <div className="flex flex-col items-end">
                                                <span>PDM Vente</span>
                                                <span className="text-[9px] opacity-70 font-normal normal-case">Montant</span>
                                            </div>
                                        </TableHeaderCell>

                                        {/* MARGE - Orange */}
                                        <TableHeaderCell align="right" variant="orange" width="6%">Marge €</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="orange" width="5%">Marge %</TableHeaderCell>

                                        {/* PRIX - Pink (Added) */}
                                        <TableHeaderCell align="right" variant="pink" width="6%">PA.HT Moy</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="pink" width="6%">PV.TTC Moy</TableHeaderCell>

                                        {/* STOCK - Red */}
                                        <TableHeaderCell align="right" variant="red" width="6%">Stock €</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="red" width="5%">Stock Qte</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="red" width="5%">J.Stock</TableHeaderCell>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/50">
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={15} className="p-12 text-center text-gray-500">
                                                Aucun laboratoire trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((row, idx) => {
                                            // Compute Prices
                                            const avgBuyPrice = row.my_purchases_qty ? row.my_purchases_ht / row.my_purchases_qty : 0;
                                            const avgSellPrice = row.my_sales_qty ? row.my_sales_ttc / row.my_sales_qty : 0;

                                            return (
                                                <tr key={idx} className="hover:bg-purple-50/30 transition-colors group">

                                                    {/* Labo Name */}
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-900 text-xs truncate max-w-[200px]" title={row.laboratory_name}>
                                                                {row.laboratory_name}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Rank - Bubble Style */}
                                                    <TableCell align="center">
                                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold ${row.my_rank <= 10 ? 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-700 shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
                                                            #{row.my_rank}
                                                        </span>
                                                    </TableCell>

                                                    {/* Achat HT */}
                                                    <TableCell align="right" variant="purple">
                                                        <ValueCell value={row.my_purchases_ht} evolution={row.my_purchases_evolution} isCurrency textSize="text-xs" />
                                                    </TableCell>
                                                    {/* Achat Qte */}
                                                    <TableCell align="right" variant="purple">
                                                        <ValueCell value={row.my_purchases_qty} evolution={row.my_purchases_qty_evolution} textSize="text-xs" />
                                                    </TableCell>
                                                    {/* PDM Achat */}
                                                    <TableCell align="right" variant="green">
                                                        <ValueCell value={row.my_pdm_purchases_pct} evolution={row.my_pdm_purchases_evolution} suffix="%" decimals={1} textSize="text-xs" />
                                                    </TableCell>

                                                    {/* Vente TTC */}
                                                    <TableCell align="right" variant="blue">
                                                        <ValueCell value={row.my_sales_ttc} evolution={row.my_sales_evolution} isCurrency textSize="text-xs" />
                                                    </TableCell>
                                                    {/* Vente Qte */}
                                                    <TableCell align="right" variant="blue">
                                                        <ValueCell value={row.my_sales_qty} evolution={row.my_sales_qty_evolution} textSize="text-xs" />
                                                    </TableCell>
                                                    {/* PDM Vente */}
                                                    <TableCell align="right" variant="green">
                                                        <ValueCell value={row.my_pdm_pct} evolution={row.my_pdm_evolution} suffix="%" decimals={1} textSize="text-xs" />
                                                    </TableCell>

                                                    {/* Marge € */}
                                                    <TableCell align="right" variant="orange">
                                                        <ValueCell value={row.my_margin_ht} evolution={row.my_margin_ht_evolution} isCurrency textSize="text-xs" />
                                                    </TableCell>
                                                    {/* Marge % */}
                                                    <TableCell align="right" variant="orange">
                                                        <ValueCell value={row.my_margin_rate} evolution={row.my_margin_rate_evolution} suffix="%" decimals={1} textSize="text-xs" />
                                                    </TableCell>

                                                    {/* Prix Achat Moy (Calculated) */}
                                                    <TableCell align="right" variant="pink">
                                                        <div className="font-medium text-gray-700 text-xs">
                                                            {avgBuyPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                        </div>
                                                    </TableCell>
                                                    {/* Prix Vente Moy (Calculated) */}
                                                    <TableCell align="right" variant="pink">
                                                        <div className="font-medium text-gray-700 text-xs">
                                                            {avgSellPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                        </div>
                                                    </TableCell>

                                                    {/* Stock € */}
                                                    <TableCell align="right" variant="red">
                                                        <ValueCell value={row.my_stock_value_ht} evolution={row.my_stock_value_ht_evolution} isCurrency textSize="text-xs" />
                                                    </TableCell>
                                                    {/* Stock Qte */}
                                                    <TableCell align="right" variant="red">
                                                        <ValueCell value={row.my_stock_qty} evolution={row.my_stock_qty_evolution} textSize="text-xs" />
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
                        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/80 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-500">
                                Affichage de <span className="font-medium">{filteredData.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> à <span className="font-medium">{Math.min(page * pageSize, filteredData.length)}</span> sur <span className="font-medium">{filteredData.length}</span>
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
