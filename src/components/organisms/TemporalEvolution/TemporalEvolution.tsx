'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useEvolutionData, DataType } from './hooks/useEvolutionData';
import { Grain } from '@/types/kpi';
import { ChartControls } from './components/ChartControls';
import { EvolutionChart } from './components/EvolutionChart';
import { TrendingUp } from 'lucide-react';
import { useFilterStore } from '@/stores/useFilterStore';
import { differenceInMonths, parseISO, isValid } from 'date-fns';

export const TemporalEvolution: React.FC = () => {
    const { dateRange } = useFilterStore();
    const [grain, setGrain] = useState<Grain>('day');
    const [dataType, setDataType] = useState<DataType>('value');

    const { data, isLoading } = useEvolutionData(grain);

    // Calculate duration in months to disable 'day' view for long periods
    const isDayDisabled = useMemo(() => {
        if (!dateRange.start || !dateRange.end) return false;
        try {
            const start = parseISO(dateRange.start);
            const end = parseISO(dateRange.end);
            if (!isValid(start) || !isValid(end)) return false;

            return differenceInMonths(end, start) >= 3;
        } catch {
            return false;
        }
    }, [dateRange.start, dateRange.end]);

    // Automatically switch to 'week' if 'day' is disabled
    useEffect(() => {
        if (isDayDisabled && grain === 'day') {
            setGrain('week');
        }
    }, [isDayDisabled, grain]);

    return (
        <section className="mt-8 mb-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-indigo-500" />
                        Évolution Temporelle
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Analysez l&apos;évolution de vos indicateurs clés (Achats, Ventes, Stocks) sur différentes périodes.
                    </p>
                </div>

                <ChartControls
                    grain={grain}
                    setGrain={setGrain}
                    dataType={dataType}
                    setDataType={setDataType}
                    isDayDisabled={isDayDisabled}
                />
            </div>

            {isLoading ? (
                <div className="h-[400px] w-full bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-4 animate-pulse">
                    <div className="h-full w-full bg-slate-200/50 rounded-xl"></div>
                </div>
            ) : (
                <EvolutionChart data={data} dataType={dataType} />
            )}
        </section>
    );
};
