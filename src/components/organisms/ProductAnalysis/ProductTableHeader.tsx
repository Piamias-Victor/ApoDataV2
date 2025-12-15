import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';
import React from 'react';

export const ProductTableHeader = () => {
    return (
        <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm">
                <TableHeaderCell width="12rem">Produit</TableHeaderCell>
                <TableHeaderCell width="8rem" className="hidden md:table-cell">Labo</TableHeaderCell>
                <TableHeaderCell align="center">Rang</TableHeaderCell>

                {/* Grouped Columns */}
                <TableHeaderCell align="left" variant="purple" className="border-l border-gray-200">
                    Achat HT <span className="block text-[9px] opacity-70 font-normal normal-case">Moi vs Groupe</span>
                </TableHeaderCell>
                <TableHeaderCell align="left" variant="purple">
                    Achat Qté <span className="block text-[9px] opacity-70 font-normal normal-case">Moi vs Groupe</span>
                </TableHeaderCell>

                <TableHeaderCell align="left" variant="blue" className="border-l border-gray-200">
                    Vente TTC <span className="block text-[9px] opacity-70 font-normal normal-case">Moi vs Groupe</span>
                </TableHeaderCell>
                <TableHeaderCell align="left" variant="blue">
                    Vente Qté <span className="block text-[9px] opacity-70 font-normal normal-case">Moi vs Groupe</span>
                </TableHeaderCell>

                <TableHeaderCell align="left" variant="orange" className="border-l border-gray-200">
                    Marge % <span className="block text-[9px] opacity-70 font-normal normal-case">Moi vs Groupe</span>
                </TableHeaderCell>
                <TableHeaderCell align="left" variant="green">
                    Part de Marché <span className="block text-[9px] opacity-70 font-normal normal-case">Moi vs Groupe</span>
                </TableHeaderCell>
            </tr>
        </thead>
    );
};
