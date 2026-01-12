
'use client';

import React, { useState } from 'react';
import { usePriceProducts } from '@/hooks/kpi/usePriceProducts';
import { PriceProductRow } from './components/PriceProductRow';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';
import { Search } from 'lucide-react';
import { Pagination } from '@/components/molecules/Pagination/Pagination';

export const PriceProductTable = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState('my_avg_sell_price');
    const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');

    const itemsPerPage = 10;

    const { data, isLoading } = usePriceProducts({
        page,
        limit: itemsPerPage,
        orderBy,
        orderDirection,
        search
    });

    const handleSort = (field: string) => {
        if (orderBy === field) {
            setOrderDirection(orderDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setOrderBy(field);
            setOrderDirection('desc');
        }
    };

    const getSortProps = (key: string) => ({
        isSortable: true,
        sortDirection: orderBy === key ? orderDirection : null,
        onSort: () => handleSort(key)
    });

    const totalItems = data && data.length > 0 ? data[0]?.total_rows ?? 0 : 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="mt-8 space-y-4">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        Analyse détaillée des prix
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        Cliquez pour voir l&apos;évolution.
                        <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            Astuce : Ctrl + Clic pour filtrer
                        </span>
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            Astuce : Clic sur une ligne pour simuler
                        </span>
                    </p>
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher (Nom, EAN)..."
                        className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none w-full md:w-80"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 w-full bg-gray-50 rounded animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr>
                                        <TableHeaderCell width="35%" align="left" isSticky {...getSortProps('product_name')}>PRODUIT / EAN / LABO</TableHeaderCell>
                                        <TableHeaderCell align="right" className="bg-gray-50 text-gray-900 border-l border-gray-200">PRIX FAB</TableHeaderCell>

                                        {/* Achat (Violet) */}
                                        <TableHeaderCell align="right" variant="purple" {...getSortProps('group_min_purchase_price')}>PA MIN GRP</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="purple" {...getSortProps('group_max_purchase_price')}>PA MAX GRP</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="purple" {...getSortProps('group_avg_purchase_price')}>PA MOY GRP</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="purple" {...getSortProps('my_avg_purchase_price')}>PA MOY MOI</TableHeaderCell>

                                        {/* Vente (Blue) */}
                                        <TableHeaderCell align="right" variant="blue" {...getSortProps('group_min_sell_price')}>PV MIN GRP</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="blue" {...getSortProps('group_max_sell_price')}>PV MAX GRP</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="blue" {...getSortProps('group_avg_sell_price')}>PV MOY GRP</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="blue" {...getSortProps('my_avg_sell_price')}>PV MOY MOI</TableHeaderCell>

                                        {/* Current & Margin */}
                                        <TableHeaderCell align="right" className="bg-gray-50 text-gray-900 border-l border-gray-200" {...getSortProps('my_current_sell_price')}>PV ACTUEL</TableHeaderCell>
                                        <TableHeaderCell align="right" variant="orange" {...getSortProps('my_margin_rate')}>MARGE %</TableHeaderCell>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.map((row) => (
                                        <PriceProductRow key={row.ean13} row={row} />
                                    ))}
                                </tbody>
                            </table>

                            {(!data || data.length === 0) && (
                                <div className="p-12 text-center text-gray-500">
                                    Aucun résultat trouvé.
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            className="bg-gray-50 border-t border-gray-200"
                        />
                    </>
                )}
            </div>
        </div>
    );
};
