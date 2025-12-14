import React from 'react';
import { ValueCell } from '@/components/molecules/Table/ValueCell';
import { ProductAnalysisRow } from '@/types/kpi';

interface ProductTableRowProps {
    row: ProductAnalysisRow;
}

export const ProductTableRow: React.FC<ProductTableRowProps> = ({ row }) => {
    return (
        <tr className="hover:bg-blue-50/30 transition-colors">
            <td className="px-2 md:px-4 py-3 font-medium text-gray-900">
                <div className="flex flex-col">
                    <span className="truncate w-full max-w-[200px]" title={row.product_name}>{row.product_name}</span>
                    <span className="text-[10px] text-gray-400">{row.ean13}</span>
                </div>
            </td>

            <td className="px-2 md:px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                <span className="truncate block max-w-[120px]" title={row.laboratory_name}>{row.laboratory_name}</span>
            </td>

            {/* Rank */}
            <td className="px-2 md:px-4 py-3 text-center">
                <div className="flex flex-col items-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${row.my_rank <= 10 ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700 shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
                        #{row.my_rank}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">Grp: #{row.group_rank}</span>
                </div>
            </td>

            {/* Achat HT */}
            <td className="px-2 md:px-4 py-3 border-l border-gray-100 bg-blue-50/10">
                <div className="grid grid-cols-2 gap-4 min-w-[140px]">
                    <ValueCell value={row.my_purchases_ht} evolution={row.my_purchases_evolution} isCurrency />
                    <div className="opacity-60 grayscale scale-95 origin-top-left">
                        <ValueCell value={row.group_avg_purchases_ht} evolution={row.group_purchases_evolution} isCurrency />
                    </div>
                </div>
            </td>
            <td className="px-2 md:px-4 py-3">
                <div className="grid grid-cols-2 gap-4 min-w-[100px]">
                    <ValueCell value={row.my_purchases_qty} evolution={row.my_purchases_qty_evolution} />
                    <div className="opacity-60 grayscale scale-95 origin-top-left">
                        <ValueCell value={row.group_avg_purchases_qty} evolution={row.group_purchases_qty_evolution} />
                    </div>
                </div>
            </td>

            {/* Vente TTC */}
            <td className="px-2 md:px-4 py-3 border-l border-gray-100 bg-green-50/10">
                <div className="grid grid-cols-2 gap-4 min-w-[140px]">
                    <ValueCell value={row.my_sales_ttc} evolution={row.my_sales_evolution} isCurrency />
                    <div className="opacity-60 grayscale scale-95 origin-top-left">
                        <ValueCell value={row.group_avg_sales_ttc} evolution={row.group_sales_evolution} isCurrency />
                    </div>
                </div>
            </td>
            <td className="px-2 md:px-4 py-3">
                <div className="grid grid-cols-2 gap-4 min-w-[100px]">
                    <ValueCell value={row.my_sales_qty} evolution={row.my_sales_qty_evolution} />
                    <div className="opacity-60 grayscale scale-95 origin-top-left">
                        <ValueCell value={row.group_avg_sales_qty} evolution={row.group_sales_qty_evolution} />
                    </div>
                </div>
            </td>
        </tr>
    );
};
