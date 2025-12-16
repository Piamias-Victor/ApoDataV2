'use client';

import React, { useMemo } from 'react';
import { usePriceEvolution } from '@/hooks/kpi/usePriceEvolution';
import { EvolutionChart, SeriesConfig } from '@/components/organisms/TemporalEvolution/components/EvolutionChart';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrendingUp } from 'lucide-react';

export const PriceEvolutionSection: React.FC = () => {
    const { data: rawData, isLoading } = usePriceEvolution();

    const data = useMemo(() => {
        if (!rawData) return [];
        return rawData.map(item => ({
            ...item,
            displayDate: format(parseISO(item.date), 'MMMM yyyy', { locale: fr }),
            // Re-mapping for chart keys to match friendly names or just use raw keys
            date: format(parseISO(item.date), 'MMM yy', { locale: fr }),
            originalDate: item.date
        }));
    }, [rawData]);

    const seriesConfig: SeriesConfig[] = [
        { key: 'avg_purchase_price', name: 'Prix Achat HT', color: '#6366f1', type: 'line', yAxisId: 'left' },
        { key: 'avg_sell_price', name: 'Prix Vente TTC', color: '#10b981', type: 'line', yAxisId: 'left' },
        { key: 'margin_eur', name: 'Marge €', color: '#ec4899', type: 'area', yAxisId: 'amount' },
        { key: 'margin_rate', name: 'Marge %', color: '#f59e0b', type: 'line', yAxisId: 'right' },
        { key: 'purchases_qty', name: 'Qté Achat', color: '#818cf8', type: 'bar', yAxisId: 'volume' },
        { key: 'sales_qty', name: 'Qté Vente', color: '#34d399', type: 'bar', yAxisId: 'volume' },
    ];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <div className="h-8 w-64 bg-slate-200/50 rounded animate-pulse" />
                    <div className="h-4 w-96 bg-slate-200/50 rounded animate-pulse" />
                </div>
                <div className="h-[400px] w-full bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-indigo-500" />
                    Évolution Mensuelle
                </h2>
                <p className="text-slate-500 mt-1">
                    Analysez l&apos;évolution des prix et de la marge en pourcentage.
                </p>
            </div>

            <EvolutionChart data={data} seriesConfig={seriesConfig} />
        </div>
    );
};
