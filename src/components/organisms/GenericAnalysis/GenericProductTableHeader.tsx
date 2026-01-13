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
                <TableHeaderCell isSticky width="20%" {...getSortProps('product_name')}>Produit</TableHeaderCell>
                <TableHeaderCell width="6%" align="right" variant="pink" {...getSortProps('prix_brut')}>P.FAB</TableHeaderCell>
                <TableHeaderCell width="6%" align="right" variant="pink" {...getSortProps('avg_purchase_price')}>PA.HT MOY</TableHeaderCell>
                <TableHeaderCell width="6%" align="right" variant="pink" {...getSortProps('discount_pct')}>%REMISE</TableHeaderCell>
                <TableHeaderCell width="10%" align="right" variant="purple" {...getSortProps('my_purchases_ht')}>ACHAT HT</TableHeaderCell>
                <TableHeaderCell width="8%" align="right" variant="purple" {...getSortProps('my_purchases_qty')}>ACHAT QTE</TableHeaderCell>
                <TableHeaderCell width="10%" align="right" variant="blue" {...getSortProps('my_sales_ttc')}>VENTES TTC</TableHeaderCell>
                <TableHeaderCell width="8%" align="right" variant="blue" {...getSortProps('my_sales_qty')}>VENTES QTE</TableHeaderCell>
                <TableHeaderCell width="8%" align="right" variant="orange" {...getSortProps('my_margin_rate')}>%MARGE</TableHeaderCell>
            </tr>
        </thead>
    );
};
