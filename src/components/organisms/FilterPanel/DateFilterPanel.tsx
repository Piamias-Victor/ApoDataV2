// src/components/organisms/FilterPanel/DateFilterPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { useFilterStore } from '@/stores/useFilterStore';
import { AnalysisSection } from './components/date/AnalysisSection';
import { ComparisonSection } from './components/date/ComparisonSection';
import { format, parseISO, subYears } from 'date-fns';

interface DateFilterPanelProps { onClose?: () => void; }
type PeriodPreset = 'current_month' | 'last_month' | 'current_year' | 'last_year' | 'custom';

export const DateFilterPanel: React.FC<DateFilterPanelProps> = ({ onClose }) => {
    const { dateRange, setDateRange, comparisonDateRange, setComparisonDateRange } = useFilterStore();

    const [start, setStart] = useState<string>(dateRange.start || '');
    const [end, setEnd] = useState<string>(dateRange.end || '');
    const [preset, setPreset] = useState<PeriodPreset>('custom');
    const [compStart, setCompStart] = useState<string>(comparisonDateRange.start || '');
    const [compEnd, setCompEnd] = useState<string>(comparisonDateRange.end || '');
    const [useNMinus1, setUseNMinus1] = useState(true);

    useEffect(() => {
        if (!start && !end) setPreset('current_year');
    }, [start, end]);

    useEffect(() => {
        if (useNMinus1 && start && end) {
            try {
                setCompStart(format(subYears(parseISO(start), 1), 'yyyy-MM-dd'));
                setCompEnd(format(subYears(parseISO(end), 1), 'yyyy-MM-dd'));
            } catch { }
        }
    }, [start, end, useNMinus1]);

    const handleApply = () => {
        setDateRange({ start, end });
        setComparisonDateRange({ start: compStart, end: compEnd });
        if (onClose) onClose();
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <div className="bg-white px-6 py-4 z-30 border-b border-gray-50 shadow-sm shrink-0">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Période & Comparaison
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                <AnalysisSection
                    start={start} end={end} preset={preset}
                    onDateChange={(s, e) => { setStart(s); setEnd(e); }}
                    onPresetChange={setPreset}
                />
                <div className="h-px bg-gray-100" />
                <ComparisonSection
                    start={compStart} end={compEnd}
                    useNMinus1={useNMinus1}
                    onToggleNMinus1={setUseNMinus1}
                    onDateChange={(s, e) => { setCompStart(s); setCompEnd(e); }}
                />
            </div>

            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] z-30 shrink-0">
                <Button
                    variant="primary" fullWidth size="lg" onClick={handleApply}
                    className="shadow-xl rounded-xl h-12 text-base font-bold !bg-none !bg-blue-600 hover:!bg-blue-700 shadow-blue-500/20"
                >
                    Appliquer la période
                </Button>
            </div>
        </div>
    );
};
