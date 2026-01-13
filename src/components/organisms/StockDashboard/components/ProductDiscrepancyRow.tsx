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

    // Use parent calculated value if available (for sorting consistency), else calculate locally
    const qtyToOrder = row.qte_a_commander !== undefined 
        ? row.qte_a_commander 
        : getQtyToOrder(row.qte_vendue, row.stock_actuel);
        
    const isUrgent = qtyToOrder > 0;
    
    // Use parent calculated ventes_par_mois if available
    const ventesParMois = row.ventes_par_mois !== undefined
        ? row.ventes_par_mois
        : (row.qte_vendue / daysInPeriod) * 30;

    return (
        <tr
            onClick={onClick}
            className="group hover:bg-purple-50/30 transition-colors cursor-pointer border-b border-gray-50 last:border-none"
        >
            {/* Product Info - Matching RestockingTable Style */}
            <TableCell>
                <div className="flex flex-col max-w-[300px]">
                    <span className="font-medium text-gray-900 truncate text-xs" title={row.product_name}>
                        {row.product_name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                            {row.product_code}
                        </span>
                        <span className="text-[10px] text-blue-600 truncate max-w-[150px]">
                            {row.laboratory_name}
                        </span>
                    </div>
                </div>
            </TableCell>

            <TableCell align="right" className="text-xs">{formatNumber(row.qte_commandee)}</TableCell>
            <TableCell align="right" className="text-xs">{formatNumber(row.qte_receptionnee)}</TableCell>

            <TableCell align="right" className={`text-xs ${row.ecart_qte < 0 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                {formatNumber(row.ecart_qte)}
            </TableCell>

            <TableCell align="right" className={`text-xs ${row.taux_reception < 80 ? 'text-orange-600' : 'text-green-600'}`}>
                {row.taux_reception?.toFixed(1)}%
            </TableCell>

            <TableCell align="right" className="text-xs">{formatCurrency(row.prix_achat)}</TableCell>

            <TableCell align="right" className="text-xs">{formatNumber(row.stock_actuel)}</TableCell>
            <TableCell align="right" className="text-xs">{formatNumber(row.stock_moyen)}</TableCell>
            <TableCell align="right" className="text-xs">{Math.round(row.jours_de_stock)}j</TableCell>

            {/* A Commander Dynamic - Urgent Purple */}
            <TableCell align="right" className={`text-xs ${isUrgent ? 'bg-purple-50/50' : ''}`}>
                <span className={`font-bold ${isUrgent ? 'text-purple-700' : 'text-gray-300'}`}>
                    {qtyToOrder > 0 ? formatNumber(qtyToOrder) : '-'}
                </span>
            </TableCell>

            <TableCell align="right" className="text-xs">{formatNumber(row.qte_vendue)}</TableCell>
            {/* Ventes / Mois (Calculated) */}
            <TableCell align="right" className="text-xs text-blue-600 font-medium">
                {formatNumber(ventesParMois)}
            </TableCell>
            <TableCell align="right" className="text-xs">{formatCurrency(row.prix_vente_moyen)}</TableCell>

            <TableCell align="right">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${row.marge_moyen_pct < 20 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {row.marge_moyen_pct?.toFixed(1)}%
                </span>
            </TableCell>
        </tr>
    );
};
