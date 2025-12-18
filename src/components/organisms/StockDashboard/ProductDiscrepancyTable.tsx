'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';
import { Calculator, PackageSearch } from 'lucide-react';
import { useClientTableSort } from '@/hooks/useClientTableSort';
import { differenceInDays } from 'date-fns';
// Remove service import
// import { getProductDiscrepancy } from '@/services/kpi/stockDashboardService';
import { ProductDiscrepancyRow } from './components/ProductDiscrepancyRow';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { useFilterStore } from '@/stores/useFilterStore';
import { Pagination } from '@/components/molecules/Pagination/Pagination';

export const ProductDiscrepancyTable = () => {
    const request = useKpiRequest();
    const { setProducts, products } = useFilterStore();
    const [targetDays, setTargetDays] = useState<number>(30);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { data: rawData = [], isLoading } = useQuery({
        queryKey: ['product-discrepancy', request],
        queryFn: async () => {
            const res = await fetch('/api/stock-dashboard/discrepancy/product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            if (!res.ok) throw new Error('Failed to fetch data');
            return res.json();
        }
    });

    const { sortedData, sortBy, sortOrder, handleSort } = useClientTableSort({
        data: rawData,
        initialSortBy: 'ecart_qte',
        initialSortOrder: 'asc'
    });

    const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // daysInPeriod logic
    const start = new Date(request.dateRange.start);
    const end = new Date(request.dateRange.end);
    let daysInPeriod = 30;
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        daysInPeriod = Math.max(1, differenceInDays(end, start));
    }

    const handleRowClick = (row: any, e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Toggle selection
            const isSelected = products.some(p => p.code === row.product_code);
            if (!isSelected) {
                setProducts([...products, { code: row.product_code, name: row.product_name }]);
            } else {
                setProducts(products.filter(p => p.code !== row.product_code));
            }
        }
    };

    const headers = [
        { label: 'Produit', key: 'product_name', align: 'left', width: 'w-[20%]', variant: undefined },
        { label: 'Qte Cmd', key: 'qte_commandee', align: 'right', width: 'w-[6%]', variant: 'purple' },
        { label: 'Qte Reçu', key: 'qte_receptionnee', align: 'right', width: 'w-[6%]', variant: 'purple' },
        { label: 'Ecart', key: 'ecart_qte', align: 'right', width: 'w-[6%]', variant: 'purple' },
        { label: 'Taux Rec.', key: 'taux_reception', align: 'right', width: 'w-[6%]', variant: 'purple' },
        { label: 'Achat €', key: 'prix_achat', align: 'right', width: 'w-[7%]', variant: 'purple' },
        { label: 'Stock Actuel', key: 'stock_actuel', align: 'right', width: 'w-[6%]', variant: 'red' },
        { label: 'Stock Moyen', key: 'stock_moyen', align: 'right', width: 'w-[6%]', variant: 'red' },
        { label: 'Jours', key: 'jours_de_stock', align: 'right', width: 'w-[5%]', variant: 'red' },
        { label: 'A Commander', key: 'qte_a_commander', align: 'right', width: 'w-[8%]', variant: 'purple' },
        { label: 'Ventes', key: 'qte_vendue', align: 'right', width: 'w-[6%]', variant: 'blue' },
        { label: 'Prix Vente', key: 'prix_vente_moyen', align: 'right', width: 'w-[7%]', variant: 'blue' },
        { label: 'Marge %', key: 'marge_moyen_pct', align: 'right', width: 'w-[6%]', variant: 'orange' },
    ] as const;

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <PackageSearch className="w-5 h-5 text-purple-600" />
                        Rupture par Produit
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Détail par référence.
                        <span className="ml-2 text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            Astuce : Ctrl/Cmd + Clic pour filtrer
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                        <Calculator className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-900 whitespace-nowrap">Objectif Stock :</span>
                        <input
                            type="number" min="0" max="365"
                            value={targetDays}
                            onChange={(e) => setTargetDays(Number(e.target.value))}
                            className="w-16 text-center text-sm font-bold text-indigo-700 bg-white border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none px-1 py-0.5"
                        />
                        <span className="text-sm text-indigo-700">j</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/80 backdrop-blur border-b border-gray-100">
                            <tr>
                                {headers.map((header) => (
                                    <TableHeaderCell
                                        key={header.key}
                                        isSortable
                                        sortDirection={sortBy === header.key ? sortOrder : null}
                                        onSort={() => handleSort(header.key as any)}
                                        align={header.align as 'left' | 'right'}
                                        className={header.width}
                                        {...(header.variant ? { variant: header.variant } : {})}
                                    >
                                        {header.key === 'qte_a_commander' ? (
                                            <div className="flex flex-col items-end">
                                                <span>A Commander</span>
                                                <span className="text-[9px] opacity-70 font-normal">Pour {targetDays}j</span>
                                            </div>
                                        ) : header.label}
                                    </TableHeaderCell>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {headers.map((_, j) => (
                                            <TableCell key={j}><div className="h-4 bg-gray-100 rounded w-3/4 mx-auto" /></TableCell>
                                        ))}
                                    </tr>
                                ))
                            ) : sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={headers.length} className="p-8 text-center text-gray-400">
                                        Aucun produit trouvé.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row: any, idx: number) => (
                                    <ProductDiscrepancyRow
                                        key={idx}
                                        row={row}
                                        onClick={(e) => handleRowClick(row, e)}
                                        targetDays={targetDays}
                                        daysInPeriod={daysInPeriod}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                {sortedData.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(sortedData.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        totalItems={sortedData.length}
                        itemsPerPage={itemsPerPage}
                    />
                )}
            </div>
        </div>
    );
};
