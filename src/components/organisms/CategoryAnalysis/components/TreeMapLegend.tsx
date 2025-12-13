import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { getCategoryColor } from './TreeMapNode'; // Import shared util from Node (or separate file)
import { TreeMapNode } from '../hooks/useCategoryTree';

interface TreeMapLegendProps {
    data: TreeMapNode[];
    hiddenSeries: string[];
    onToggleSeries: (name: string) => void;
}

export const TreeMapLegend: React.FC<TreeMapLegendProps> = ({ data, hiddenSeries, onToggleSeries }) => {
    return (
        <div className="relative z-10 mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Légende & Filtrage</h3>
            <div className="flex flex-wrap gap-3">
                {data.map((item, idx) => {
                    const isHidden = hiddenSeries.includes(item.name);
                    const isOther = item.name.startsWith('Autres');
                    const colorIndex = (item.rank ? item.rank - 1 : idx);
                    const color = getCategoryColor(colorIndex, isOther);

                    return (
                        <button
                            key={item.name}
                            onClick={() => onToggleSeries(item.name)}
                            className={`
                                group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200
                                ${isHidden
                                    ? 'bg-slate-50 text-slate-400 border-slate-200 opacity-70'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-sm'
                                }
                            `}
                        >
                            <div
                                className={`w-2.5 h-2.5 rounded-full transition-colors ${isHidden ? 'bg-slate-300' : ''}`}
                                style={{ backgroundColor: isHidden ? undefined : color }}
                            />
                            <span className="max-w-[120px] truncate">{item.name}</span>
                            <span className="text-slate-400 border-l border-slate-100 pl-2 ml-1">
                                {Number(item.percentage).toFixed(1)}%
                            </span>
                            {isHidden ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-slate-300 group-hover:text-indigo-400" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
