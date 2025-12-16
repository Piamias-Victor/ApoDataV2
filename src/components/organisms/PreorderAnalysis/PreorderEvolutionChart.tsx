'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePreorderEvolution } from './hooks/usePreorderEvolution';
import { Grain } from '@/types/kpi';
import { EvolutionChart, SeriesConfig } from '@/components/organisms/TemporalEvolution/components/EvolutionChart';
import { PackageSearch } from 'lucide-react'; // Changed icon
import { useFilterStore } from '@/stores/useFilterStore';
import { differenceInMonths, parseISO, isValid } from 'date-fns';
import { DataType } from '@/components/organisms/TemporalEvolution/hooks/useEvolutionData';

export const PreorderEvolutionChart: React.FC = () => {
    const { dateRange } = useFilterStore();
    const [grain, setGrain] = useState<Grain>('month'); // Default to month
    const [dataType] = useState<DataType>('value'); // Kept for controls consistency, though we likely only want 'value' here

    // Day disabled logic (reused)
    const isDayDisabled = useMemo(() => {
        if (!dateRange.start || !dateRange.end) return false;
        try {
            const start = parseISO(dateRange.start);
            const end = parseISO(dateRange.end);
            if (!isValid(start) || !isValid(end)) return false;
            return differenceInMonths(end, start) >= 3;
        } catch { return false; }
    }, [dateRange.start, dateRange.end]);

    useEffect(() => {
        if (isDayDisabled && grain === 'day') setGrain('week');
    }, [isDayDisabled, grain]);


    const { data, isLoading } = usePreorderEvolution(grain);

    // Custom Configuration for Pre-orders
    const seriesConfig: SeriesConfig[] = [
        {
            key: 'achat_ht',
            name: 'Achat € (Commandé)',
            color: '#6366f1',
            type: 'area',
            yAxisId: 'left'
        },
        {
            key: 'achat_qty',
            name: 'Achat Qte (Commandé)',
            color: '#f59e0b', // Amber/Orange
            type: 'line',
            yAxisId: 'right'
        }
    ];

    return (
        <section className="mt-8 mb-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 flex items-center gap-2">
                        <PackageSearch className="w-6 h-6 text-indigo-500" />
                        Analyse des Précommandes
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Suivi mensuel des achats commandés (basé sur la date d&apos;envoi).
                    </p>
                </div>

                {/* Reuse controls, but maybe hide cumulative if not implemented in backend yet? 
                    Actually backend returns raw data, maybe cumulative needs frontend calc?
                    For now, let's keep it simple. */}
                {/* Manually simplified controls if needed, or reuse ChartControls */}
                <div className="flex gap-2">
                    {/* Reuse controls for Grain only? */}
                    <div className="flex bg-white/50 backdrop-blur-md rounded-lg p-1 border border-white/20 shadow-sm">
                        {(['day', 'week', 'month'] as Grain[]).map((g) => {
                            const label = { day: 'Jour', week: 'Semaine', month: 'Mois' }[g];
                            const isDisabled = g === 'day' && isDayDisabled;
                            return (
                                <button
                                    key={g}
                                    onClick={() => !isDisabled && setGrain(g)}
                                    disabled={isDisabled}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${grain === g
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : isDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="h-[400px] w-full bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-4 animate-pulse">
                    <div className="h-full w-full bg-slate-200/50 rounded-xl"></div>
                </div>
            ) : (
                <EvolutionChart
                    data={data || []}
                    seriesConfig={seriesConfig}
                    dataType={dataType}
                />
            )}
        </section>
    );
};
