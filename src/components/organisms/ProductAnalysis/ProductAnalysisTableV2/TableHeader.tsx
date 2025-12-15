import React from 'react';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';

export const TableHeader = () => {
    return (
        <thead className="bg-gray-50/80 backdrop-blur sticky top-0 z-10 border-b border-gray-100">
            <tr>
                <TableHeaderCell width="14%">Produit</TableHeaderCell>
                <TableHeaderCell width="4%" align="center">Rang</TableHeaderCell>

                {/* Achats - Purple */}
                <TableHeaderCell align="right" variant="purple" width="8%">Achat HT</TableHeaderCell>
                <TableHeaderCell align="right" variant="purple" width="7%">Achat Qte</TableHeaderCell>
                <TableHeaderCell align="right" variant="green" width="8%">PDM Achat</TableHeaderCell>

                {/* Ventes - Blue */}
                <TableHeaderCell align="right" variant="blue" width="8%">Vente TTC</TableHeaderCell>
                <TableHeaderCell align="right" variant="blue" width="7%">Vente Qte</TableHeaderCell>
                <TableHeaderCell align="right" variant="green" width="8%">PDM Vente</TableHeaderCell>

                {/* Marges - Orange */}
                <TableHeaderCell align="right" variant="orange" width="8%">Marge €</TableHeaderCell>
                <TableHeaderCell align="right" variant="orange" width="7%">Marge %</TableHeaderCell>

                {/* Prix - Pink */}
                <TableHeaderCell align="right" variant="pink" width="8%">PA.HT Moy</TableHeaderCell>
                <TableHeaderCell align="right" variant="pink" width="8%">PV.TTC Moy</TableHeaderCell>

                {/* Stock - Red */}
                <TableHeaderCell align="right" variant="red" width="8%">Stock €</TableHeaderCell>
                <TableHeaderCell align="right" variant="red" width="7%">Stock Qte</TableHeaderCell>
                <TableHeaderCell align="right" variant="red" width="6%">J.Stock</TableHeaderCell>
            </tr>
        </thead>
    );
};
