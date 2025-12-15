import React from 'react';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';

export const LaboratoryTableHeader = () => {
    return (
        <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm">
                <TableHeaderCell width="12rem">Laboratoire</TableHeaderCell>
                <TableHeaderCell align="center">Rang</TableHeaderCell>

                {/* Grouped Columns with Sub-headers */}
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
