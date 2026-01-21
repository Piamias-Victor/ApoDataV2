'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { usePharmaciesAnalysis } from './hooks/usePharmaciesAnalysis';
import {
    Loader2,
    Building2,
    Search
} from 'lucide-react';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { ValueCell } from '@/components/molecules/Table/ValueCell';
import { Pagination } from '@/components/molecules/Pagination/Pagination';
import { ExportCSVButton } from '@/components/molecules/ExportCSVButton';
import { useCSVExport } from '@/hooks/useCSVExport';

import { useClientTableSort } from '@/hooks/useClientTableSort';
import { useChartFilterInteraction } from '@/hooks/useChartFilterInteraction';

export const PharmaciesDetailedTable: React.FC = () => {

    // State
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;
    
    // CSV Export
    const { exportToCSV, isExporting } = useCSVExport();

    const { data: rawData, isLoading, isFetching } = usePharmaciesAnalysis();

    // Default empty array
    const safeData = useMemo(() => rawData || [], [rawData]);

    // Filter Logic Only (Search client-side as well for responsiveness)
    const filteredData = useMemo(() => {
        if (!search) return safeData;
        return safeData.filter(row =>
            row.pharmacy_name.toLowerCase().includes(search.toLowerCase())
        );
    }, [safeData, search]);

    // Sorting Logic
    const { sortedData, sortBy, sortOrder, handleSort } = useClientTableSort({
        data: filteredData,
        initialSortBy: 'sales_ttc',
        initialSortOrder: 'desc'
    });

    // Pagination Logic
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

    // Reset page on search change
    useEffect(() => {
        setPage(1);
    }, [search]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    // We can use chart interaction filter if we want to filter OTHER charts by clicking a pharmacy
    // But since this is the Pharmacies page, usually clicking a pharmacy might select it as a global filter.
    const { handleInteraction } = useChartFilterInteraction({
        filterType: 'pharmacy'
    });

    // Helper for Headers
    const getSortProps = (column: string) => ({
        isSortable: true,
        sortDirection: (sortBy === column ? sortOrder : null) || null,
        onSort: () => handleSort(column)
    });

    const handleExport = () => {
        exportToCSV({
            data: sortedData,
            columns: [
                { key: 'pharmacy_name', label: 'Pharmacie', type: 'text' },
                { key: 'rank', label: 'Rang', type: 'number' },
                { key: 'purchases_ht', label: 'Achat HT', type: 'currency' },
                { key: 'purchases_qty', label: 'Achat Qté', type: 'number' },
                { key: 'pdm_purchases_pct', label: 'PDM Achat %', type: 'percentage' },
                { key: 'sales_ttc', label: 'Vente TTC', type: 'currency' },
                { key: 'sales_qty', label: 'Vente Qté', type: 'number' },
                { key: 'pdm_sales_pct', label: 'PDM Vente %', type: 'percentage' },
                { key: 'margin_ht', label: 'Marge €', type: 'currency' },
                { key: 'margin_rate', label: 'Marge %', type: 'percentage' },
                { key: 'stock_value_ht', label: 'Stock €', type: 'currency' },
                { key: 'days_of_stock', label: 'J.Stock', type: 'number' },
            ],
            filename: `analyse-pharmacies-${new Date().toISOString().split('T')[0]}`
        });
    };

    return (
        <div className="mt-8 space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                        Analyse Détaillée par Pharmacie
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Détail des performances par pharmacie (Achats, Ventes, Marge, Stock)
                        <span className="ml-2 text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            Astuce : Ctrl/Cmd + Clic pour filtrer
                        </span>
                    </p>
                </div>

                <div className="flex gap-3 items-center">
                    {/* Export Button */}
                    <ExportCSVButton 
                        onClick={handleExport} 
                        isLoading={isExporting}
                    />
                    
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher une pharmacie..."
                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm w-full md:w-64 transition-all"
                            value={search}
                            onChange={handleSearch}
                        />
                        {isFetching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                            </div>
                        )}
                    </div>
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
                                        {/* PHARMACIE */}
                                        <TableHeaderCell width="18%" isSticky {...getSortProps('pharmacy_name')}>Pharmacie</TableHeaderCell>
                                        <TableHeaderCell width="4%" align="center" {...getSortProps('rank')}>Rang</TableHeaderCell>

                                        {/* ACHAT - Purple */}
                                        <TableHeaderCell align="right" variant="purple" width="6%" {...getSortProps('purchases_ht')}>Achat HT</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="purple" width="5%" {...getSortProps('purchases_qty')}>Achat Qte</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="green" width="5%" {...getSortProps('pdm_purchases_pct')}>
                                            <div className="flex flex-col items-end">
                                                <span>PDM Achat</span>
                                                <span className="text-[9px] opacity-70 font-normal normal-case">Montant</span>
                                            </div>
                                        </TableHeaderCell>

                                        {/* VENTE - Blue */}
                                        <TableHeaderCell align="right" variant="blue" width="6%" {...getSortProps('sales_ttc')}>Vente TTC</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="blue" width="5%" {...getSortProps('sales_qty')}>Vente Qte</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="green" width="5%" {...getSortProps('pdm_sales_pct')}>
                                            <div className="flex flex-col items-end">
                                                <span>PDM Vente</span>
                                                <span className="text-[9px] opacity-70 font-normal normal-case">Montant</span>
                                            </div>
                                        </TableHeaderCell>

                                        {/* MARGE - Orange */}
                                        <TableHeaderCell align="right" variant="orange" width="6%" {...getSortProps('margin_ht')}>Marge €</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="orange" width="5%" {...getSortProps('margin_rate')}>Marge %</TableHeaderCell>

                                        {/* STOCK - Red */}
                                        <TableHeaderCell align="right" variant="red" width="6%" {...getSortProps('stock_value_ht')}>Stock €</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="red" width="4%" {...getSortProps('days_of_stock')}>J.Stock</TableHeaderCell>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/50">
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={15} className="p-12 text-center text-gray-500">
                                                Aucune pharmacie trouvée.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((row, idx) => {

                                            // Handle Interaction (Ctrl+Click)
                                            // Since interaction hook expects { id, name }, we pass pharmacyId
                                            const onRowClick = (e: React.MouseEvent) => {
                                                handleInteraction({ id: row.pharmacy_id, name: row.pharmacy_name }, e);
                                            };

                                            return (
                                                <tr key={idx}
                                                    onClick={onRowClick}
                                                    className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                                                >

                                                    {/* Pharmacy Name */}
                                                    <TableCell isSticky>
                                                        <div className="flex flex-col max-w-[180px]">
                                                            <span className="font-medium text-gray-900 text-xs truncate block" title={row.pharmacy_name}>
                                                                {row.pharmacy_name}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Rank - Bubble Style */}
                                                    <TableCell align="center">
                                                        <span className={`inline-flex items-center justify-center w-7 h-7 flex-shrink-0 rounded-full text-[11px] font-bold ${row.rank <= 3 ? 'bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm' : 'bg-gray-100 text-gray-600 border border-gray-100'}`}>
                                                            #{row.rank}
                                                        </span>
                                                    </TableCell>

                                                    {/* Achat HT */}
                                                    <TableCell align="right" variant="purple">
                                                        <ValueCell value={row.purchases_ht} evolution={row.purchases_evolution} isCurrency textSize="text-xs" />
                                                    </TableCell>
                                                    {/* Achat Qte */}
                                                    <TableCell align="right" variant="purple">
                                                        <ValueCell value={row.purchases_qty} evolution={row.purchases_qty_evolution} textSize="text-xs" />
                                                    </TableCell>
                                                    {/* PDM Achat */}
                                                    <TableCell align="right" variant="green">
                                                        <ValueCell value={row.pdm_purchases_pct} evolution={0} suffix="%" decimals={1} textSize="text-xs" />
                                                    </TableCell>

                                                    {/* Vente TTC */}
                                                    <TableCell align="right" variant="blue">
                                                        <ValueCell value={row.sales_ttc} evolution={row.sales_evolution} isCurrency textSize="text-xs" />
                                                    </TableCell>
                                                    {/* Vente Qte */}
                                                    <TableCell align="right" variant="blue">
                                                        <ValueCell value={row.sales_qty} evolution={row.sales_qty_evolution} textSize="text-xs" />
                                                    </TableCell>
                                                    {/* PDM Vente */}
                                                    <TableCell align="right" variant="green">
                                                        <ValueCell value={row.pdm_sales_pct} evolution={row.pdm_sales_evolution} suffix="%" decimals={1} textSize="text-xs" />
                                                    </TableCell>

                                                    {/* Marge € */}
                                                    <TableCell align="right" variant="orange">
                                                        <ValueCell value={row.margin_ht} evolution={row.margin_ht_evolution} isCurrency textSize="text-xs" />
                                                    </TableCell>
                                                    {/* Marge % */}
                                                    <TableCell align="right" variant="orange">
                                                        <ValueCell value={row.margin_rate} evolution={row.margin_rate_evolution} suffix="%" decimals={1} textSize="text-xs" />
                                                    </TableCell>

                                                    {/* Stock € */}
                                                    <TableCell align="right" variant="red">
                                                        <ValueCell value={row.stock_value_ht} evolution={row.stock_value_evolution} isCurrency textSize="text-xs" />
                                                    </TableCell>
                                                    {/* J.Stock */}
                                                    <TableCell align="right" variant="red">
                                                        <span className={`font-bold text-xs ${(row.days_of_stock || 0) > 90 ? 'text-red-600' :
                                                            (row.days_of_stock || 0) > 60 ? 'text-orange-600' : 'text-gray-800'
                                                            }`}>
                                                            {row.days_of_stock?.toFixed(0)}j
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
                            totalItems={sortedData.length}
                            itemsPerPage={pageSize}
                            className="bg-gray-50/80 backdrop-blur-sm rounded-b-xl"
                        />
                    </>
                )}
            </div>
        </div>
    );
};
