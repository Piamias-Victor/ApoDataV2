'use client';

import React, { useState } from 'react';
import { Map } from 'lucide-react';
import { RegionSalesMap } from '@/components/organisms/Pharmacies/components/RegionSalesMap';
import { useRegionSales } from '@/hooks/stats/useRegionSales';
import { useFilterStore } from '@/stores/useFilterStore';
import { formatCurrency } from '@/lib/utils/formatters';
import { Pagination } from '@/components/molecules/Pagination/Pagination';

export const PharmaciesGeoAnalysis: React.FC = () => {
    const regions = useRegionSales();
    const { setRegion } = useFilterStore();
    const [page, setPage] = useState(1);
    const pageSize = 5;

    const handleRegionClick = (regionName: string, isCtrl: boolean) => {
        if (isCtrl) {
            setRegion(regionName);
        }
    };

    // Filter & Pagination Logic
    const sortedData = (regions.data || []).sort((a: any, b: any) => b.value - a.value);
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Map className="w-5 h-5 text-indigo-500" />
                        Analyse Régionale
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Répartition du Chiffre d&apos;Affaires par région.
                        <span className="ml-2 text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            Astuce : Ctrl/Cmd + Clic pour filtrer
                        </span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. MAP */}
                <div className="w-full">
                    <RegionSalesMap
                        data={regions.data || []}
                        isLoading={regions.isLoading}
                        onRegionClick={handleRegionClick}
                    />
                </div>

                {/* 2. RANKING TABLE */}
                <div className="w-full flex flex-col h-full">
                    <div className="relative overflow-x-auto rounded-xl border border-gray-100 shadow-sm flex-grow">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Région</th>
                                    <th className="px-4 py-3 font-medium text-right">CA Total</th>
                                    <th className="px-4 py-3 font-medium text-right">Pharmacies</th>
                                    <th className="px-4 py-3 font-medium text-right">CA Moyen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {regions.isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-24 animate-pulse"></div></td>
                                            <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-16 ml-auto animate-pulse"></div></td>
                                            <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-8 ml-auto animate-pulse"></div></td>
                                            <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-16 ml-auto animate-pulse"></div></td>
                                        </tr>
                                    ))
                                ) : paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">
                                            Aucune donnée disponible
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((region: any, index: number) => {
                                        const globalIndex = (page - 1) * pageSize + index;
                                        return (
                                            <tr
                                                key={region.region}
                                                className="bg-white hover:bg-indigo-50/30 transition-colors cursor-pointer group border-b border-gray-50 last:border-0"
                                                onClick={(e) => handleRegionClick(region.region, e.ctrlKey || e.metaKey)}
                                            >
                                                <td className="px-4 py-3 font-medium text-gray-700 max-w-[150px] truncate">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`inline-flex items-center justify-center w-7 h-7 flex-shrink-0 rounded-full text-[11px] font-bold shadow-sm ${globalIndex < 3
                                                                ? 'bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-700 border border-indigo-100'
                                                                : 'bg-gray-50 text-gray-500 border border-gray-100'
                                                            }`}>
                                                            {globalIndex + 1}
                                                        </span>
                                                        <span className="group-hover:text-indigo-600 transition-colors" title={region.region}>
                                                            {region.region}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-gray-900 group-hover:text-indigo-600">
                                                    {formatCurrency(region.value)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-600">
                                                    {region.pharmacyCount}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-600">
                                                    {formatCurrency(region.averageSales)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {sortedData.length > 0 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                                totalItems={sortedData.length}
                                itemsPerPage={pageSize}
                                className="bg-transparent border-0 p-0"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
