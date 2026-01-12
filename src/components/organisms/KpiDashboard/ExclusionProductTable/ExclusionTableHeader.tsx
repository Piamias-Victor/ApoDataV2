import React from 'react';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';

interface TableHeaderProps {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSort?: (column: string) => void;
}

export const ExclusionTableHeader: React.FC<TableHeaderProps> = ({ sortBy, sortOrder, onSort }) => {

    const getSortProps = (column: string) => ({
        isSortable: true,
        sortDirection: (sortBy === column ? sortOrder : null) || null,
        onSort: () => onSort?.(column)
    });

    return (
        <thead className="bg-gray-50/80 backdrop-blur sticky top-0 z-10 border-b border-gray-100">
            <tr>
                <TableHeaderCell isSticky width="18%" {...getSortProps('product_name')}>Produit</TableHeaderCell>
                
                {/* Achats - Purple */}
                <TableHeaderCell align="right" variant="purple" width="6%" {...getSortProps('my_purchases_ht')}>Achat HT</TableHeaderCell>
                <TableHeaderCell align="right" variant="purple" width="5%" {...getSortProps('my_purchases_qty')}>Achat Qte</TableHeaderCell>
                
                {/* Ventes - Blue */}
                <TableHeaderCell align="right" variant="blue" width="6%" {...getSortProps('my_sales_ttc')}>Vente TTC</TableHeaderCell>
                <TableHeaderCell align="right" variant="blue" width="5%" {...getSortProps('my_sales_qty')}>Vente Qte</TableHeaderCell>
                
                {/* Marges - Orange */}
                <TableHeaderCell align="right" variant="orange" width="6%" {...getSortProps('my_margin_ht')}>Marge €</TableHeaderCell>
                <TableHeaderCell align="right" variant="orange" width="5%" {...getSortProps('my_margin_rate')}>Marge %</TableHeaderCell>
                
                {/* Prix - Pink */}
                <TableHeaderCell align="right" variant="pink" width="6%" {...getSortProps('avg_purchase_price')}>PA.HT Moy</TableHeaderCell>
                <TableHeaderCell align="right" variant="pink" width="6%" {...getSortProps('avg_sell_price')}>PV.TTC Moy</TableHeaderCell>
                <TableHeaderCell align="right" variant="pink" width="6%" {...getSortProps('prix_brut')}>P.Fab</TableHeaderCell>

                {/* Simulation Loss - Red Attention */}
                <TableHeaderCell align="right" variant="red" width="8%">Perte Estimée</TableHeaderCell>
            </tr>
        </thead>
    );
};
