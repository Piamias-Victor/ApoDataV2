import React from 'react';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';

interface TableHeaderProps {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSort?: (column: string) => void;
}

export const GenericProductTableHeader: React.FC<TableHeaderProps> = ({ sortBy, sortOrder, onSort }) => {

    const getSortProps = (column: string) => ({
        isSortable: true,
        sortDirection: (sortBy === column ? sortOrder : null) || null,
        onSort: () => onSort?.(column)
    });

    return (
        <thead className="bg-gray-50/80 backdrop-blur sticky top-0 z-10 border-b border-gray-100">
            <tr>
                <TableHeaderCell width="20%" {...getSortProps('product_name')}>Produit</TableHeaderCell>
                <TableHeaderCell width="6%" align="right" variant="pink">P.Brut</TableHeaderCell>
                <TableHeaderCell width="6%" align="right" variant="pink">P.Achat</TableHeaderCell>
                <TableHeaderCell width="6%" align="right" variant="pink">%Remise</TableHeaderCell>
                <TableHeaderCell width="8%" align="right" variant="purple" {...getSortProps('my_purchases_qty')}>Vol.Achat</TableHeaderCell>
                <TableHeaderCell width="10%" align="right" variant="purple" {...getSortProps('my_purchases_ht')}>CA.Achat</TableHeaderCell>
                <TableHeaderCell width="8%" align="right" variant="blue" {...getSortProps('my_sales_qty')}>Vol.Vente</TableHeaderCell>
                <TableHeaderCell width="10%" align="right" variant="blue" {...getSortProps('my_sales_ttc')}>CA.Vente</TableHeaderCell>
                <TableHeaderCell width="8%" align="right" variant="orange" {...getSortProps('my_margin_rate')}>%Marge</TableHeaderCell>
            </tr>
        </thead>
    );
};
