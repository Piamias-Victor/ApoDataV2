// src/components/organisms/FilterPanel/DateFilterPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ArrowRightLeft, CalendarDays, ChevronRight } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { useFilterStore } from '@/stores/useFilterStore';
import { motion } from 'framer-motion';
import {
    startOfYear, endOfYear, startOfMonth, endOfMonth,
    subMonths, subYears, format, parseISO
} from 'date-fns';

interface DateFilterPanelProps {
    onClose?: () => void;
}

type PeriodPreset = 'current_month' | 'last_month' | 'current_year' | 'last_year' | 'custom';

export const DateFilterPanel: React.FC<DateFilterPanelProps> = ({ onClose }) => {
    const { dateRange, setDateRange, comparisonDateRange, setComparisonDateRange } = useFilterStore();

    // Local State for Analysis
    const [start, setStart] = useState<string>(dateRange.start || '');
    const [end, setEnd] = useState<string>(dateRange.end || '');
    const [preset, setPreset] = useState<PeriodPreset>('custom');

    // Local State for Comparison
    const [compStart, setCompStart] = useState<string>(comparisonDateRange.start || '');
    const [compEnd, setCompEnd] = useState<string>(comparisonDateRange.end || '');
    const [useNMinus1, setUseNMinus1] = useState(true);

    // Initialize defaults if empty
    useEffect(() => {
        if (!start && !end) {
            handlePreset('current_year'); // Default to current year
        }
    }, []);

    // Effect: Update Comparison when Analysis changes if N-1 mode is active
    useEffect(() => {
        if (useNMinus1 && start && end) {
            try {
                const s = parseISO(start);
                const e = parseISO(end);
                setCompStart(format(subYears(s, 1), 'yyyy-MM-dd'));
                setCompEnd(format(subYears(e, 1), 'yyyy-MM-dd'));
            } catch (e) {
                // ignore invalid dates during typing
            }
        }
    }, [start, end, useNMinus1]);

    const handlePreset = (p: PeriodPreset) => {
        setPreset(p);
        const now = new Date();
        let s, e;

        switch (p) {
            case 'current_month':
                s = startOfMonth(now);
                e = endOfMonth(now);
                break;
            case 'last_month':
                s = startOfMonth(subMonths(now, 1));
                e = endOfMonth(subMonths(now, 1));
                break;
            case 'current_year':
                s = startOfYear(now);
                e = endOfYear(now);
                break;
            case 'last_year':
                s = startOfYear(subYears(now, 1));
                e = endOfYear(subYears(now, 1));
                break;
            default:
                return;
        }
        setStart(format(s, 'yyyy-MM-dd'));
        setEnd(format(e, 'yyyy-MM-dd'));
    };

    const handleApply = () => {
        setDateRange({ start, end });
        setComparisonDateRange({ start: compStart, end: compEnd });
        if (onClose) onClose();
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header */}
            <div className="bg-white px-6 py-4 z-30 border-b border-gray-50 shadow-sm shrink-0">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Période & Comparaison
                </h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                {/* SECTION: ANALYSIS */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> Période d'Analyse
                    </label>

                    {/* Presets Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'current_year', label: 'Année en cours', sub: 'Jan - Dec' },
                            { id: 'last_year', label: 'Année précédente', sub: 'N-1' },
                            { id: 'current_month', label: 'Mois en cours', sub: 'En temps réel' },
                            { id: 'last_month', label: 'Mois dernier', sub: 'Complet' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handlePreset(item.id as PeriodPreset)}
                                className={`
                                    p-4 rounded-xl text-left border transition-all flex flex-col gap-1 relative overflow-hidden group
                                    ${preset === item.id
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-white border-gray-100 text-gray-700 hover:border-blue-200 hover:bg-blue-50/50'
                                    }
                                `}
                            >
                                <span className={`text-xs font-semibold uppercase tracking-wider ${preset === item.id ? 'text-blue-200' : 'text-gray-400'}`}>{item.sub}</span>
                                <span className="font-bold text-sm">{item.label}</span>
                                {preset === item.id && <CalendarDays className="absolute bottom-2 right-2 w-12 h-12 text-blue-500/20 rotate-[-15deg] translate-y-2 translate-x-2" />}
                            </button>
                        ))}
                    </div>

                    {/* Custom Date Inputs */}
                    <div className="flex items-center justify-between pt-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            Ou dates manuelles
                        </label>
                        {preset !== 'custom' && (
                            <button onClick={() => setPreset('custom')} className="text-xs font-semibold text-blue-600 hover:underline">Modifier</button>
                        )}
                    </div>

                    <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                        <div className="group relative bg-white hover:bg-white focus-within:bg-white border border-gray-200 focus-within:!border-blue-500 rounded-xl transition-all overflow-hidden shadow-sm">
                            <div className="absolute top-2 left-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider pointer-events-none">Du</div>
                            <input
                                type="date"
                                value={start}
                                onChange={(e) => { setStart(e.target.value); setPreset('custom'); }}
                                className="w-full pt-6 pb-2 px-3 bg-transparent border-none text-sm font-bold text-gray-900 outline-none h-14"
                            />
                        </div>

                        <ChevronRight className="w-4 h-4 text-gray-300" />

                        <div className="group relative bg-white hover:bg-white focus-within:bg-white border border-gray-200 focus-within:!border-blue-500 rounded-xl transition-all overflow-hidden shadow-sm">
                            <div className="absolute top-2 left-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider pointer-events-none">Au</div>
                            <input
                                type="date"
                                value={end}
                                onChange={(e) => { setEnd(e.target.value); setPreset('custom'); }}
                                className="w-full pt-6 pb-2 px-3 bg-transparent border-none text-sm font-bold text-gray-900 outline-none h-14"
                            />
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-100" />

                {/* SECTION: COMPARISON */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Comparaison
                    </label>

                    {/* N-1 Toggle Card */}
                    <div
                        onClick={() => setUseNMinus1(!useNMinus1)}
                        className={`
                            relative p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group overflow-hidden
                            ${useNMinus1
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/20'
                                : 'bg-white border-gray-100 hover:border-gray-200 text-gray-600'
                            }
                        `}
                    >
                        <div className="relative z-10 flex items-center gap-4">
                            <div className={`
                                w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                                ${useNMinus1 ? 'border-white bg-indigo-500' : 'border-gray-300 bg-transparent'}
                            `}>
                                {useNMinus1 && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                            </div>
                            <div>
                                <h4 className={`font-bold text-sm ${useNMinus1 ? 'text-white' : 'text-gray-900'}`}>Comparaison Automatique (N-1)</h4>
                                <p className={`text-xs mt-1 ${useNMinus1 ? 'text-indigo-200' : 'text-gray-500'}`}>
                                    Compare avec la même période l'année précédente
                                </p>
                            </div>
                        </div>
                        {/* Decorative Icon */}
                        <ArrowRightLeft className={`absolute right-[-10px] bottom-[-10px] w-20 h-20 rotate-[-10deg] transition-all opacity-10 ${useNMinus1 ? 'text-white' : 'text-gray-900'}`} />
                    </div>

                    {/* Custom Comparison Inputs */}
                    <motion.div
                        initial={false}
                        animate={{ opacity: useNMinus1 ? 0.4 : 1, pointerEvents: useNMinus1 ? 'none' : 'auto', filter: useNMinus1 ? 'blur(1px)' : 'blur(0px)' }}
                        className="space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                Ou dates manuelles
                            </label>
                        </div>

                        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                            <div className="group relative bg-white border border-gray-200 focus-within:!border-indigo-500 rounded-xl transition-all overflow-hidden shadow-sm">
                                <div className="absolute top-2 left-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider pointer-events-none">Du</div>
                                <input
                                    type="date"
                                    value={compStart}
                                    onChange={(e) => setCompStart(e.target.value)}
                                    className="w-full pt-6 pb-2 px-3 bg-transparent border-none text-sm font-bold text-gray-900 outline-none h-14"
                                />
                            </div>

                            <ChevronRight className="w-4 h-4 text-gray-300" />

                            <div className="group relative bg-white border border-gray-200 focus-within:!border-indigo-500 rounded-xl transition-all overflow-hidden shadow-sm">
                                <div className="absolute top-2 left-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider pointer-events-none">Au</div>
                                <input
                                    type="date"
                                    value={compEnd}
                                    onChange={(e) => setCompEnd(e.target.value)}
                                    className="w-full pt-6 pb-2 px-3 bg-transparent border-none text-sm font-bold text-gray-900 outline-none h-14"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] z-30 shrink-0">
                <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={handleApply}
                    className="shadow-xl rounded-xl h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                >
                    Appliquer la période
                </Button>
            </div>
        </div>
    );
};
