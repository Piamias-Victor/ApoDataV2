'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/stores/useFilterStore';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';
import { formatNumber, formatCurrency } from '@/lib/utils/formatters';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { AlertTriangle, Calculator } from 'lucide-react';
import { useClientTableSort } from '@/hooks/useClientTableSort';
import { differenceInDays } from 'date-fns';
import { Pagination } from '@/components/molecules/Pagination/Pagination';

interface LaboratoryDiscrepancyRow {
    laboratory_name: string;
    qte_commandee: number;
    qte_receptionnee: number;
    ecart_qte: number;
    taux_reception: number;
    prix_achat: number;
    stock_actuel: number;
    stock_moyen: number;
    jours_de_stock: number;
    qte_a_commander: number; // Raw from backend (unused if we calc client side)
    qte_vendue: number;
    prix_vente_moyen: number;
    marge_moyen_pct: number;
}

export const LaboratoryDiscrepancyTable = () => {
    // 1. Context & State
    const request = useKpiRequest();
    const [targetDays, setTargetDays] = useState<number>(30);

    const { data: rawData = [], isLoading } = useQuery({
        queryKey: ['laboratory-discrepancy', request],
        queryFn: async () => {
            const res = await fetch('/api/stock-dashboard/discrepancy/laboratory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            if (!res.ok) throw new Error('Failed to fetch data');
            return res.json() as Promise<LaboratoryDiscrepancyRow[]>;
        }
    });

    // 2. Pre-calculate Metrics for Sorting
    const augmentedData = React.useMemo(() => {
        const start = new Date(request.dateRange.start);
        const end = new Date(request.dateRange.end);
        let daysInPeriod = 30;
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            daysInPeriod = Math.max(1, differenceInDays(end, start));
        }

        return rawData.map(row => {
            // Replicate calc logic
            const salesQty = row.qte_vendue || 0;
            const currentStock = row.stock_actuel || 0;
            const avgDailySales = salesQty / daysInPeriod;
            const targetStock = avgDailySales * targetDays;
            const needed = targetStock - currentStock;
            const qte_a_commander = Math.round(Math.max(0, needed));

            return {
                ...row,
                qte_a_commander 
            };
        });
    }, [rawData, targetDays, request.dateRange]);

    // 3. Sorting
    const { sortedData, sortBy, sortOrder, handleSort } = useClientTableSort({
        data: augmentedData,
        initialSortBy: 'ecart_qte',  
        initialSortOrder: 'asc' 
    });

    // 3. Filtering Logic (Ctrl + Click)
    const { setLaboratories, laboratories } = useFilterStore();

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleRowClick = (row: LaboratoryDiscrepancyRow, e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Add to filter if not exists
            if (!laboratories.find(l => l.name === row.laboratory_name)) {
                setLaboratories([...laboratories, { id: row.laboratory_name, name: row.laboratory_name }]);
            }
        }
    };

    // Helper: Calc A Commander
    const start = new Date(request.dateRange.start);
    const end = new Date(request.dateRange.end);
    let daysInPeriod = 30; // Default
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        daysInPeriod = Math.max(1, differenceInDays(end, start));
    }

    const getQtyToOrder = (salesQty: number, currentStock: number) => {
        // Avg Sales per Day over the selected period
        const avgDailySales = salesQty / daysInPeriod;
        const targetStock = avgDailySales * targetDays;
        const needed = targetStock - currentStock;
        return Math.round(Math.max(0, needed));
    };

    const headers = [
        { label: 'LABO', key: 'laboratory_name', align: 'left', width: 'w-[15%]', variant: undefined },
        { label: 'QTE CDM', key: 'qte_commandee', align: 'right', width: 'w-[6%]', variant: 'purple' },
        { label: 'QTE RECU', key: 'qte_receptionnee', align: 'right', width: 'w-[6%]', variant: 'purple' },
        { label: 'ECART', key: 'ecart_qte', align: 'right', width: 'w-[6%]', variant: 'purple' },
        { label: 'TAUX REC.', key: 'taux_reception', align: 'right', width: 'w-[6%]', variant: 'purple' },
        { label: 'ACHAT HT', key: 'prix_achat', align: 'right', width: 'w-[8%]', variant: 'purple' },
        { label: 'STOCK ACTUEL', key: 'stock_actuel', align: 'right', width: 'w-[6%]', variant: 'red' },
        { label: 'STOCK MOYEN', key: 'stock_moyen', align: 'right', width: 'w-[6%]', variant: 'red' },
        { label: 'JOURS STOCK', key: 'jours_de_stock', align: 'right', width: 'w-[5%]', variant: 'red' },
        { label: `A COMMANDER`, key: 'qte_a_commander', align: 'right', width: 'w-[8%]', variant: 'purple' },
        { label: 'VENDU', key: 'qte_vendue', align: 'right', width: 'w-[6%]', variant: 'blue' },
        { label: 'VENTES/MOIS', key: 'ventes_par_mois', align: 'right', width: 'w-[6%]', variant: 'blue' },
        { label: 'PV MOYEN', key: 'prix_vente_moyen', align: 'right', width: 'w-[8%]', variant: 'blue' },
        { label: '% MARGE', key: 'marge_moyen_pct', align: 'right', width: 'w-[6%]', variant: 'orange' },
    ] as const;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-indigo-600" />
                        TABLEAU DE SUIVI DES STOCKS (PAR LABO)
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Vue consolidée des écarts de livraison et de la performance stock par laboratoire.
                        <span className="ml-2 text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            Astuce : Ctrl/Cmd + Clic pour filtrer
                        </span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Simulator Input */}
                    <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                        <Calculator className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-900 whitespace-nowrap">Objectif Stock :</span>
                        <input
                            type="number"
                            min="0"
                            max="365"
                            value={targetDays}
                            onChange={(e) => setTargetDays(Number(e.target.value))}
                            className="w-16 text-center text-sm font-bold text-indigo-700 bg-white border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none px-1 py-0.5"
                        />
                        <span className="text-sm text-indigo-700">j</span>
                    </div>

                    <div className="text-xs text-gray-400">
                        {sortedData.length} Laboratoires
                    </div>
                </div>
            </div>

            {/* Table */}
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
                                        isSticky={header.key === 'laboratory_name'}
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
                                // Standard Skeleton Loader matching other tables
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {headers.map((_, j) => (
                                            <TableCell key={j}>
                                                <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto" />
                                            </TableCell>
                                        ))}
                                    </tr>
                                ))
                            ) : sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={headers.length} className="p-8 text-center text-gray-400">
                                        Aucun laboratoire trouvé avec les filtres actuels.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row: any, idx: number) => {
                                    const qtyToOrder = getQtyToOrder(row.qte_vendue, row.stock_actuel);
                                    const isUrgent = qtyToOrder > 0;

                                    return (
                                        <tr
                                            key={idx}
                                            onClick={(e) => handleRowClick(row, e)}
                                            className="group hover:bg-indigo-50/30 transition-colors cursor-pointer"
                                        >
                                            <TableCell isSticky className="font-medium text-gray-900 truncate text-xs">
                                                {row.laboratory_name}
                                            </TableCell>
                                            <TableCell align="right" className="text-xs">{formatNumber(row.qte_commandee)}</TableCell>
                                            <TableCell align="right" className="text-xs">{formatNumber(row.qte_receptionnee)}</TableCell>

                                            {/* Ecart Highlight */}
                                            <TableCell align="right" className={`text-xs ${row.ecart_qte < 0 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                                {formatNumber(row.ecart_qte)}
                                            </TableCell>

                                            <TableCell align="right" className={`text-xs ${row.taux_reception < 80 ? 'text-orange-600' : 'text-green-600'}`}>
                                                {row.taux_reception?.toFixed(1)}%
                                            </TableCell>

                                            <TableCell align="right" className="text-xs">{formatCurrency(row.prix_achat)}</TableCell>

                                            <TableCell align="right" className="text-xs">{formatNumber(row.stock_actuel)}</TableCell>
                                            <TableCell align="right" className="text-xs">{formatNumber(row.stock_moyen)}</TableCell>
                                            <TableCell align="right" className="text-xs">{Math.round(row.jours_de_stock)}j</TableCell>

                                            {/* A Commander Dynamic */}
                                            <TableCell align="right" className={`text-xs ${isUrgent ? 'bg-indigo-50/50' : ''}`}>
                                                <span className={`font-bold ${isUrgent ? 'text-indigo-700' : 'text-gray-300'}`}>
                                                    {qtyToOrder > 0 ? formatNumber(qtyToOrder) : '-'}
                                                </span>
                                            </TableCell>

                                            <TableCell align="right" className="text-xs">{formatNumber(row.qte_vendue)}</TableCell>
                                            {/* Ventes / Mois (Calculated: Qty / PeriodDays * 30) */}
                                            <TableCell align="right" className="text-xs text-blue-600 font-medium">
                                                {formatNumber((row.qte_vendue / daysInPeriod) * 30)}
                                            </TableCell>
                                            
                                            <TableCell align="right" className="text-xs">{formatCurrency(row.prix_vente_moyen)}</TableCell>

                                            <TableCell align="right">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${row.marge_moyen_pct < 20 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                                    {row.marge_moyen_pct?.toFixed(1)}%
                                                </span>
                                            </TableCell>
                                        </tr>
                                    )
                                })
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
