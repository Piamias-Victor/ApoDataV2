import React from 'react';
import { ProductAnalysisRow } from '@/types/kpi';
import { ValueCell } from '@/components/molecules/Table/ValueCell';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { formatCurrency } from '@/lib/utils/formatters';

interface TableRowProps {
    row: ProductAnalysisRow;
    simulationDiscount: number;
}

export const ExclusionTableRow: React.FC<TableRowProps> = ({ row, simulationDiscount }) => {
    
    // Calculate Per Product Loss
    // Logic: Manufacturer Price * Qty Purchased * (Discount / 100)
    const manufacturerPrice = row.prix_brut || 0;
    const qtyPurchased = row.my_purchases_qty || 0;
    const estimatedLoss = (manufacturerPrice * qtyPurchased) * (simulationDiscount / 100);

    return (
        <tr className="hover:bg-red-50/30 transition-colors group border-b border-gray-50 last:border-0">
            {/* Product Info */}
            <TableCell isSticky>
                <div className="flex flex-col max-w-[180px]">
                    <span className="font-medium text-gray-900 truncate text-xs block" title={row.product_name}>
                        {row.product_name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                            {row.ean13}
                        </span>
                        <span className="text-[10px] text-blue-600 truncate flex-1 block">
                            {row.laboratory_name}
                        </span>
                    </div>
                </div>
            </TableCell>

            {/* Achat HT & Qty - Purple */}
            <TableCell align="right" variant="purple">
                <ValueCell value={row.my_purchases_ht} evolution={row.my_purchases_evolution} isCurrency textSize="text-xs" />
            </TableCell>
            <TableCell align="right" variant="purple">
                <ValueCell value={row.my_purchases_qty} evolution={row.my_purchases_qty_evolution} textSize="text-xs" />
            </TableCell>

            {/* Vente TTC & Qty - Blue */}
            <TableCell align="right" variant="blue">
                <ValueCell value={row.my_sales_ttc} evolution={row.my_sales_evolution} isCurrency textSize="text-xs" />
            </TableCell>
            <TableCell align="right" variant="blue">
                <ValueCell value={row.my_sales_qty} evolution={row.my_sales_qty_evolution} textSize="text-xs" />
            </TableCell>

            {/* Marge - Orange */}
            <TableCell align="right" variant="orange">
                <ValueCell value={row.my_margin_ht} evolution={row.my_margin_ht_evolution} isCurrency textSize="text-xs" />
            </TableCell>
            <TableCell align="right" variant="orange">
                <ValueCell value={row.my_margin_rate} evolution={row.my_margin_rate_evolution} suffix="%" textSize="text-xs" />
            </TableCell>

            {/* Prix - Neutral */}
            <TableCell align="right">
                <div className="font-medium text-gray-700 text-xs">
                    {row.avg_purchase_price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </div>
            </TableCell>
            <TableCell align="right">
                <div className="font-medium text-gray-700 text-xs">
                    {row.avg_sell_price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </div>
            </TableCell>
             <TableCell align="right">
                <div className="font-medium text-gray-500 text-xs">
                    {row.prix_brut?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </div>
            </TableCell>
            
            {/* Estimated Loss - Red */}
             <TableCell align="right" variant="red">
                <div className="font-bold text-red-600 text-xs">
                    {formatCurrency(estimatedLoss)}
                </div>
            </TableCell>
        </tr>
    );
};
