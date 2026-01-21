'use client';

import React, { useState } from 'react';
import { useCalculatedRank } from '@/hooks/useCalculatedRank';
import { useProductAnalysis } from '@/components/organisms/ProductAnalysis/hooks/useProductAnalysis';
import {
    Loader2,
    Package,
    Search
} from 'lucide-react';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { ValueCell } from '@/components/molecules/Table/ValueCell';
import { Pagination } from '@/components/molecules/Pagination/Pagination';
import { useChartFilterInteraction } from '@/hooks/useChartFilterInteraction';

// Note: `useProductAnalysis` manages its own pagination/sorting state internally usually, 
// but we want checking if it exposes `setPage`, `handleSort` etc.
// Based on `ProductAnalysisTableV2`, it returns { data, isLoading, page, setPage, search, setSearch, sortBy, sortOrder, handleSort }

import { RankSelector } from '@/components/molecules/Table/RankSelector';
import { ExportCSVButton } from '@/components/molecules/ExportCSVButton';
import { useCSVExport } from '@/hooks/useCSVExport';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';

export const PharmaciesProductTable: React.FC = () => {

    const {
        data: result,
        isLoading: isLoadingData,
        page,
        setPage,
        search,
        setSearch,
        sortBy,
        sortOrder,
        handleSort
    } = useProductAnalysis();

    // Default rank basis: Sales (can be changed by user)
    const [rankBasis, setRankBasis] = useState<string>('my_sales_ttc');
    const { exportToCSV, isExporting } = useCSVExport();
    const request = useKpiRequest();

    // We treat 'undefined' data as loading state if strict needed, 
    // but hook usually keeps old data
    const resultData = result?.data || [];
    const totalItems = result?.total || 0;
    const itemsPerPage = 20; // Default in hook
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Calculate dynamic ranks on current page data
    const rankMap = useCalculatedRank(resultData, rankBasis as any, (item: any) => item.ean13);

    const { handleInteraction } = useChartFilterInteraction({
        filterType: 'product'
    });

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1); // Reset to page 1 on search
    };

    // Helper for Headers
    const getSortProps = (column: string) => ({
        isSortable: true,
        sortDirection: (sortBy === column ? sortOrder : null) || null,
        onSort: () => handleSort(column)
    });

    const handleExport = async () => {
        try {
            const res = await fetch('/api/stats/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...request, page: 1, limit: 999999, orderBy: sortBy, orderDirection: sortOrder, search })
            });
            if (!res.ok) throw new Error('Failed to fetch data');
            const result = await res.json();
            const allData = result.data || [];

            exportToCSV({
                data: allData,
                columns: [
                    { key: 'product_name', label: 'Produit', type: 'text' },
                    { key: 'ean13', label: 'EAN13', type: 'text' },
                    { key: 'laboratory_name', label: 'Laboratoire', type: 'text' },
                    { key: 'my_purchases_ht', label: 'Achat HT', type: 'currency' },
                    { key: 'my_sales_ttc', label: 'CA TTC', type: 'currency' },
                    { key: 'my_margin_ht', label: 'Marge €', type: 'currency' },
                    { key: 'my_margin_rate', label: 'Marge %', type: 'percentage' },
                    { key: 'my_stock_value_ht', label: 'Stock €', type: 'currency' },
                ],
                filename: `pharmacies-produits-${new Date().toISOString().split('T')[0]}`
            });
        } catch (error) {
            console.error('Erreur export CSV:', error);
        }
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
                        Détail des performances produit (EAN, Laboratoire, Achats, Ventes, Marge, Stock)
                        <span className="ml-2 text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            Astuce : Ctrl/Cmd + Clic pour filtrer
                        </span>
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <ExportCSVButton onClick={handleExport} isLoading={isExporting} />
                    {/* Rank Selector */}
                    <RankSelector
                        value={rankBasis}
                        onChange={setRankBasis}
                        options={[
                            { value: 'my_sales_ttc', label: 'CA Vente TTC' },
                            { value: 'my_sales_qty', label: 'Vol. Vente' },
                            { value: 'my_margin_rate', label: 'Marge %' },
                            { value: 'my_margin_ht', label: 'Marge €' },
                            { value: 'my_stock_value_ht', label: 'Stock €' },
                        ]}
                    />

                    <div className="relative w-full sm:w-auto">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un produit, EAN ou Labo..."
                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm w-full md:w-80 transition-all"
                            value={search}
                            onChange={handleSearch}
                        />
                        {isLoadingData && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden ring-1 ring-black/5 min-h-[400px]">
                {(isLoadingData && !result) ? (
                    <div className="p-8 space-y-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-12 w-full bg-gray-50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50/80 backdrop-blur sticky top-0 z-10 border-b border-gray-100">
                                    <tr>
                                        {/* PRODUIT (Combined: Name, EAN, Labo) */}
                                        <TableHeaderCell isSticky width="30%" {...getSortProps('product_name')}>Produit</TableHeaderCell>

                                        {/* RANG */}
                                        <TableHeaderCell width="4%" align="center" {...getSortProps('my_rank')}>Rang</TableHeaderCell>

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
                                        <TableHeaderCell align="right" variant="blue" width="6%" {...getSortProps('my_sales_ttc')}>CA Vente TTC</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="blue" width="5%" {...getSortProps('my_sales_qty')}>Vente Qte</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="green" width="5%" {...getSortProps('my_pdm_pct')}>
                                            <div className="flex flex-col items-end">
                                                <span>PDM CA Vente</span>
                                                <span className="text-[9px] opacity-70 font-normal normal-case">Montant</span>
                                            </div>
                                        </TableHeaderCell>

                                        {/* MARGE - Orange */}
                                        <TableHeaderCell align="right" variant="orange" width="6%" {...getSortProps('my_margin_ht')}>Marge €</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="orange" width="5%" {...getSortProps('my_margin_rate')}>Marge %</TableHeaderCell>

                                        {/* STOCK - Red (Value Only) */}
                                        <TableHeaderCell align="right" variant="red" width="6%" {...getSortProps('my_stock_value_ht')}>Stock</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="red" width="4%" {...getSortProps('my_days_of_stock')}>J.Stock</TableHeaderCell>
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
                                        resultData.map((row, idx) => {
                                            const displayRank = rankMap.get(row.ean13) ?? row.my_rank;
                                            return (
                                                <tr key={row.ean13 || idx}
                                                    onClick={(e) => handleInteraction({ id: row.ean13, name: row.product_name }, e)}
                                                    className="hover:bg-purple-50/30 transition-colors group cursor-pointer"
                                                >

                                                    {/* Produit Info (Combined) */}
                                                    <TableCell isSticky>
                                                        <div className="flex flex-col max-w-[280px]">
                                                            <span className="font-medium text-gray-900 text-xs truncate block" title={row.product_name}>
                                                                {row.product_name}
                                                            </span>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                                                                    {row.ean13}
                                                                </span>
                                                                <span className="text-[10px] text-blue-600 truncate flex-1 block" title={row.laboratory_name}>
                                                                    {row.laboratory_name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Rank - Bubble Style */}
                                                    <TableCell align="center">
                                                        <span className={`inline-flex items-center justify-center w-7 h-7 flex-shrink-0 rounded-full text-[11px] font-bold ${displayRank <= 10 ? 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-700 shadow-sm' : 'bg-gray-100 text-gray-600 border border-gray-100'}`}>
                                                            #{displayRank}
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
                                                        <ValueCell value={row.my_pdm_purchases_pct} evolution={null} suffix="%" decimals={1} textSize="text-xs" />
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

                                                    {/* Stock € */}
                                                    <TableCell align="right" variant="red">
                                                        <ValueCell value={row.my_stock_value_ht} evolution={row.my_stock_value_ht_evolution} isCurrency textSize="text-xs" />
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
