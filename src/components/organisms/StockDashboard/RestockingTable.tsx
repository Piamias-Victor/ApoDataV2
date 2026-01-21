'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Search,
    Calculator,
    ShoppingCart
} from 'lucide-react';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';
import { useFilterStore } from '@/stores/useFilterStore'; // For Ctrl+Click
import { Pagination } from '@/components/molecules/Pagination/Pagination';
import { ExportCSVButton } from '@/components/molecules/ExportCSVButton';
import { useCSVExport } from '@/hooks/useCSVExport';

// Type for the data returned by our API
interface RestockingItem {
    id: string;
    name: string;
    code: string;
    labo: string;
    sales_velocity: number; // Monthly Average
    stock_actuel: number;
    stock_moyen: number; // Added
    prix_achat: number;
    marge_pct: number;
    qte_commandee: number;
    qte_receptionnee: number;
}

export const RestockingTable: React.FC = () => {
    // 1. Context & State
    const request = useKpiRequest();
    const { setProducts } = useFilterStore(); // For Ctrl+Click
    const [targetDays, setTargetDays] = useState<number>(30);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const itemsPerPage = 10;
    const { exportToCSV, isExporting } = useCSVExport();

    // 2. Data Fetching
    const { data: allData = [], isLoading, error } = useQuery({
        queryKey: ['restocking-data', request],
        queryFn: async () => {
            const res = await fetch('/api/stock-dashboard/restocking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            if (!res.ok) throw new Error('Failed to fetch data');
            return res.json() as Promise<RestockingItem[]>;
        },
        // Keep data fresh but don't refetch on every strict render
        staleTime: 1000 * 60 * 5
    });

    // 3. Client-Side Filtering & Pagination
    // Since we fetch Top 1000, we can filter/paginate locally for instant interactions
    const filteredData = React.useMemo(() => {
        if (!search) return allData;
        const s = search.toLowerCase();
        return allData.filter(item =>
            item.name.toLowerCase().includes(s) ||
            item.code.toLowerCase().includes(s) ||
            item.labo?.toLowerCase().includes(s)
        );
    }, [allData, search]);



    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    // 4. Handlers
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    // Helper for "Qty to Order"
    const getQtyToOrder = (velocityMonth: number, currentStock: number) => {
        const velocityDay = velocityMonth / 30; // Approx
        const targetStock = velocityDay * targetDays;
        const qty = Math.round(targetStock - currentStock);
        return qty > 0 ? qty : 0;
    };

    // Ctrl+Click Interaction
    const handleRowClick = (item: RestockingItem, e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Replace current product selection with this one
            setProducts([{ code: item.code, name: item.name }]);
        }
    };

    const handleExport = () => {
        const exportData = filteredData.map(item => ({
            ...item,
            qty_to_order: getQtyToOrder(item.sales_velocity, item.stock_actuel),
            ecart: item.qte_receptionnee - item.qte_commandee,
            taux_reception: item.qte_commandee > 0 ? (item.qte_receptionnee / item.qte_commandee) * 100 : 100,
        }));

        exportToCSV({
            data: exportData,
            columns: [
                { key: 'name', label: 'Produit', type: 'text' },
                { key: 'code', label: 'EAN', type: 'text' },
                { key: 'labo', label: 'Laboratoire', type: 'text' },
                { key: 'qte_commandee', label: 'Qté Cmd', type: 'number' },
                { key: 'qte_receptionnee', label: 'Qté Reçu', type: 'number' },
                { key: 'ecart', label: 'Écart', type: 'number' },
                { key: 'taux_reception', label: 'Taux %', type: 'percentage' },
                { key: 'stock_actuel', label: 'Stock Actuel', type: 'number' },
                { key: 'stock_moyen', label: 'Stock Moyen', type: 'number' },
                { key: 'sales_velocity', label: 'Vente/Mois', type: 'number' },
                { key: 'qty_to_order', label: `A Cmd (${targetDays}j)`, type: 'number' },
                { key: 'prix_achat', label: 'Prix Achat', type: 'currency' },
                { key: 'marge_pct', label: 'Marge %', type: 'percentage' },
            ],
            filename: `reapprovisionnement-${targetDays}j-${new Date().toISOString().split('T')[0]}`
        });
    };

    if (error) return <div className="text-red-500">Erreur de chargement: {(error as Error).message}</div>;

    return (
        <div className="mt-8 space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-purple-600" />
                        ANALYSE DÉTAILLÉE PAR PRODUIT (STOCK & RUPTURES)
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Vue consolidée : Suivi des Ruptures, Stocks et Prévision de Commande.
                        <span className="ml-2 text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            Astuce : Ctrl/Cmd + Clic pour filtrer
                        </span>
                    </p>
                </div>

                {/* Controls: Target Days + Search */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Simulator Input */}
                    <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
                        <Calculator className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900 whitespace-nowrap">Objectif Stock :</span>
                        <input
                            type="number"
                            min="0"
                            max="365"
                            value={targetDays}
                            onChange={(e) => setTargetDays(Number(e.target.value))}
                            className="w-12 text-center text-sm font-bold text-purple-700 bg-white border border-purple-200 rounded focus:ring-2 focus:ring-purple-500 outline-none px-1 py-0.5"
                        />
                        <span className="text-sm text-purple-700">jours</span>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher produit..."
                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm w-full md:w-64 transition-all"
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>
                </div>
                <ExportCSVButton onClick={handleExport} isLoading={isExporting} />
            </div>

            {/* Content Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden ring-1 ring-black/5 min-h-[400px]">
                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-100/50 rounded animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm">
                                        <TableHeaderCell width="25%">Produit / EAN / Labo</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="purple" width="7%">Qte Cdm</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="purple" width="7%">Qte Reçu</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="purple" width="6%">Ecart</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="purple" width="6%">Taux</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="purple" width="7%">Stock Act</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="purple" width="7%">Stock Moy</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="blue" width="8%">Vente/M</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="purple" width="9%">
                                            <div className="flex flex-col items-end">
                                                <span>A CMD</span>
                                                <span className="text-[8px] opacity-70 font-normal">Obj {targetDays}j</span>
                                            </div>
                                        </TableHeaderCell>
                                        <TableHeaderCell align="right" variant="green" width="8%">Prix</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="green" width="8%">Marge</TableHeaderCell>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/50">
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="p-12 text-center text-gray-500">
                                                Aucun produit à réapprovisionner dans cette sélection.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((row) => {
                                            const qtyToOrder = getQtyToOrder(row.sales_velocity, row.stock_actuel);
                                            const isUrgent = qtyToOrder > 0;
                                            
                                            // Rupture metrics logic
                                            const ecart = row.qte_receptionnee - row.qte_commandee;
                                            const taux = row.qte_commandee > 0 ? (row.qte_receptionnee / row.qte_commandee) * 100 : 100;
                                            
                                            // Handle exactOptionalPropertyTypes for variant
                                            const urgentProps = isUrgent ? { variant: 'purple' as const } : {};

                                            return (
                                                <tr
                                                    key={row.id}
                                                    onClick={(e) => handleRowClick(row, e)}
                                                    className="hover:bg-purple-50/30 transition-colors group cursor-pointer"
                                                    title="Ctrl + Clic pour filtrer ce produit"
                                                >
                                                    {/* Product */}
                                                    <TableCell>
                                                        <div className="flex flex-col max-w-[300px]">
                                                            <span className="font-medium text-gray-900 truncate text-xs" title={row.name}>
                                                                {row.name}
                                                            </span>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                                                                    {row.code}
                                                                </span>
                                                                <span className="text-[10px] text-blue-600 truncate max-w-[150px]">
                                                                    {row.labo}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Rupture Metrics */}
                                                    <TableCell align="right" variant="purple">
                                                        <span className="text-gray-600 text-xs">{row.qte_commandee || '-'}</span>
                                                    </TableCell>
                                                    <TableCell align="right" variant="purple">
                                                        <span className="text-gray-600 text-xs">{row.qte_receptionnee || '-'}</span>
                                                    </TableCell>
                                                    <TableCell align="right" variant="purple">
                                                        <span className={`text-xs font-bold ${ecart < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                            {ecart !== 0 ? ecart : '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell align="right" variant="purple">
                                                        <span className={`text-xs ${taux < 100 ? 'text-orange-600' : 'text-green-600'}`}>
                                                            {row.qte_commandee > 0 ? `${taux.toFixed(0)}%` : '-'}
                                                        </span>
                                                    </TableCell>

                                                    {/* Stock Actuel */}
                                                    <TableCell align="right" variant="purple">
                                                        <span className="font-bold text-gray-700 text-xs">{row.stock_actuel}</span>
                                                    </TableCell>

                                                    {/* Stock Moyen */}
                                                    <TableCell align="right" variant="purple">
                                                        <span className="text-gray-500 text-xs">{Math.round(row.stock_moyen)}</span>
                                                    </TableCell>

                                                    {/* Ventes / Mois */}
                                                    <TableCell align="right" variant="blue">
                                                        <span className="font-bold text-gray-900 text-xs">{row.sales_velocity.toFixed(1)}</span>
                                                    </TableCell>

                                                    {/* Qté à Commander - Dynamic Highlight */}
                                                    <TableCell align="right" variant="purple" {...urgentProps} className={isUrgent ? 'bg-purple-50/50' : ''}>
                                                        <span className={`font-bold ${isUrgent ? 'text-purple-700 text-sm' : 'text-gray-300 text-xs'}`}>
                                                            {qtyToOrder}
                                                        </span>
                                                    </TableCell>

                                                    {/* Prix Achat */}
                                                    <TableCell align="right" variant="green">
                                                        <span className="text-gray-600 text-xs">{row.prix_achat.toFixed(2)}€</span>
                                                    </TableCell>

                                                    {/* Marge */}
                                                    <TableCell align="right" variant="green">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.marge_pct > 25 ? 'bg-green-100 text-green-700' :
                                                            row.marge_pct > 10 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {row.marge_pct.toFixed(0)}%
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
