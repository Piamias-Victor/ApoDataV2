import React from 'react';
import { ArrowRightLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ComparisonSectionProps {
    start: string;
    end: string;
    useNMinus1: boolean;
    onToggleNMinus1: (val: boolean) => void;
    onDateChange: (start: string, end: string) => void;
}

export const ComparisonSection: React.FC<ComparisonSectionProps> = ({
    start, end, useNMinus1, onToggleNMinus1, onDateChange
}) => {
    return (
        <div className="space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <ArrowRightLeft className="w-3.5 h-3.5" /> Comparaison
            </label>

            <div
                onClick={() => onToggleNMinus1(!useNMinus1)}
                className={`
                    relative p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group overflow-hidden
                    ${useNMinus1
                        ? '!bg-none !bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/20'
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
                            Compare avec la même période l&apos;année précédente
                        </p>
                    </div>
                </div>
                <ArrowRightLeft className={`absolute right-[-10px] bottom-[-10px] w-20 h-20 rotate-[-10deg] transition-all opacity-10 ${useNMinus1 ? 'text-white' : 'text-gray-900'}`} />
            </div>

            <motion.div
                initial={false}
                animate={{ opacity: useNMinus1 ? 0.4 : 1, pointerEvents: useNMinus1 ? 'none' : 'auto', filter: useNMinus1 ? 'blur(1px)' : 'blur(0px)' }}
                className="space-y-3"
            >
                <p className="text-xs text-gray-500 mb-3 ml-1">
                    Choisissez la période de référence pour calculer les évolutions (N-1, M-1, ou personnalisé)
                </p>
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
                            value={start}
                            onChange={(e) => onDateChange(e.target.value, end)}
                            className="w-full pt-6 pb-2 px-3 bg-transparent border-none text-sm font-bold text-gray-900 outline-none h-14"
                        />
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                    <div className="group relative bg-white border border-gray-200 focus-within:!border-indigo-500 rounded-xl transition-all overflow-hidden shadow-sm">
                        <div className="absolute top-2 left-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider pointer-events-none">Au</div>
                        <input
                            type="date"
                            value={end}
                            onChange={(e) => onDateChange(start, e.target.value)}
                            className="w-full pt-6 pb-2 px-3 bg-transparent border-none text-sm font-bold text-gray-900 outline-none h-14"
                        />
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
