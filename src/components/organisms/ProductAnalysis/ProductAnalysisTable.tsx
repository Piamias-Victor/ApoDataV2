import React, { useState } from 'react';
import { useProductAnalysis } from './hooks/useProductAnalysis';
import { Search, Package, Loader2 } from 'lucide-react'; // Changed icon to Package
import { ProductTableHeader } from './ProductTableHeader';
import { ProductTableRow } from './ProductTableRow';
import { Pagination } from '@/components/molecules/Pagination/Pagination';
import { RankSelector } from '@/components/molecules/Table/RankSelector';

export const ProductAnalysisTable = () => {
    // Server-side pagination
    const itemsPerPage = 10;

    const {
        data,
        isLoading,
        page,
        setPage,
        search,
        setSearch,
        sortBy,
        sortOrder,
        handleSort
    } = useProductAnalysis({ itemsPerPage });

    // Default rank basis: Sales
    const [rankBasis, setRankBasis] = useState<string>('my_sales_ttc');

    const totalItems = data?.total || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const resultData = data?.data || [];
    // Ranks are now calculated server-side in the SQL query

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const rankOptions = [
        { value: 'my_sales_ttc', label: 'CA Vente TTC' },
        { value: 'my_sales_qty', label: 'Vol. Vente' },
        { value: 'my_margin_rate', label: 'Marge %' },
        { value: 'my_margin_ht', label: 'Marge €' },
        { value: 'my_pdm_pct', label: 'Part de Marché' },
    ];

    return (
        <div className="mt-8 space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-purple-500" />
                        Analyse des Produits
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Détail de vos produits top performeurs avec comparaison groupement.
                        <span className="ml-2 text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            Astuce : Ctrl/Cmd + Clic pour filtrer
                        </span>
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* Rank Selector */}
                    <RankSelector
                        value={rankBasis}
                        onChange={setRankBasis}
                        options={rankOptions}
                    />

                    <div className="relative w-full sm:w-auto">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un produit ou un EAN..."
                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm w-full md:w-80 transition-all"
                            value={search}
                            onChange={handleSearch}
                        />
                         {isLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                            </div>
                        )}
                    </div>
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
                                <ProductTableHeader
                                    sortBy={sortBy}
                                    sortOrder={sortOrder}
                                    onSort={handleSort}
                                />
                                <tbody className="divide-y divide-gray-100/50">
                                    {resultData.map((row) => (
                                        <ProductTableRow 
                                            key={row.ean13} 
                                            row={row} 
                                            customRank={row.my_rank}
                                        />
                                    ))}
                                </tbody>
                            </table>
                            {(!data?.data.length) && (
                                <div className="p-12 text-center">
                                    <p className="text-gray-500">Aucun produit trouvé.</p>
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
                            className="bg-gray-50/80 backdrop-blur-sm rounded-b-xl"
                        />
                    </>
                )}
            </div>
        </div>
    );
};
