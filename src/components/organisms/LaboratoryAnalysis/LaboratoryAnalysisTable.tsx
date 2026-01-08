import React, { useMemo, useState } from 'react';
import { useLaboratoryAnalysis } from './hooks/useLaboratoryAnalysis';
import { Search } from 'lucide-react';
import { LaboratoryTableHeader } from './LaboratoryTableHeader';
import { LaboratoryTableRow } from './LaboratoryTableRow';
import { useClientTableSort } from '@/hooks/useClientTableSort';
import { Pagination } from '@/components/molecules/Pagination/Pagination';
import { useCalculatedRank } from '@/hooks/useCalculatedRank';
import { LaboratoryAnalysisRow } from '@/types/kpi';
import { RankSelector } from '@/components/molecules/Table/RankSelector';

export const LaboratoryAnalysisTable = () => {
    const { data, isLoading } = useLaboratoryAnalysis();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rankBasis, setRankBasis] = useState<keyof LaboratoryAnalysisRow>('my_sales_ttc');
    const itemsPerPage = 10;

    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter(row =>
            row.laboratory_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    // Calculate dynamic ranks based on the filtered dataset (but BEFORE sorting for display)
    // We want the rank mainly to be consistent across the whole filtered set
    const rankMap = useCalculatedRank(filteredData, rankBasis, (item) => item.laboratory_name);

    const { sortedData, sortBy, sortOrder, handleSort } = useClientTableSort({
        data: filteredData,
        initialSortBy: 'my_rank',
        initialSortOrder: 'asc'
    });

    const paginatedData = sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const rankOptions = [
        { value: 'my_sales_ttc', label: 'CA Vente TTC' },
        { value: 'my_sales_qty', label: 'Vol. Vente' },
        { value: 'my_margin_rate', label: 'Marge %' },
        { value: 'my_pdm_pct', label: 'Part de Marché' },
        { value: 'my_purchases_ht', label: 'Vol. Achat €' },
    ];

    return (
        <div className="mt-8 space-y-4">
            {/* Header Section - Always Visible */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        🧪 Analyse des Laboratoires
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Comparaison détaillée de vos performances vs la moyenne du groupement.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* Rank Selector */}
                    <RankSelector
                        value={rankBasis}
                        onChange={(val) => setRankBasis(val as keyof LaboratoryAnalysisRow)}
                        options={rankOptions}
                    /> 
                    
                    <div className="relative w-full sm:w-auto">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un laboratoire..."
                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm w-full md:w-64 transition-all"
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
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 w-full bg-gray-50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <LaboratoryTableHeader
                                    sortBy={sortBy}
                                    sortOrder={sortOrder}
                                    onSort={handleSort}
                                />
                                <tbody className="divide-y divide-gray-100/50">
                                    {paginatedData.map((row) => (
                                        <LaboratoryTableRow 
                                            key={row.laboratory_name} 
                                            row={row} 
                                            customRank={rankMap.get(row.laboratory_name)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                            {filteredData.length === 0 && (
                                <div className="p-12 text-center">
                                    <p className="text-gray-500">Aucun laboratoire trouvé pour cette recherche.</p>
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
