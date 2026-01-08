
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';
import React from 'react';

interface Props {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSort: (column: string) => void;
}

export const GenericLaboratoryTableHeader: React.FC<Props> = ({ sortBy, sortOrder, onSort }) => {

    const getSortProps = (column: string) => ({
        isSortable: true,
        sortDirection: (sortBy === column ? sortOrder : null) || null,
        onSort: () => onSort(column)
    });

    return (
        <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm">
                <TableHeaderCell isSticky width="250px" {...getSortProps('laboratory_name')}>Laboratoire</TableHeaderCell>

                {/* Achats (Purple) */}
                <TableHeaderCell align="right" variant="purple" className="border-l border-gray-200" {...getSortProps('my_purchases_qty')}>
                    ACHAT QTE
                </TableHeaderCell>
                <TableHeaderCell align="right" variant="purple" {...getSortProps('my_purchases_ht')}>
                    CA Achat
                </TableHeaderCell>
                <TableHeaderCell align="right" variant="purple" {...getSortProps('my_pdm_purchases_pct')}>
                    PM Achat %
                </TableHeaderCell>

                {/* Marge (Green) */}
                <TableHeaderCell align="right" variant="green" className="border-l border-gray-200" {...getSortProps('my_margin_rate')}>
                    Taux Marge %
                </TableHeaderCell>

                {/* Ventes (Blue) */}
                <TableHeaderCell align="right" variant="blue" className="border-l border-gray-200" {...getSortProps('my_sales_qty')}>
                    VENTE QTE
                </TableHeaderCell>
                <TableHeaderCell align="right" variant="blue" {...getSortProps('my_sales_ttc')}>
                    CA Ventes
                </TableHeaderCell>
                <TableHeaderCell align="right" variant="blue" {...getSortProps('my_pdm_pct')}>
                    PM Ventes %
                </TableHeaderCell>
            </tr>
        </thead>
    );
};
