import React from 'react';
import { ProductAnalysisRow } from '@/types/kpi';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { ComparisonCell } from '@/components/molecules/Table/ComparisonCell';
import { useChartFilterInteraction } from '@/hooks/useChartFilterInteraction';

interface ProductTableRowProps {
    row: ProductAnalysisRow;
    customRank?: number | undefined; 
}

export const ProductTableRow: React.FC<ProductTableRowProps> = ({ row, customRank }) => {
    const { handleInteraction } = useChartFilterInteraction({
        filterType: 'product'
    });

    const handleClick = (e: React.MouseEvent) => {
        handleInteraction({ id: row.ean13, name: row.product_name }, e);
    };

    const displayRank = customRank ?? row.my_rank;

    return (
        <tr
            onClick={handleClick}
            className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
        >
            <TableCell isSticky>
                <div className="flex flex-col">
                    <span className="truncate w-full max-w-[200px] text-xs font-medium text-gray-900" title={row.product_name}>{row.product_name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400">{row.ean13}</span>
                        <span className="text-[10px] text-blue-600 truncate max-w-[150px]">{row.laboratory_name}</span>
                    </div>
                </div>
            </TableCell>

            {/* Rank */}
            <TableCell align="center">
                <div className="flex flex-col items-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-bold ${displayRank <= 10 ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700 shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
                        #{displayRank}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">Grp: #{row.group_rank}</span>
                </div>
            </TableCell>

            {/* Achat HT */}
            <TableCell variant="purple" className="border-l border-gray-100">
                <ComparisonCell
                    value={row.my_purchases_ht}
                    evolution={row.my_purchases_evolution}
                    groupValue={row.group_avg_purchases_ht}
                    groupEvolution={row.group_purchases_evolution}
                    isCurrency
                />
            </TableCell>
            <TableCell variant="purple">
                <ComparisonCell
                    value={row.my_purchases_qty}
                    evolution={row.my_purchases_qty_evolution}
                    groupValue={row.group_avg_purchases_qty}
                    groupEvolution={row.group_purchases_qty_evolution}
                />
            </TableCell>

            {/* Vente TTC */}
            <TableCell variant="blue" className="border-l border-gray-100">
                <ComparisonCell
                    value={row.my_sales_ttc}
                    evolution={row.my_sales_evolution}
                    groupValue={row.group_avg_sales_ttc}
                    groupEvolution={row.group_sales_evolution}
                    isCurrency
                />
            </TableCell>
            <TableCell variant="blue">
                <ComparisonCell
                    value={row.my_sales_qty}
                    evolution={row.my_sales_qty_evolution}
                    groupValue={row.group_avg_sales_qty}
                    groupEvolution={row.group_sales_qty_evolution}
                />
            </TableCell>

            {/* Marge % */}
            <TableCell variant="orange" className="border-l border-gray-100">
                <ComparisonCell
                    value={row.my_margin_rate}
                    evolution={row.my_margin_rate_evolution}
                    groupValue={row.group_avg_margin_rate}
                    groupEvolution={row.group_margin_rate_evolution}
                    suffix="%"
                />
            </TableCell>

            {/* PDM */}
            <TableCell variant="green">
                <ComparisonCell
                    value={row.my_pdm_pct}
                    evolution={row.my_pdm_evolution}
                    groupValue={row.group_pdm_pct}
                    groupEvolution={row.group_pdm_evolution}
                    suffix="%"
                />
            </TableCell>
        </tr>
    );
};
