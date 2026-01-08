import React from 'react';
import { Trophy, ChevronDown } from 'lucide-react';

interface RankSelectorProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}

export const RankSelector: React.FC<RankSelectorProps> = ({ value, onChange, options }) => {
    return (
        <div className="relative group z-20">
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md pl-2 pr-4 py-1.5 rounded-2xl border border-white/50 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] hover:bg-white/80 transition-all duration-300 ring-1 ring-black/5 group-hover:ring-purple-500/20">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl shadow-inner border border-amber-100/50 group-hover:scale-105 transition-transform duration-300">
                    <Trophy className="w-4 h-4 text-amber-600 drop-shadow-sm" />
                </div>
                
                <div className="flex flex-col relative">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5 ml-0.5">Rang selon</span>
                    <div className="relative flex items-center min-w-[100px]">
                        <select
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="appearance-none bg-transparent border-none p-0 pr-5 text-sm font-bold text-gray-700 outline-none focus:ring-0 cursor-pointer w-full leading-tight truncate font-sans"
                        >
                            {options.map(opt => (
                                <option key={opt.value} value={opt.value} className="bg-white text-gray-700 py-1">
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-0 pointer-events-none group-hover:text-purple-500 transition-colors" />
                    </div>
                </div>
            </div>
        </div>
    );
};
