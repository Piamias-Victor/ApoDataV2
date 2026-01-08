import React from 'react';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';

interface TableHeaderProps {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSort?: (column: string) => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ sortBy, sortOrder, onSort }) => {

    const getSortProps = (column: string) => ({
        isSortable: true,
        sortDirection: (sortBy === column ? sortOrder : null) || null,
        onSort: () => onSort?.(column)
    });

    return (
        <thead className="bg-gray-50/80 backdrop-blur sticky top-0 z-10 border-b border-gray-100">
            <tr>
                <TableHeaderCell isSticky width="18%" {...getSortProps('product_name')}>Produit</TableHeaderCell>
                <TableHeaderCell width="4%" align="center" {...getSortProps('my_rank')}>Rang</TableHeaderCell>

                {/* Achats - Purple */}
                <TableHeaderCell align="right" variant="purple" width="6%" {...getSortProps('my_purchases_ht')}>Achat HT</TableHeaderCell>
                <TableHeaderCell align="right" variant="purple" width="5%" {...getSortProps('my_purchases_qty')}>Achat Qte</TableHeaderCell>
                <TableHeaderCell align="right" variant="green" width="5%" {...getSortProps('my_pdm_purchases_pct')}>PDM Achat</TableHeaderCell>

                {/* Ventes - Blue */}
                <TableHeaderCell align="right" variant="blue" width="6%" {...getSortProps('my_sales_ttc')}>Vente TTC</TableHeaderCell>
                <TableHeaderCell align="right" variant="blue" width="5%" {...getSortProps('my_sales_qty')}>Vente Qte</TableHeaderCell>
                <TableHeaderCell align="right" variant="green" width="5%" {...getSortProps('my_pdm_pct')}>PDM Vente</TableHeaderCell>

                {/* Marges - Orange */}
                <TableHeaderCell align="right" variant="orange" width="6%" {...getSortProps('my_margin_ht')}>Marge €</TableHeaderCell>
                <TableHeaderCell align="right" variant="orange" width="5%" {...getSortProps('my_margin_rate')}>Marge %</TableHeaderCell>

                {/* Prix - Pink */}
                <TableHeaderCell align="right" variant="pink" width="6%" {...getSortProps('avg_purchase_price')}>PA.HT Moy</TableHeaderCell>
                <TableHeaderCell align="right" variant="pink" width="6%" {...getSortProps('avg_sell_price')}>PV.TTC Moy</TableHeaderCell>

                {/* Stock - Red */}
                <TableHeaderCell align="right" variant="red" width="6%" {...getSortProps('my_stock_value_ht')}>Stock €</TableHeaderCell>
                <TableHeaderCell align="right" variant="red" width="5%" {...getSortProps('my_stock_qty')}>Stock Qte</TableHeaderCell>
                <TableHeaderCell align="right" variant="red" width="4%" {...getSortProps('my_days_of_stock')}>J.Stock</TableHeaderCell>
            </tr>
        </thead>
    );
};
