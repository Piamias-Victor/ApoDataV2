import React from 'react';

export const LaboratoryTableHeader: React.FC = () => {
    return (
        <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm">
                <th className="px-2 md:px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">Laboratoire</th>
                <th className="px-2 md:px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Rang</th>

                {/* Grouped Columns with Sub-headers */}
                <th className="px-2 md:px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-l border-gray-200 bg-blue-50/50">
                    Achat HT <span className="block text-[10px] text-gray-400 font-normal normal-case">Moi vs Groupe</span>
                </th>
                <th className="px-2 md:px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Achat Qté <span className="block text-[10px] text-gray-400 font-normal normal-case">Moi vs Groupe</span>
                </th>

                <th className="px-2 md:px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-l border-gray-200 bg-green-50/50">
                    Vente TTC <span className="block text-[10px] text-gray-400 font-normal normal-case">Moi vs Groupe</span>
                </th>
                <th className="px-2 md:px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Vente Qté <span className="block text-[10px] text-gray-400 font-normal normal-case">Moi vs Groupe</span>
                </th>

                <th className="px-2 md:px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-l border-gray-200 bg-orange-50/50">
                    Marge % <span className="block text-[10px] text-gray-400 font-normal normal-case">Moi vs Groupe</span>
                </th>
                <th className="px-2 md:px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Part de Marché <span className="block text-[10px] text-gray-400 font-normal normal-case">Moi vs Groupe</span>
                </th>
            </tr>
        </thead>
    );
};
