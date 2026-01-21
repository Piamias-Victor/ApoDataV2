'use client';

import React, { useState } from 'react';
import { useCategoryTree } from './hooks/useCategoryTree';
import {
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Loader2,
    Activity
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';
import { useClientTableSort } from '@/hooks/useClientTableSort';
import { useChartFilterInteraction } from '@/hooks/useChartFilterInteraction';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { Pagination } from '@/components/molecules/Pagination/Pagination';
import { ExportCSVButton } from '@/components/molecules/ExportCSVButton';
import { useCSVExport } from '@/hooks/useCSVExport';

export const CategoryAnalysisTable: React.FC = () => {
    const [path, setPath] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // CSV Export
    const { exportToCSV, isExporting } = useCSVExport();

    const { data: rawData, isLoading, isFetching } = useCategoryTree(path, false);
    const data = rawData as any[];

    // Define Sorting Logic
    const { sortedData, sortBy, sortOrder, handleSort } = useClientTableSort({
        data: data || [],
        initialSortBy: 'sales_ttc',
        initialSortOrder: 'desc'
    });

    // Pagination Logic
    const paginatedData = sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const totalItems = sortedData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handleRowClick = (name: string) => {
        if (path.length >= 5) return;
        setPath([...path, name]);
        setCurrentPage(1); // Reset page on navigation
    };

    const { handleInteraction } = useChartFilterInteraction({
        filterType: 'category',
        currentDepth: path.length,
        onDefaultClick: (data) => handleRowClick(data.name)
    });

    const handleBreadcrumbClick = (index: number) => {
        setPath(prev => prev.slice(0, index + 1));
        setCurrentPage(1); // Reset page on navigation
    };

    // Helper for Evolution Badge
    const EvolutionBadge = ({ value, type = 'percent' }: { value: number, type?: 'percent' | 'point' }) => {
        if (value === undefined || value === null) return <span className="text-gray-300">-</span>;
        const isPositive = value > 0;
        const isNeutral = value === 0;
        const absValue = Math.abs(value);

        return (
            <div className={`
                flex items-center justify-end gap-0.5 text-[10px] font-medium mt-0.5
                ${isPositive ? 'text-green-600' : isNeutral ? 'text-gray-400' : 'text-red-500'}
            `}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : isNeutral ? <Minus className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {isNeutral ? '-' : `${absValue.toFixed(1)}${type === 'percent' ? '%' : ' pts'}`}
            </div>
        );
    };

    const handleExport = () => {
        exportToCSV({
            data: sortedData,
            columns: [
                { key: 'name', label: 'Catégorie', type: 'text' },
                { key: 'purchases_ht', label: 'Achat €', type: 'currency' },
                { key: 'purchases_qty', label: 'Achat Qté', type: 'number' },
                { key: 'sales_ttc', label: 'Vente €', type: 'currency' },
                { key: 'sales_qty', label: 'Vente Qté', type: 'number' },
                { key: 'margin_rate', label: 'Marge %', type: 'percentage' },
                { key: 'market_share_pct', label: 'PDM %', type: 'percentage' },
            ],
            filename: `analyse-categories-${path.length > 0 ? path.join('-') : 'univers'}-${new Date().toISOString().split('T')[0]}`
        });
    };

    return (
        <div className="mt-8 space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-blue-600" />
                        Analyse par Catégorie
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Vue d&apos;ensemble des performances par catégorie
                        <span className="ml-2 text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            Astuce : Ctrl/Cmd + Clic pour filtrer
                        </span>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Export Button */}
                    <ExportCSVButton 
                        onClick={handleExport} 
                        isLoading={isExporting}
                    />
                    
                    {/* Loader Indicator */}
                    {isFetching && (
                        <div className="flex items-center gap-2 text-blue-600 text-xs font-medium bg-blue-50 px-3 py-1.5 rounded-full animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Mise à jour...
                        </div>
                    )}

                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm overflow-x-auto max-w-full">
                        <button
                            onClick={() => { setPath([]); setCurrentPage(1); }}
                            className={`hover:text-blue-600 transition-colors ${path.length === 0 ? 'font-bold text-blue-600' : 'text-gray-500'}`}
                        >
                            Univers
                        </button>
                        {path.map((segment, idx) => (
                            <React.Fragment key={idx}>
                                <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <button
                                    onClick={() => handleBreadcrumbClick(idx)}
                                    className={`whitespace-nowrap hover:text-blue-600 transition-colors ${idx === path.length - 1 ? 'font-bold text-blue-600' : 'text-gray-500'}`}
                                >
                                    {segment}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden ring-1 ring-black/5 relative min-h-[300px]">

                {/* Skeleton Loader - Show when loading OR fetching new data */}
                {(isLoading || isFetching) ? (
                    <div className="p-6 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 animate-pulse">
                                <div className="h-10 w-full bg-gray-100 rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm">
                                        <TableHeaderCell
                                            width="25%"
                                            isSortable
                                            sortDirection={sortBy === 'name' ? sortOrder : null}
                                            onSort={() => handleSort('name')}
                                        >
                                            Univers / Catégorie
                                        </TableHeaderCell>

                                        {/* Achat */}
                                        <TableHeaderCell
                                            align="right" variant="purple" width="12%"
                                            isSortable sortDirection={sortBy === 'purchases_ht' ? sortOrder : null} onSort={() => handleSort('purchases_ht')}
                                        >
                                            <div className="flex flex-col items-end">
                                                <span>Achat €</span>
                                                <span className="text-[9px] opacity-70 font-normal">Sell-in HT</span>
                                            </div>
                                        </TableHeaderCell>
                                        <TableHeaderCell
                                            align="right" variant="purple" width="10%"
                                            isSortable sortDirection={sortBy === 'purchases_qty' ? sortOrder : null} onSort={() => handleSort('purchases_qty')}
                                        >
                                            Achat Qte
                                        </TableHeaderCell>

                                        {/* Vente */}
                                        <TableHeaderCell
                                            align="right" variant="blue" width="12%"
                                            isSortable sortDirection={sortBy === 'sales_ttc' ? sortOrder : null} onSort={() => handleSort('sales_ttc')}
                                        >
                                            <div className="flex flex-col items-end">
                                                <span>Vente €</span>
                                                <span className="text-[9px] opacity-70 font-normal">Sell-out TTC</span>
                                            </div>
                                        </TableHeaderCell>
                                        <TableHeaderCell
                                            align="right" variant="blue" width="10%"
                                            isSortable sortDirection={sortBy === 'sales_qty' ? sortOrder : null} onSort={() => handleSort('sales_qty')}
                                        >
                                            Vente Qte
                                        </TableHeaderCell>

                                        {/* Marge */}
                                        <TableHeaderCell
                                            align="right" variant="orange" width="10%"
                                            isSortable sortDirection={sortBy === 'margin_rate' ? sortOrder : null} onSort={() => handleSort('margin_rate')}
                                        >
                                            Marge %
                                        </TableHeaderCell>

                                        {/* PDM */}
                                        <TableHeaderCell
                                            align="right" variant="green" width="10%"
                                            isSortable sortDirection={sortBy === 'market_share_pct' ? sortOrder : null} onSort={() => handleSort('market_share_pct')}
                                        >
                                            <div className="flex flex-col items-end">
                                                <span>PDM %</span>
                                                <span className="text-[9px] opacity-70 font-normal">Global</span>
                                            </div>
                                        </TableHeaderCell>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/50">
                                    {paginatedData?.filter(r => r.name !== 'AUTRES').length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-16 text-center text-gray-400 font-medium">
                                                Aucune donnée disponible pour cette sélection.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData?.filter((row: any) => row.name !== 'AUTRES' && row.name !== 'Non classé').map((row: any, idx: number) => {
                                            const globalIndex = (currentPage - 1) * itemsPerPage + idx; // For unique key if needed or rank color
                                            // Rank color cycle based on index
                                            const rankColor = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-pink-500'][globalIndex % 5] || 'bg-gray-300';

                                            return (
                                                <tr
                                                    key={idx}
                                                    onClick={(e) => handleInteraction({ name: row.name, id: row.name }, e)}
                                                    className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
                                                >
                                                    {/* Name */}
                                                    <TableCell className="w-[25%]">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-transform group-hover:scale-125 ${rankColor}`} />
                                                            <span className="font-semibold text-gray-700 group-hover:text-blue-700 transition-colors text-xs truncate max-w-[200px]" title={row.name}>
                                                                {row.name}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Achat € */}
                                                    <TableCell align="right" variant="purple">
                                                        <span className="font-bold text-gray-700 text-xs">{formatCurrency(row.purchases_ht)}</span>
                                                        <EvolutionBadge value={row.evolution_purchases} />
                                                    </TableCell>

                                                    {/* Achat Qte */}
                                                    <TableCell align="right" variant="purple">
                                                        <span className="text-gray-500 font-mono text-xs">{formatNumber(row.purchases_qty)}</span>
                                                        <EvolutionBadge value={row.evolution_purchases_qty} />
                                                    </TableCell>

                                                    {/* Vente € */}
                                                    <TableCell align="right" variant="blue">
                                                        <span className="font-bold text-gray-900 text-xs">{formatCurrency(row.sales_ttc)}</span>
                                                        <EvolutionBadge value={row.evolution_sales} />
                                                    </TableCell>

                                                    {/* Vente Qte */}
                                                    <TableCell align="right" variant="blue">
                                                        <span className="text-gray-500 font-mono text-xs">{formatNumber(row.sales_qty)}</span>
                                                        <EvolutionBadge value={row.evolution_sales_qty} />
                                                    </TableCell>

                                                    {/* Marge % */}
                                                    <TableCell align="right" variant="orange">
                                                        <span className={`
                                                            inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold
                                                            ${row.margin_rate >= 30 ? 'bg-green-100 text-green-700' : row.margin_rate >= 20 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-50 text-red-700'}
                                                        `}>
                                                            {row.margin_rate?.toFixed(1)}%
                                                        </span>
                                                        <EvolutionBadge value={row.evolution_margin_rate} type="point" />
                                                    </TableCell>

                                                    {/* PDM % */}
                                                    <TableCell align="right" variant="green">
                                                        <span className="font-bold text-gray-700 text-xs">{row.market_share_pct?.toFixed(1)}%</span>
                                                        <EvolutionBadge value={row.evolution_pdm} type="point" />
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
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
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
