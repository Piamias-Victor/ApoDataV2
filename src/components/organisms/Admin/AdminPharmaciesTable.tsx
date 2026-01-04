'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { usePharmaciesAnalysis } from '../Pharmacies/hooks/usePharmaciesAnalysis';
import {
    Loader2,
    Search
} from 'lucide-react';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { ValueCell } from '@/components/molecules/Table/ValueCell';
import { Pagination } from '@/components/molecules/Pagination/Pagination';

import { useClientTableSort } from '@/hooks/useClientTableSort';

import { EditPharmacyModal } from './EditPharmacyModal';
import { useQueryClient } from '@tanstack/react-query';

export const AdminPharmaciesTable: React.FC = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // State for Editing
    const [editingPharmacy, setEditingPharmacy] = useState<any | null>(null);

    // Use existing hook as it now provides City/Region
    const { data: rawData, isLoading, isFetching } = usePharmaciesAnalysis();

    const safeData = useMemo(() => rawData || [], [rawData]);

    const filteredData = useMemo(() => {
        if (!search) return safeData;
        const lowSearch = search.toLowerCase();
        return safeData.filter(row =>
            row.pharmacy_name.toLowerCase().includes(lowSearch) ||
            row.pharmacy_city?.toLowerCase().includes(lowSearch) ||
            row.pharmacy_region?.toLowerCase().includes(lowSearch)
        );
    }, [safeData, search]);

    const { sortedData, sortBy, sortOrder, handleSort } = useClientTableSort({
        data: filteredData,
        initialSortBy: 'sales_ttc',
        initialSortOrder: 'desc'
    });

    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const handleSuccess = () => {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['pharmacy-analysis', 'all'] });
        queryClient.invalidateQueries({ queryKey: ['pharmacy-analysis'] });
    };

    const getSortProps = (column: string) => ({
        isSortable: true,
        sortDirection: (sortBy === column ? sortOrder : null) || null,
        onSort: () => handleSort(column)
    });

    return (
        <div className="space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher (Nom, Ville, Région)..."
                        className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm w-full transition-all"
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {(isLoading && !rawData) ? (
                    <div className="p-8 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 w-full bg-gray-50 rounded animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <TableHeaderCell width="25%" {...getSortProps('pharmacy_name')}>Pharmacie</TableHeaderCell>
                                        <TableHeaderCell width="20%" {...getSortProps('pharmacy_city')}>Ville</TableHeaderCell>
                                        <TableHeaderCell width="20%" {...getSortProps('pharmacy_region')}>Région</TableHeaderCell>
                                        <TableHeaderCell align="right" width="15%" {...getSortProps('sales_ttc')}>CA Total (TTC)</TableHeaderCell>
                                        <TableHeaderCell align="center" width="20%">Actions</TableHeaderCell>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center text-gray-500">
                                                Aucune pharmacie trouvée.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((row) => (
                                            <tr key={row.pharmacy_id} className="hover:bg-gray-50 transition-colors">
                                                <TableCell>
                                                    <span className="font-medium text-gray-900">{row.pharmacy_name}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-gray-600">{row.pharmacy_city || '-'}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-gray-600">{row.pharmacy_region || '-'}</span>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <ValueCell value={row.sales_ttc} isCurrency textSize="text-sm" />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <button
                                                        onClick={() => setEditingPharmacy(row)}
                                                        className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-purple-50 text-gray-600 hover:text-purple-600 rounded-lg transition-all duration-200 border border-gray-200 hover:border-purple-200 font-medium text-xs"
                                                    >
                                                        <span>Gérer</span>
                                                        <Search className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                                    </button>
                                                </TableCell>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            totalItems={sortedData.length}
                            itemsPerPage={pageSize}
                            className="bg-gray-50 border-t border-gray-200"
                        />
                    </>
                )}
            </div>

            <EditPharmacyModal
                isOpen={!!editingPharmacy}
                onClose={() => setEditingPharmacy(null)}
                onSuccess={handleSuccess}
                pharmacy={editingPharmacy}
            />
        </div>
    );
};
