
import React from 'react';
import { GenericLaboratoryRow } from '@/types/kpi';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { ValueCell } from '@/components/molecules/Table/ValueCell';

import { useChartFilterInteraction } from '@/hooks/useChartFilterInteraction';

interface Props {
    row: GenericLaboratoryRow;
}

export const GenericLaboratoryTableRow: React.FC<Props> = ({ row }) => {
    const { handleInteraction } = useChartFilterInteraction({
        filterType: 'laboratory'
    });

    const handleClick = (e: React.MouseEvent) => {
        handleInteraction({ name: row.laboratory_name, id: row.laboratory_name }, e);
    };

    return (
        <tr
            className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
            onClick={handleClick}
        >
            <TableCell>
                <div className="flex items-center">
                    <span className="font-medium text-gray-900">{row.laboratory_name}</span>
                </div>
            </TableCell>

            <TableCell align="center">
                <ValueCell
                    value={row.product_count}
                    evolution={row.product_count_evolution}
                    decimals={0}
                />
            </TableCell>

            {/* Achats (Purple) */}
            <TableCell align="right" variant="purple" className="border-l border-gray-100">
                <ValueCell
                    value={row.my_purchases_qty}
                    evolution={row.my_purchases_qty_evolution}
                />
            </TableCell>
            <TableCell align="right" variant="purple">
                <ValueCell
                    value={row.my_purchases_ht}
                    evolution={row.my_purchases_evolution}
                    isCurrency
                />
            </TableCell>
            <TableCell align="right" variant="purple">
                <ValueCell
                    value={row.my_pdm_purchases_pct}
                    evolution={row.my_pdm_purchases_evolution}
                    suffix="%"
                    decimals={2}
                />
            </TableCell>

            {/* Marge (Green) */}
            <TableCell align="right" variant="green" className="border-l border-gray-100">
                <ValueCell
                    value={row.my_margin_rate}
                    evolution={row.my_margin_rate_evolution}
                    suffix="%"
                    decimals={2}
                />
            </TableCell>

            {/* Ventes (Blue) */}
            <TableCell align="right" variant="blue" className="border-l border-gray-100">
                <ValueCell
                    value={row.my_sales_qty}
                    evolution={row.my_sales_qty_evolution}
                />
            </TableCell>
            <TableCell align="right" variant="blue">
                <ValueCell
                    value={row.my_sales_ttc}
                    evolution={row.my_sales_evolution}
                    isCurrency
                />
            </TableCell>
            <TableCell align="right" variant="blue">
                <ValueCell
                    value={row.my_pdm_pct}
                    evolution={row.my_pdm_evolution}
                    suffix="%"
                    decimals={2}
                />
            </TableCell>
        </tr>
    );
};
