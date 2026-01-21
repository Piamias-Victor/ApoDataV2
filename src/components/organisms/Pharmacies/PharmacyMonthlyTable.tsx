'use client';

import React, { useMemo, useState } from 'react';
import { usePharmacyMonthlyStats } from './hooks/usePharmacyMonthlyStats';
import { Loader2, TrendingUp, Calendar } from 'lucide-react';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { ValueCell } from '@/components/molecules/Table/ValueCell';
import { Pagination } from '@/components/molecules/Pagination/Pagination';
import { ExportCSVButton } from '@/components/molecules/ExportCSVButton';
import { useCSVExport } from '@/hooks/useCSVExport';


type MetricKey = 'sales_ht' | 'sales_ttc' | 'sales_qty' | 'purchases_ht' | 'purchases_qty';

const METRICS: { value: MetricKey; label: string; isCurrency: boolean; variant: 'blue' | 'purple' | 'orange' | 'green' }[] = [
    { value: 'sales_ttc', label: 'Ventes TTC', isCurrency: true, variant: 'blue' },
    { value: 'sales_qty', label: 'Ventes Quantité', isCurrency: false, variant: 'blue' },
    { value: 'purchases_ht', label: 'Achats HT', isCurrency: true, variant: 'purple' },
    { value: 'purchases_qty', label: 'Achats Quantité', isCurrency: false, variant: 'purple' },
];

export const PharmacyMonthlyTable = () => {
    const { data, isLoading } = usePharmacyMonthlyStats();
    const [selectedMetric, setSelectedMetric] = useState<MetricKey>('sales_ttc');
    const { exportToCSV, isExporting } = useCSVExport();
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const currentMetricConfig = METRICS.find(m => m.value === selectedMetric)!;

    // Pivot Data Logic
    const processedData = useMemo(() => {
        if (!data) return [];
        
        // 1. Identify current year from data (max year)
        const years = Array.from(new Set(data.map(d => d.year_num)));
        const currentYear = Math.max(...years);
        const prevYear = currentYear - 1;

        // 2. Group by Pharmacy
        const pharmacyMap = new Map<string, {
            id: string;
            name: string;
            months: Record<number, number>; // MonthNum (1-12) -> Value
            totalCurrent: number;
            totalPrev: number;
        }>();

        data.forEach(row => {
            const key = row.pharmacy_id;
            if (!pharmacyMap.has(key)) {
                pharmacyMap.set(key, {
                    id: row.pharmacy_id,
                    name: row.pharmacy_name,
                    months: {},
                    totalCurrent: 0,
                    totalPrev: 0
                });
            }

            const entry = pharmacyMap.get(key)!;
            const val = row[selectedMetric]; // Dynamic metric access

            if (row.year_num === currentYear) {
                entry.months[row.month_num] = val;
                entry.totalCurrent += val;
            } else if (row.year_num === prevYear) {
                entry.totalPrev += val;
            }
        });

        // 3. Convert to Array & Calculate Evolution
        return Array.from(pharmacyMap.values()).map(p => ({
            ...p,
            evolution: p.totalPrev > 0 
                ? ((p.totalCurrent - p.totalPrev) / p.totalPrev) * 100 
                : 0
        })).sort((a, b) => b.totalCurrent - a.totalCurrent); // Default sort by total descending

    }, [data, selectedMetric]);

    // Pagination Logic
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedData.slice(startIndex, startIndex + itemsPerPage);
    }, [processedData, currentPage]);

    const handleMetricChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedMetric(e.target.value as MetricKey);
        setCurrentPage(1); // Reset to page 1 on filter change
    };

    const handleExport = () => {
        const exportData = processedData.map(p => ({
            pharmacy_name: p.name,
            jan: p.months[1] || 0,
            feb: p.months[2] || 0,
            mar: p.months[3] || 0,
            apr: p.months[4] || 0,
            may: p.months[5] || 0,
            jun: p.months[6] || 0,
            jul: p.months[7] || 0,
            aug: p.months[8] || 0,
            sep: p.months[9] || 0,
            oct: p.months[10] || 0,
            nov: p.months[11] || 0,
            dec: p.months[12] || 0,
            total: p.totalCurrent,
            evolution: p.evolution,
        }));

        const isCurrency = currentMetricConfig.isCurrency;
        exportToCSV({
            data: exportData,
            columns: [
                { key: 'pharmacy_name', label: 'Pharmacie', type: 'text' },
                { key: 'jan', label: 'Janvier', type: isCurrency ? 'currency' : 'number' },
                { key: 'feb', label: 'Février', type: isCurrency ? 'currency' : 'number' },
                { key: 'mar', label: 'Mars', type: isCurrency ? 'currency' : 'number' },
                { key: 'apr', label: 'Avril', type: isCurrency ? 'currency' : 'number' },
                { key: 'may', label: 'Mai', type: isCurrency ? 'currency' : 'number' },
                { key: 'jun', label: 'Juin', type: isCurrency ? 'currency' : 'number' },
                { key: 'jul', label: 'Juillet', type: isCurrency ? 'currency' : 'number' },
                { key: 'aug', label: 'Août', type: isCurrency ? 'currency' : 'number' },
                { key: 'sep', label: 'Septembre', type: isCurrency ? 'currency' : 'number' },
                { key: 'oct', label: 'Octobre', type: isCurrency ? 'currency' : 'number' },
                { key: 'nov', label: 'Novembre', type: isCurrency ? 'currency' : 'number' },
                { key: 'dec', label: 'Décembre', type: isCurrency ? 'currency' : 'number' },
                { key: 'total', label: 'Total N', type: isCurrency ? 'currency' : 'number' },
                { key: 'evolution', label: 'Évol N-1 %', type: 'percentage' },
            ],
            filename: `pharmacies-mensuel-${selectedMetric}-${new Date().toISOString().split('T')[0]}`
        });
    };

    return (
        <div className="mt-8 space-y-4">
             {/* Header Section */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        Analyse Mensuelle par Pharmacie
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Détail mois par mois de l&apos;année en cours vs total N-1.
                    </p>
                </div>

                <div className="relative group z-20 w-auto">
                    <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md pl-2 pr-4 py-1.5 rounded-2xl border border-white/50 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] hover:bg-white/80 transition-all duration-300 ring-1 ring-black/5 group-hover:ring-purple-500/20">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl shadow-inner border border-amber-100/50 group-hover:scale-105 transition-transform duration-300">
                            <TrendingUp className="w-4 h-4 text-amber-600 drop-shadow-sm" />
                        </div>
                        
                        <div className="flex flex-col relative">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5 ml-0.5">Donnée affichée</span>
                            <div className="relative flex items-center min-w-[140px]">
                                <select
                                    value={selectedMetric}
                                    onChange={handleMetricChange}
                                    className="appearance-none bg-transparent border-none p-0 pr-5 text-sm font-bold text-gray-700 outline-none focus:ring-0 cursor-pointer w-full leading-tight truncate font-sans"
                                >
                                    {METRICS.map(m => (
                                        <option key={m.value} value={m.value} className="bg-white text-gray-700 py-1">
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                                <Loader2 className="w-3.5 h-3.5 text-gray-400 absolute right-0 pointer-events-none group-hover:text-purple-500 transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>

                <ExportCSVButton onClick={handleExport} isLoading={isExporting} />
            </div>

            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <TableHeaderCell isSticky width="15%">Pharmacie</TableHeaderCell>
                                        
                                        {/* Months Columns */}
                                        {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'].map((month, i) => (
                                            <TableHeaderCell key={i} align="right" className="min-w-[80px] text-gray-500">
                                                {month}
                                            </TableHeaderCell>
                                        ))}

                                        {/* Total Column */}
                                        <TableHeaderCell align="right" variant={currentMetricConfig.variant} className="border-l border-gray-200 bg-gray-50">
                                            Total N
                                        </TableHeaderCell>

                                        {/* Evolution Column */}
                                        <TableHeaderCell align="right" variant={currentMetricConfig.variant}>
                                            Evol N-1
                                        </TableHeaderCell>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedData.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                            <TableCell isSticky className="font-medium text-gray-900">
                                                {row.name}
                                            </TableCell>

                                            {/* Months Data */}
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                                <TableCell key={m} align="right">
                                                    <span className={row.months[m] ? "text-gray-700" : "text-gray-300"}>
                                                        {row.months[m] 
                                                            ? (currentMetricConfig.isCurrency 
                                                                ? row.months[m].toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) 
                                                                : row.months[m].toLocaleString('fr-FR'))
                                                            : '-'}
                                                    </span>
                                                </TableCell>
                                            ))}

                                            {/* Total */}
                                            <TableCell align="right" variant={currentMetricConfig.variant} className="border-l border-gray-200 bg-gray-50/30 font-bold">
                                                <ValueCell 
                                                    value={row.totalCurrent} 
                                                    isCurrency={currentMetricConfig.isCurrency} 
                                                    decimals={0}
                                                />
                                            </TableCell>

                                            {/* Evolution */}
                                            <TableCell align="right" variant={currentMetricConfig.variant}>
                                                <ValueCell 
                                                    value={row.evolution} 
                                                    suffix="%" 
                                                    decimals={1}
                                                    className={row.evolution > 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}
                                                />
                                            </TableCell>
                                        </tr>
                                    ))}
                                    {processedData.length === 0 && (
                                        <tr>
                                            <td colSpan={15} className="p-8 text-center text-gray-500">
                                                Aucune donnée disponible.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                         {/* Pagination */}
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={Math.ceil(processedData.length / itemsPerPage)}
                            onPageChange={setCurrentPage}
                            totalItems={processedData.length}
                            itemsPerPage={itemsPerPage}
                            className="bg-gray-50 border-t border-gray-200"
                        />
                    </>
                )}
            </div>
        </div>
    );
};
