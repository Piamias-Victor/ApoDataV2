'use client';

import React, { useMemo, useState } from 'react';
import { useGenericProductAnalysis } from './hooks/useGenericProductAnalysis';
import { Package, Search } from 'lucide-react';
import { GenericProductTableHeader } from './GenericProductTableHeader';
import { GenericProductTableRow } from './GenericProductTableRow';
import { useClientTableSort } from '@/hooks/useClientTableSort';
import { Pagination } from '@/components/molecules/Pagination/Pagination';
import { ExportCSVButton } from '@/components/molecules/ExportCSVButton';
import { useCSVExport } from '@/hooks/useCSVExport';

export const GenericProductTable: React.FC = () => {
    const { data: result, isLoading } = useGenericProductAnalysis();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const { exportToCSV, isExporting } = useCSVExport();

    const filteredData = useMemo(() => {
        if (!result?.data) return [];
        return result.data.filter(row =>
            row.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.ean13.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.laboratory_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [result, searchTerm]);

    const { sortedData, sortBy, sortOrder, handleSort } = useClientTableSort({
        data: filteredData,
        initialSortBy: 'my_sales_ttc',
        initialSortOrder: 'desc'
    });

    const paginatedData = sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleExport = () => {
        exportToCSV({
            data: filteredData,
            columns: [
                { key: 'product_name', label: 'Produit', type: 'text' },
                { key: 'ean13', label: 'EAN13', type: 'text' },
                { key: 'laboratory_name', label: 'Laboratoire', type: 'text' },
                { key: 'my_sales_ttc', label: 'CA TTC', type: 'currency' },
                { key: 'my_sales_qty', label: 'Vol. Vente', type: 'number' },
                { key: 'my_margin_rate', label: 'Marge %', type: 'percentage' },
            ],
            filename: `generiques-produits-${new Date().toISOString().split('T')[0]}`
        });
    };

    return (
        <div className="mt-8 space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-purple-600" />
                        🧪 Analyse produit
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Détail par produit (Ventes, Achats, Marge).
                        <span className="ml-2 text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            Astuce : Ctrl/Cmd + Clic pour filtrer
                        </span>
                    </p>
                </div>

                <div className="flex gap-3 items-center">
                    <ExportCSVButton onClick={handleExport} isLoading={isExporting} />
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un produit, EAN ou Labo..."
                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm w-full md:w-80 transition-all"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden ring-1 ring-black/5">
                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-12 w-full bg-gray-50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <GenericProductTableHeader
                                    sortBy={sortBy}
                                    sortOrder={sortOrder}
                                    onSort={handleSort}
                                />
                                <tbody className="divide-y divide-gray-100/50">
                                    {paginatedData.map((row) => (
                                        <GenericProductTableRow key={row.ean13} row={row} />
                                    ))}
                                </tbody>
                            </table>
                            {filteredData.length === 0 && (
                                <div className="p-12 text-center">
                                    <p className="text-gray-500">Aucun produit trouvé.</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(filteredData.length / itemsPerPage)}
                            onPageChange={setCurrentPage}
                            totalItems={filteredData.length}
                            itemsPerPage={itemsPerPage}
                            className="bg-gray-50/80 backdrop-blur-sm rounded-b-xl"
                        />
                    </>
                )}
            </div>
        </div>
    );
};
