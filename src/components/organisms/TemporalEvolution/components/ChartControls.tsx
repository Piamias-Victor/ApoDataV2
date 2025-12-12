import React from 'react';
import { DataType } from '../hooks/useEvolutionData';
import { Grain } from '@/types/kpi';
import { BarChart2, TrendingUp } from 'lucide-react';

interface ChartControlsProps {
    grain: Grain;
    setGrain: (g: Grain) => void;
    dataType: DataType;
    setDataType: (d: DataType) => void;
    isDayDisabled?: boolean;
}

export const ChartControls: React.FC<ChartControlsProps> = ({ grain, setGrain, dataType, setDataType, isDayDisabled }) => {
    const grains: { id: Grain; label: string }[] = [
        { id: 'day', label: 'Jour' },
        { id: 'week', label: 'Semaine' },
        { id: 'month', label: 'Mois' }
    ];

    return (
        <div className="flex flex-wrap items-center gap-4 mb-6">
            {/* Grain Selector */}
            <div className="flex bg-white/50 backdrop-blur-md rounded-lg p-1 border border-white/20 shadow-sm">
                {grains.map((g) => {
                    const isDisabled = g.id === 'day' && isDayDisabled;
                    return (
                        <button
                            key={g.id}
                            onClick={() => !isDisabled && setGrain(g.id)}
                            disabled={isDisabled}
                            title={isDisabled ? "L'affichage journalier est désactivé pour les périodes de plus de 3 mois afin de garantir la lisibilité et les performances." : ""}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${grain === g.id
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : isDisabled
                                    ? 'text-gray-300 cursor-not-allowed decoration-slice'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {g.label}
                        </button>
                    );
                })}
            </div>

            {/* Data Type Selector */}
            <div className="flex bg-white/50 backdrop-blur-md rounded-lg p-1 border border-white/20 shadow-sm">
                <button
                    onClick={() => setDataType('value')}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${dataType === 'value'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <BarChart2 className="w-4 h-4" />
                    Valeur
                </button>
                <button
                    onClick={() => setDataType('cumulative')}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${dataType === 'cumulative'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <TrendingUp className="w-4 h-4" />
                    Cumul
                </button>
            </div>
        </div>
    );
};
