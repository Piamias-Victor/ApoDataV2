import React from 'react';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { formatNumber, formatCurrency } from '@/lib/utils/formatters';

export interface ProductDiscrepancyRowProps {
    row: any; // Type from repository via prop
    onClick: (e: React.MouseEvent) => void;
    targetDays: number;
    daysInPeriod: number;
}

export const ProductDiscrepancyRow: React.FC<ProductDiscrepancyRowProps> = ({ row, onClick, targetDays, daysInPeriod }) => {

    const getQtyToOrder = (salesQty: number, currentStock: number) => {
        const avgDailySales = Math.max(0, salesQty) / daysInPeriod;
        const targetStock = avgDailySales * targetDays;
        const needed = targetStock - currentStock;
        return Math.round(Math.max(0, needed));
    };

    const qtyToOrder = getQtyToOrder(row.qte_vendue, row.stock_actuel);
    const isUrgent = qtyToOrder > 0;

    return (
        <tr
            onClick={onClick}
            className="group hover:bg-slate-50/50 transition-colors cursor-pointer border-b border-gray-50 last:border-none"
        >
            <TableCell className="font-medium text-gray-900 truncate max-w-[200px]">
                <div title={`${row.product_name} (${row.product_code})`} className="flex flex-col">
                    <span>{row.product_name}</span>
                    <span className="text-[10px] text-gray-400 font-normal">{row.laboratory_name}</span>
                </div>
            </TableCell>

            <TableCell align="right">{formatNumber(row.qte_commandee)}</TableCell>
            <TableCell align="right">{formatNumber(row.qte_receptionnee)}</TableCell>

            <TableCell align="right" className={row.ecart_qte < 0 ? 'text-red-600 font-bold' : 'text-gray-500'}>
                {formatNumber(row.ecart_qte)}
            </TableCell>

            <TableCell align="right" className={row.taux_reception < 80 ? 'text-orange-600' : 'text-green-600'}>
                {row.taux_reception?.toFixed(1)}%
            </TableCell>

            <TableCell align="right">{formatCurrency(row.prix_achat)}</TableCell>

            <TableCell align="right">{formatNumber(row.stock_actuel)}</TableCell>
            <TableCell align="right">{formatNumber(row.stock_moyen)}</TableCell>
            <TableCell align="right">{Math.round(row.jours_de_stock)}j</TableCell>

            {/* A Commander Dynamic */}
            <TableCell align="right" className={isUrgent ? 'bg-indigo-50/50' : ''}>
                <span className={`font-bold ${isUrgent ? 'text-indigo-700' : 'text-gray-300'}`}>
                    {qtyToOrder > 0 ? formatNumber(qtyToOrder) : '-'}
                </span>
            </TableCell>

            <TableCell align="right">{formatNumber(row.qte_vendue)}</TableCell>
            <TableCell align="right">{formatCurrency(row.prix_vente_moyen)}</TableCell>

            <TableCell align="right">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${row.marge_moyen_pct < 20 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {row.marge_moyen_pct?.toFixed(1)}%
                </span>
            </TableCell>
        </tr>
    );
};
