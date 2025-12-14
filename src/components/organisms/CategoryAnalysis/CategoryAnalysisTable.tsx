
'use client';

import React, { useState } from 'react';
import { useCategoryTree } from './hooks/useCategoryTree';
import {
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Loader2,
    Activity
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';

export const CategoryAnalysisTable: React.FC = () => {
    const [path, setPath] = useState<string[]>([]);

    const { data: rawData, isLoading, isFetching } = useCategoryTree(path, false);
    const data = rawData as any[];

    const handleRowClick = (name: string) => {
        if (path.length >= 5) return;
        setPath([...path, name]);
    };

    const handleBreadcrumbClick = (index: number) => {
        setPath(prev => prev.slice(0, index + 1));
    };

    // Helper for Evolution Badge
    const EvolutionBadge = ({ value, type = 'percent' }: { value: number, type?: 'percent' | 'point' }) => {
        if (value === undefined || value === null) return <span className="text-gray-300">-</span>;
        const isPositive = value > 0;
        const isNeutral = value === 0;
        const absValue = Math.abs(value);

        return (
            <div className={`
                flex items-center justify-end gap-0.5 text-[10px] font-medium mt-0.5
                ${isPositive ? 'text-green-600' : isNeutral ? 'text-gray-400' : 'text-red-500'}
            `}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : isNeutral ? <Minus className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {isNeutral ? '-' : `${absValue.toFixed(1)}${type === 'percent' ? '%' : ' pts'}`}
            </div>
        );
    };

    const headers = [
        { label: 'Univers / Catégorie', align: 'left', width: 'w-[25%]' },
        // Achat €
        { label: 'Achat €', align: 'right', subLabel: 'Sell-in HT', width: 'w-[12%]' },
        // Achat Qte
        { label: 'Achat Qte', align: 'right', width: 'w-[10%]' },
        // Vente €
        { label: 'Vente €', align: 'right', subLabel: 'Sell-out TTC', width: 'w-[12%]' },
        // Vente Qte
        { label: 'Vente Qte', align: 'right', width: 'w-[10%]' },
        // Marge %
        { label: 'Marge %', align: 'right', width: 'w-[10%]' },
        // PDM %
        { label: 'PDM %', align: 'right', subLabel: 'Global', width: 'w-[10%]' },
    ];

    return (
        <div className="mt-8 space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-blue-600" />
                        Analyse par Catégorie
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Vue d&apos;ensemble des performances par catégorie
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Loader Indicator */}
                    {isFetching && (
                        <div className="flex items-center gap-2 text-blue-600 text-xs font-medium bg-blue-50 px-3 py-1.5 rounded-full animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Mise à jour...
                        </div>
                    )}

                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm overflow-x-auto max-w-full">
                        <button
                            onClick={() => setPath([])}
                            className={`hover:text-blue-600 transition-colors ${path.length === 0 ? 'font-bold text-blue-600' : 'text-gray-500'}`}
                        >
                            Univers
                        </button>
                        {path.map((segment, idx) => (
                            <React.Fragment key={idx}>
                                <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <button
                                    onClick={() => handleBreadcrumbClick(idx)}
                                    className={`whitespace-nowrap hover:text-blue-600 transition-colors ${idx === path.length - 1 ? 'font-bold text-blue-600' : 'text-gray-500'}`}
                                >
                                    {segment}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden ring-1 ring-black/5 relative min-h-[300px]">

                {/* Skeleton Loader - Show when loading OR fetching new data */}
                {(isLoading || isFetching) ? (
                    <div className="p-6 space-y-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 animate-pulse">
                                <div className="h-10 w-[25%] bg-gray-100 rounded-lg" />
                                <div className="h-10 w-[12%] bg-gray-100 rounded-lg" />
                                <div className="h-10 w-[10%] bg-gray-100 rounded-lg" />
                                <div className="h-10 w-[12%] bg-gray-100 rounded-lg" />
                                <div className="h-10 w-[10%] bg-gray-100 rounded-lg" />
                                <div className="h-10 w-[10%] bg-gray-100 rounded-lg" />
                                <div className="h-10 w-[10%] bg-gray-100 rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/80 backdrop-blur sticky top-0 z-10 border-b border-gray-100">
                                <tr>
                                    {headers.map((header, idx) => (
                                        <th
                                            key={idx}
                                            className={`
                                                px-4 py-3 text-${header.align} font-semibold text-gray-600 uppercase tracking-wider text-xs
                                                ${header.width}
                                            `}
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <span>{header.label}</span>
                                                {header.subLabel && <span className="text-[10px] text-gray-400 font-normal normal-case">{header.subLabel}</span>}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/50">
                                {data?.filter(r => r.name !== 'AUTRES').length === 0 ? (
                                    <tr>
                                        <td colSpan={headers.length} className="p-16 text-center text-gray-400 font-medium">
                                            Aucune donnée disponible pour cette sélection.
                                        </td>
                                    </tr>
                                ) : (
                                    data?.filter(row => row.name !== 'AUTRES' && row.name !== 'Non classé').map((row, idx) => {
                                        const rankColor = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-pink-500'][idx % 5] || 'bg-gray-300';

                                        return (
                                            <tr
                                                key={idx}
                                                onClick={() => handleRowClick(row.name)}
                                                className="group hover:bg-blue-50/40 transition-all duration-200 cursor-pointer"
                                            >
                                                {/* Name */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-transform group-hover:scale-125 ${rankColor}`} />
                                                        <span className="font-semibold text-gray-700 group-hover:text-blue-700 transition-colors text-sm">
                                                            {row.name}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Achat € */}
                                                <td className="px-4 py-3 text-right">
                                                    <div className="font-medium text-gray-600">{formatCurrency(row.purchases_ht)}</div>
                                                    <EvolutionBadge value={row.evolution_purchases} />
                                                </td>

                                                {/* Achat Qte */}
                                                <td className="px-4 py-3 text-right">
                                                    <div className="text-gray-500 font-mono text-xs">{formatNumber(row.purchases_qty)}</div>
                                                    <EvolutionBadge value={row.evolution_purchases_qty} />
                                                </td>

                                                {/* Vente € */}
                                                <td className="px-4 py-3 text-right">
                                                    <div className="font-bold text-gray-900">{formatCurrency(row.sales_ttc)}</div>
                                                    <EvolutionBadge value={row.evolution_sales} />
                                                </td>

                                                {/* Vente Qte */}
                                                <td className="px-4 py-3 text-right">
                                                    <div className="text-gray-500 font-mono text-xs">{formatNumber(row.sales_qty)}</div>
                                                    <EvolutionBadge value={row.evolution_sales_qty} />
                                                </td>

                                                {/* Marge % */}
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`
                                                        inline-flex items-center px-2 py-0.5 rounded text-xs font-bold
                                                        ${row.margin_rate >= 30 ? 'bg-green-100 text-green-700' : row.margin_rate >= 20 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-50 text-red-700'}
                                                    `}>
                                                        {row.margin_rate?.toFixed(1)}%
                                                    </span>
                                                    <EvolutionBadge value={row.evolution_margin_rate} type="point" />
                                                </td>

                                                {/* PDM % */}
                                                <td className="px-4 py-3 text-right">
                                                    <div className="font-semibold text-gray-700">{row.market_share_pct?.toFixed(1)}%</div>
                                                    <EvolutionBadge value={row.evolution_pdm} type="point" />
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
