import React from 'react';
import { LaboratoryAnalysisRow } from '@/types/kpi';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { ComparisonCell } from '@/components/molecules/Table/ComparisonCell';

interface LaboratoryTableRowProps {
    row: LaboratoryAnalysisRow;
}

import { useChartFilterInteraction } from '@/hooks/useChartFilterInteraction';

export const LaboratoryTableRow: React.FC<LaboratoryTableRowProps> = ({ row }) => {
    const { handleInteraction } = useChartFilterInteraction({
        filterType: 'laboratory'
    });

    const handleClick = (e: React.MouseEvent) => {
        handleInteraction({ name: row.laboratory_name, id: row.laboratory_name }, e);
    };

    return (
        <tr
            onClick={handleClick}
            className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
        >
            <TableCell isSticky>
                <span className="font-medium text-gray-900 text-xs truncate block max-w-[200px]" title={row.laboratory_name}>
                    {row.laboratory_name}
                </span>
            </TableCell>

            {/* Rank */}
            <TableCell align="center">
                <div className="flex flex-col items-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-bold ${row.my_rank <= 10 ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700 shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
                        #{row.my_rank}
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

            {/* Marge & PDM */}
            <TableCell variant="orange" className="border-l border-gray-100">
                <ComparisonCell
                    value={row.my_margin_rate}
                    evolution={row.my_margin_rate_evolution}
                    groupValue={row.group_avg_margin_rate}
                    groupEvolution={row.group_margin_rate_evolution}
                    suffix="%"
                />
            </TableCell>
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
