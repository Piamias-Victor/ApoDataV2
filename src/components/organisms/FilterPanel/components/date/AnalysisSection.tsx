import React from 'react';
import { Calendar, CalendarDays, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';

type PeriodPreset = 'current_month' | 'last_month' | 'current_year' | 'last_year' | 'custom';

interface AnalysisSectionProps {
    start: string;
    end: string;
    preset: PeriodPreset;
    onDateChange: (start: string, end: string) => void;
    onPresetChange: (preset: PeriodPreset) => void;
}

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({
    start, end, preset, onDateChange, onPresetChange
}) => {
    const handlePreset = (p: PeriodPreset) => {
        onPresetChange(p);
        const now = new Date();
        let s, e;

        switch (p) {
            case 'current_month': s = startOfMonth(now); e = endOfMonth(now); break;
            case 'last_month': s = startOfMonth(subMonths(now, 1)); e = endOfMonth(subMonths(now, 1)); break;
            case 'current_year': s = startOfYear(now); e = endOfYear(now); break;
            case 'last_year': s = startOfYear(subYears(now, 1)); e = endOfYear(subYears(now, 1)); break;
            default: return;
        }
        onDateChange(format(s, 'yyyy-MM-dd'), format(e, 'yyyy-MM-dd'));
    };

    return (
        <div className="space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Période d&apos;Analyse
            </label>

            <p className="text-xs text-gray-500 mb-3 ml-1">
                Choisissez la période sur laquelle porte l&apos;analyse principale
            </p>

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
                                ? '!bg-none !bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
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

            <div className="flex items-center justify-between pt-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    Ou dates manuelles
                </label>
                {preset !== 'custom' && (
                    <button onClick={() => onPresetChange('custom')} className="text-xs font-semibold text-blue-600 hover:underline">Modifier</button>
                )}
            </div>

            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                <div className="group relative bg-white hover:bg-white focus-within:bg-white border border-gray-200 focus-within:!border-blue-500 rounded-xl transition-all overflow-hidden shadow-sm">
                    <div className="absolute top-2 left-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider pointer-events-none">Du</div>
                    <input
                        type="date"
                        value={start}
                        onChange={(e) => { onDateChange(e.target.value, end); onPresetChange('custom'); }}
                        className="w-full pt-6 pb-2 px-3 bg-transparent border-none text-sm font-bold text-gray-900 outline-none h-14"
                    />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <div className="group relative bg-white hover:bg-white focus-within:bg-white border border-gray-200 focus-within:!border-blue-500 rounded-xl transition-all overflow-hidden shadow-sm">
                    <div className="absolute top-2 left-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider pointer-events-none">Au</div>
                    <input
                        type="date"
                        value={end}
                        onChange={(e) => { onDateChange(start, e.target.value); onPresetChange('custom'); }}
                        className="w-full pt-6 pb-2 px-3 bg-transparent border-none text-sm font-bold text-gray-900 outline-none h-14"
                    />
                </div>
            </div>
        </div>
    );
};
