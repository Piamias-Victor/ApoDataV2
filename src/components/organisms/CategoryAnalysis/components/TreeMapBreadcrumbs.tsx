import React from 'react';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';

interface TreeMapBreadcrumbsProps {
    path: string[];
    showOthers: boolean;
    onBreadcrumbClick: (index: number) => void;
    onCloseOthers: () => void;
}

export const TreeMapBreadcrumbs: React.FC<TreeMapBreadcrumbsProps> = ({
    path,
    showOthers,
    onBreadcrumbClick,
    onCloseOthers
}) => {
    return (
        <div className="relative z-10 flex items-center gap-2 mb-6 text-sm overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
            <button
                onClick={() => onBreadcrumbClick(-1)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${path.length === 0 && !showOthers ? 'bg-indigo-100 text-indigo-700 font-semibold shadow-sm' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
            >
                <Home className="w-3.5 h-3.5" />
                Global
            </button>

            {path.map((segment, idx) => (
                <React.Fragment key={idx}>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    <button
                        onClick={() => onBreadcrumbClick(idx)}
                        className={`px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap ${(idx === path.length - 1) && !showOthers ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm border border-indigo-100' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
                    >
                        {segment}
                    </button>
                </React.Fragment>
            ))}

            {showOthers && (
                <>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200 flex items-center gap-1">
                        Autres Catégories
                        <button onClick={onCloseOthers} className="ml-1 hover:text-red-500">
                            <ArrowLeft className="w-3 h-3" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
