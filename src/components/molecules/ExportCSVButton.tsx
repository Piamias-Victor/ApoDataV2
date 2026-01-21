import React from 'react';
import { Download } from 'lucide-react';

interface ExportCSVButtonProps {
    onClick: () => void;
    isLoading?: boolean;
    className?: string;
}

export const ExportCSVButton: React.FC<ExportCSVButtonProps> = ({ 
    onClick, 
    isLoading = false,
    className = ''
}) => {
    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={`
                relative group
                flex items-center gap-3 
                bg-white/60 backdrop-blur-md 
                pl-2 pr-4 py-1.5 
                rounded-2xl border border-white/50 
                shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] 
                hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] 
                hover:bg-white/80 
                transition-all duration-300 
                ring-1 ring-black/5 
                hover:ring-emerald-500/20
                disabled:opacity-50 disabled:cursor-not-allowed
                ${className}
            `}
            title="Exporter en CSV"
        >
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl shadow-inner border border-emerald-100/50 group-hover:scale-105 transition-transform duration-300">
                <Download size={16} className={`text-emerald-600 drop-shadow-sm ${isLoading ? 'animate-bounce' : ''}`} />
            </div>
            
            <div className="flex flex-col">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5 ml-0.5">
                    {isLoading ? 'En cours...' : 'Export'}
                </span>
                <span className="text-sm font-bold text-gray-700 leading-tight font-sans">
                    CSV
                </span>
            </div>
        </button>
    );
};
