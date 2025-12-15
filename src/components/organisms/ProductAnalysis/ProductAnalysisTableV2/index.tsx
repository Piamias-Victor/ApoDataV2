'use client';

import React from 'react';
import { useProductAnalysis } from '../hooks/useProductAnalysis';
import { Package, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';

export const ProductAnalysisTableV2: React.FC = () => {
    const { data: result, isLoading: isLoadingData, page, setPage, search, setSearch } = useProductAnalysis();

    // We treat 'undefined' data as loading state if we want strict skeleton, 
    // but hook usually returns previous data while fetching.
    const isLoading = isLoadingData && !result;

    const resultData = result?.data || [];
    const totalItems = result?.total || 0;
    const itemsPerPage = 20; // Must match hook default if fixed
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
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
                        Détail des performances par produit (Achats, Ventes, Marge, Prix, Stock)
                    </p>
                </div>

                <div className="relative">
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

            {/* Content Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden ring-1 ring-black/5 min-h-[400px]">
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
                                <TableHeader />
                                <tbody className="divide-y divide-gray-100/50">
                                    {resultData.length === 0 ? (
                                        <tr>
                                            <td colSpan={17} className="p-12 text-center text-gray-500">
                                                Aucun produit trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        resultData.map((row) => (
                                            <TableRow key={row.ean13} row={row} />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/80 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-500">
                                Affichage de <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> à <span className="font-medium">{Math.min(page * itemsPerPage, totalItems)}</span> sur <span className="font-medium">{totalItems}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || totalPages === 0}
                                    className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                                >
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
