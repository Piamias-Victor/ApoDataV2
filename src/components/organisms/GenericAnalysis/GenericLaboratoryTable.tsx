
import React, { useMemo, useState } from 'react';
import { useGenericLaboratoryAnalysis } from '@/hooks/useGenericLaboratoryAnalysis';
import { Search } from 'lucide-react';
import { GenericLaboratoryTableHeader } from './GenericLaboratoryTableHeader';
import { GenericLaboratoryTableRow } from './GenericLaboratoryTableRow';
import { useClientTableSort } from '@/hooks/useClientTableSort';
import { Pagination } from '@/components/molecules/Pagination/Pagination';
import { GenericLaboratoryRow } from '@/types/kpi';

export const GenericLaboratoryTable = () => {
    const { data, isLoading } = useGenericLaboratoryAnalysis();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter(row =>
            row.laboratory_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    const { sortedData, sortBy, sortOrder, handleSort } = useClientTableSort({
        data: filteredData,
        initialSortBy: 'my_sales_ttc', // Default sort by CA Vente
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

    return (
        <div className="mt-8 space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        🔬 Analyse par Laboratoire
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Performance détaillée par laboratoire pour les groupes sélectionnés.
                        <span className="ml-2 text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            Astuce : Ctrl/Cmd + Clic pour filtrer
                        </span>
                    </p>
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un laboratoire..."
                        className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none shadow-sm w-full md:w-64 transition-all"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            {/* Content Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden ring-1 ring-black/5">
                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 w-full bg-gray-50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <GenericLaboratoryTableHeader
                                    sortBy={sortBy}
                                    sortOrder={sortOrder}
                                    onSort={handleSort}
                                />
                                <tbody className="divide-y divide-gray-100/50">
                                    {paginatedData.map((row: GenericLaboratoryRow) => (
                                        <GenericLaboratoryTableRow key={row.laboratory_name} row={row} />
                                    ))}
                                </tbody>
                            </table>
                            {filteredData.length === 0 && (
                                <div className="p-12 text-center">
                                    <p className="text-gray-500">Aucun laboratoire trouvé.</p>
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
