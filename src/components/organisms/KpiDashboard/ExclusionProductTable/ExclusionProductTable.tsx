import React from 'react';
import { useProductAnalysis } from '@/components/organisms/ProductAnalysis/hooks/useProductAnalysis';
import { Loader2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { ExclusionTableHeader } from './ExclusionTableHeader';
import { ExclusionTableRow } from './ExclusionTableRow';

interface ExclusionProductTableProps {
    simulationDiscount: number;
}

export const ExclusionProductTable: React.FC<ExclusionProductTableProps> = ({ simulationDiscount }) => {
    
    // Fetch ONLY excluded products
    const {
        data: result,
        isLoading: isLoadingData,
        page,
        setPage,
        sortBy,
        sortOrder,
        handleSort
    } = useProductAnalysis({
        itemsPerPage: 10,
        overrides: { exclusionMode: 'only' }
    });

    const resultData = result?.data || [];
    const totalItems = result?.total || 0;
    const itemsPerPage = 10;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
                 <div className="p-1.5 bg-red-100 rounded-lg text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Détail des Produits Exclus
                </h3>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoadingData ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="animate-spin text-gray-400 w-6 h-6" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <ExclusionTableHeader
                                    sortBy={sortBy}
                                    sortOrder={sortOrder}
                                    onSort={handleSort}
                                />
                                <tbody className="divide-y divide-gray-100/50">
                                    {resultData.length === 0 ? (
                                        <tr>
                                            <td colSpan={14} className="p-8 text-center text-gray-500 text-xs">
                                                Aucun produit exclu trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        resultData.map((row) => (
                                            <ExclusionTableRow 
                                                key={row.ean13} 
                                                row={row} 
                                                simulationDiscount={simulationDiscount}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                         {/* Mini Pagination */}
                         {totalPages > 1 && (
                            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    {totalItems} produits exclus
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <span className="text-xs font-medium text-gray-600 self-center px-2">
                                        {page} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                         )}
                    </>
                )}
            </div>
        </div>
    );
};
