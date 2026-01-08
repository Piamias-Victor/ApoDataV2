import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';
import React from 'react';

interface ProductTableHeaderProps {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSort?: (column: string) => void;
}

export const ProductTableHeader: React.FC<ProductTableHeaderProps> = ({ sortBy, sortOrder, onSort }) => {

    // Helper to keep JSX clean
    const getSortProps = (column: string) => ({
        isSortable: true,
        sortDirection: (sortBy === column ? sortOrder : null) || null,
        onSort: () => onSort?.(column)
    });

    return (
        <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm">
                <TableHeaderCell isSticky width="12rem" {...getSortProps('product_name')}>Produit</TableHeaderCell>
                <TableHeaderCell align="center" {...getSortProps('my_rank')}>Rang</TableHeaderCell>

                {/* Grouped Columns */}
                <TableHeaderCell align="left" variant="purple" className="border-l border-gray-200" {...getSortProps('my_purchases_ht')}>
                    Achat HT <span className="block text-[9px] opacity-70 font-normal normal-case">Moi vs Groupe</span>
                </TableHeaderCell>
                <TableHeaderCell align="left" variant="purple" {...getSortProps('my_purchases_qty')}>
                    Achat Qté <span className="block text-[9px] opacity-70 font-normal normal-case">Moi vs Groupe</span>
                </TableHeaderCell>

                <TableHeaderCell align="left" variant="blue" className="border-l border-gray-200" {...getSortProps('my_sales_ttc')}>
                    Vente TTC <span className="block text-[9px] opacity-70 font-normal normal-case">Moi vs Groupe</span>
                </TableHeaderCell>
                <TableHeaderCell align="left" variant="blue" {...getSortProps('my_sales_qty')}>
                    Vente Qté <span className="block text-[9px] opacity-70 font-normal normal-case">Moi vs Groupe</span>
                </TableHeaderCell>

                <TableHeaderCell align="left" variant="orange" className="border-l border-gray-200" {...getSortProps('my_margin_rate')}>
                    Marge % <span className="block text-[9px] opacity-70 font-normal normal-case">Moi vs Groupe</span>
                </TableHeaderCell>
                <TableHeaderCell align="left" variant="green" {...getSortProps('my_pdm_pct')}>
                    Part de Marché <span className="block text-[9px] opacity-70 font-normal normal-case">Moi vs Groupe</span>
                </TableHeaderCell>
            </tr>
        </thead>
    );
};
